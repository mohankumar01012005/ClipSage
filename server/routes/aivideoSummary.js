// routes/aivideoSummary.js
import express from "express";
import { YoutubeTranscript } from "@danielxceron/youtube-transcript";
import { GoogleGenAI } from "@google/genai";
import Video from "../models/video.js"; 

const router = express.Router();
const ai = new GoogleGenAI({ apiKey: process.env.GENAI_API_KEY });

/* ---------------- Extract Video ID ---------------- */
function extractVideoId(urlOrId) {
  if (!urlOrId) return null;

  const maybeId = urlOrId.trim();
  if (/^[A-Za-z0-9_-]{10,}$/.test(maybeId)) return maybeId;

  const regex = /(?:v=|\/v\/|\/embed\/|youtu\.be\/|\/shorts\/)([A-Za-z0-9_-]{10,})/;
  const m = urlOrId.match(regex);
  if (m && m[1]) return m[1];

  try {
    const obj = new URL(urlOrId);
    const v = obj.searchParams.get("v");
    if (v) return v;
  } catch {}

  return null;
}

/* ---------------- Fetch Transcript ---------------- */
async function fetchTranscriptText(videoId) {
  const parts = await YoutubeTranscript.fetchTranscript(videoId);
  return parts.map(p => p.text.trim()).filter(Boolean).join(" ");
}

/* ---------------- Build Prompt (Video-Focused) ---------------- */
function buildVideoSummaryPrompt({ title, url, transcript }) {
  return `
You are an expert AI educator. Summarize this YouTube video for an EdTech product that helps students learn faster.

Generate STRICTLY in this format:

### 1. Clean Summary (4–6 sentences)
Explain the video in a simple, clear way.

### 2. Key Insights (5 bullet points)
Direct takeaways a student should remember.

### 3. Concept Breakdown
Explain all important concepts covered in the video in bullet format.

### 4. TL;DR (1 sentence)
Short and crisp.

---
Video Title: ${title || "Not available"}
Video URL: ${url}

Transcript:
${transcript}
  `;
}

/* ---------------- Gemini Summarizer ---------------- */
async function summarizeWithGemini(prompt) {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: prompt,
  });

  // Safely extract text in all known response formats  
  const text =
    response?.output?.[0]?.text ||
    response?.candidates?.[0]?.content?.parts?.map(p => p.text).join("\n") ||
    response?.candidates?.[0]?.content?.parts?.[0]?.text ||
    response?.text ||
    null;

  if (!text) {
    return JSON.stringify(response); // fallback, still string
  }

  return text;
}


// summerise route
router.post("/summarize", async (req, res) => {
  try {
    const { youtubeUrl, title = "" } = req.body;

    if (!youtubeUrl)
      return res.status(400).json({ error: "youtubeUrl is required" });

    const videoId = extractVideoId(youtubeUrl);
    if (!videoId)
      return res.status(400).json({ error: "Invalid YouTube URL" });

    // Fetch transcript
    let transcript = await fetchTranscriptText(videoId);

    // Trim transcript for safety
    const MAX_CHARS = 45000;
    if (transcript.length > MAX_CHARS) {
      transcript =
        transcript.slice(0, MAX_CHARS * 0.6) +
        "\n\n[...trimmed...]\n\n" +
        transcript.slice(-MAX_CHARS * 0.4);
    }

    // Build prompt
    const prompt = buildVideoSummaryPrompt({
      url: youtubeUrl,
      title,
      transcript,
    });

    // Generate AI summary
    const summary = await summarizeWithGemini(prompt);

    // Save in DB (create or update)
    const videoDoc = await Video.findOneAndUpdate(
      { url: youtubeUrl },
      {
        url: youtubeUrl,
        title,
        summary,
        indexedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    res.json({
      message: "Video summarized successfully",
      video: videoDoc,
      transcript,
      summary,
    });
  } catch (err) {
    console.error("Summarize Error →", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
});

export default router;
