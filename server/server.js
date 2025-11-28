// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./dbconnection/dbconnection.js"; // keep your existing DB connection
import { YoutubeTranscript } from "@danielxceron/youtube-transcript";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

/**
 * Polyfill global fetch if it's not available (Node < 18).
 * If you run Node 18+, you can remove the node-fetch import and this block.
 */
try {
  if (typeof fetch === "undefined") {
    // dynamic import to avoid errors if node-fetch isn't installed and Node already has fetch
    const nodeFetch = await import("node-fetch");
    globalThis.fetch = nodeFetch.default ?? nodeFetch;
    console.log("polyfilled global fetch with node-fetch");
  }
} catch (err) {
  console.warn("Could not polyfill fetch automatically:", err.message);
}

const app = express();
const PORT = process.env.PORT || 5005;

app.use(cors());
app.use(express.json());
connectDB();

const ai = new GoogleGenAI({ apiKey: process.env.GENAI_API_KEY });

/* ---- Utility: extract YouTube video id robustly ---- */
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

/* ---- Get transcript text using the youtube-transcript library ---- */
async function fetchTranscriptText(videoId) {
  try {
    // returns array of { text, duration, offset } typically
    const parts = await YoutubeTranscript.fetchTranscript(videoId);
    if (!Array.isArray(parts) || parts.length === 0) {
      throw new Error("No transcript parts returned");
    }
    const fullText = parts.map((p) => p.text?.trim() ?? "").filter(Boolean).join(" ");
    return fullText;
  } catch (err) {
    console.error("Transcript Error →", err.message || err);
    throw err;
  }
}

/* ---- Build a summarization prompt using transcript (not only URL) ---- */
function buildSummaryPrompt({ url, title = "", transcript = "" }) {
  // keep prompt compact and explicit
  return `Summarize the YouTube video and produce:
1) A concise summary (3-5 sentences).
2) Key timestamps (if present) as bullets.
3) 5 actionable takeaways.
4) A short 1-sentence TL;DR.

Video URL: ${url}
Title: ${title}

Transcript:
${transcript}
`;
}

/* ---- Gemini call helper ---- */
async function summarizeWithGemini(prompt) {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: prompt,
  });

  // common response shapes—try the most likely fields
  if (response?.output?.[0]?.text) return response.output[0].text;
  if (response?.candidates?.[0]?.content) return response.candidates[0].content;
  return JSON.stringify(response);
}

/* ---- Main endpoint: summarize ---- */
app.post("/summarize", async (req, res) => {
  try {
    const { youtubeUrl } = req.body;
    if (!youtubeUrl) return res.status(400).json({ error: "youtubeUrl is required" });

    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) return res.status(400).json({ error: "Invalid YouTube URL or ID" });

    // fetch transcript (may throw)
    const transcript = await fetchTranscriptText(videoId);
    console.log("This is the transcript ", transcript)
    // safety: if transcript is huge, trim intelligently (Gemini has input limits)
    const MAX_CHARS = 45_000; // adjust as desired per model limits
    let trimmedTranscript = transcript;
    if (transcript.length > MAX_CHARS) {
      // keep start + end to preserve context
      const head = transcript.slice(0, MAX_CHARS * 0.6);
      const tail = transcript.slice(-Math.floor(MAX_CHARS * 0.4));
      trimmedTranscript = head + "\n\n[...trimmed...]\n\n" + tail;
    }

    const prompt = buildSummaryPrompt({ url: youtubeUrl, transcript: trimmedTranscript });
    const summary = await summarizeWithGemini(prompt);

    return res.json({ videoId, transcript: trimmedTranscript, summary });
  } catch (err) {
    console.error("Summarize Error →", err);
    return res.status(500).json({ error: "Server error", detail: String(err.message ?? err) });
  }
});

app.get("/", (req, res) => {
  res.send("Server is running.");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
