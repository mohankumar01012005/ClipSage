// routes/aivideoSummary.js
import express from "express";
import { YoutubeTranscript } from "@danielxceron/youtube-transcript";
import { GoogleGenAI } from "@google/genai";
import User from "../models/user.js";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();
const ai = new GoogleGenAI({ apiKey: process.env.GENAI_API_KEY });

// Cache for transcripts and summaries
const cache = new Map();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

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
  } catch { }
  return null;
}

/* ---------------- Fetch Transcript with Cache ---------------- */
async function fetchTranscriptText(videoId) {
  const cacheKey = `transcript-${videoId}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const parts = await YoutubeTranscript.fetchTranscript(videoId);
  if (!Array.isArray(parts)) throw new Error("No transcript parts returned");

  const transcript = parts.map((p) => (p && p.text ? p.text.trim() : "")).filter(Boolean).join(" ");

  cache.set(cacheKey, {
    data: transcript,
    timestamp: Date.now()
  });

  return transcript;
}

/* ---------------- Build Prompts ---------------- */
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

### 5. Future Integration Plan

#### Content Type
[Specify the content type: educational/technical, motivational, personal growth, productivity, interview-prep, career-skills, domain-theory]

#### Role-Based Advice
[Provide concrete actionable steps for different roles like Junior Developer, Student, etc.]

#### Exam Preparation (if the topic is related to education)
[How to study/apply this content for exams]
if this topic has 
#### Interview Preparation  
[How to use these ideas to prepare answers or demonstrate skill]

#### Daily Routine Integration
[Micro-habits or practices to integrate this content daily]

#### Projects & Practice
[Project ideas or practice tasks to apply the content]

#### One-Sentence Pitch
[One sentence telling why this matters to the user's future]

---
Video Title: ${title || "Not available"}
Video URL: ${url}

Transcript:
${transcript}
`;
}

function buildTitlePrompt(transcript) {
  const shortTranscript = transcript.length > 2000
    ? transcript.substring(0, 1500) + "...[truncated]"
    : transcript;

  return `
You are an assistant that generates a short (2-6 words), descriptive, and clean video title based ONLY on the transcript below.
Return only the title on a single line, without extra commentary.

Transcript:
${shortTranscript}
`;
}

/* ---------------- Gemini helper with Timeout ---------------- */
async function summarizeWithGemini(prompt, opts = {}) {
  const { model = "gemini-2.0-flash", timeout = 30000 } = opts;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    }, { signal: controller.signal });

    clearTimeout(timeoutId);

    const text =
      response?.output?.[0]?.text ||
      response?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("\n") ||
      response?.candidates?.[0]?.content ||
      response?.text ||
      null;

    if (!text) {
      return JSON.stringify(response);
    }
    return text;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Gemini API timeout after ${timeout}ms`);
    }
    throw error;
  }
}

/* ---------------- Optimized Route ---------------- */
router.post("/summarize/:userId", async (req, res) => {
  req.setTimeout(60000);

  try {
    const userId = req.params.userId;
    const { youtubeUrl, title = "" } = req.body ?? {};

    const userDoc = await User.findById(userId);
    if (!userDoc) return res.status(404).json({ error: "User not found" });

    if (!youtubeUrl) return res.status(400).json({ error: "youtubeUrl is required" });

    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) return res.status(400).json({ error: "Invalid YouTube URL or ID" });

    const cacheKey = `summary-${videoId}`;
    const cachedSummary = cache.get(cacheKey);
    if (cachedSummary && Date.now() - cachedSummary.timestamp < CACHE_TTL) {
      return res.json({
        message: "Video summarized successfully (from cache)",
        video: { url: youtubeUrl, title: cachedSummary.data.finalTitle },
        chat: cachedSummary.data.chatObj,
        transcript: "[cached]",
        summary: cachedSummary.data.summary,
        cached: true
      });
    }

    let transcript = "";
    try {
      transcript = await fetchTranscriptText(videoId);
    } catch (err) {
      console.error("Transcript Fetch Error →", err);
      return res.status(500).json({ error: "Failed to fetch transcript", detail: String(err?.message || err) });
    }

    if (transcript.length < 50) {
      return res.status(400).json({ error: "Transcript too short or unavailable" });
    }

    const MAX_CHARS = 12000;
    if (transcript.length > MAX_CHARS) {
      const head = transcript.slice(0, Math.floor(MAX_CHARS * 0.7));
      const tail = transcript.slice(-Math.floor(MAX_CHARS * 0.3));
      transcript = `${head}\n\n[...trimmed...]\n\n${tail}`;
    }

    // 1) Generate title first
    let finalTitle = title && title.trim() ? title.trim() : null;
    if (!finalTitle) {
      try {
        const rawTitle = await summarizeWithGemini(
          buildTitlePrompt(transcript),
          { model: "gemini-2.0-flash", timeout: 10000 }
        );
        finalTitle = String(rawTitle).split("\n")[0].trim() || "Untitled Video";
      } catch (err) {
        console.warn("Title gen failed:", err);
        finalTitle = "Untitled Video";
      }
    }

    // 2) Generate complete summary with future integration included
    let completeSummary;
    try {
      const summaryPrompt = buildVideoSummaryPrompt({
        url: youtubeUrl,
        title: finalTitle,
        transcript
      });
      completeSummary = await summarizeWithGemini(summaryPrompt, { timeout: 30000 });
    } catch (err) {
      console.error("Summary generation failed:", err);
      return res.status(500).json({ error: "Failed to generate summary", detail: String(err.message) });
    }

    // Create chat object according to your exact schema
    const chatObj = {
      video: youtubeUrl,
      title: finalTitle,
      summary: completeSummary, // This includes everything: summary + future integration
      messages: [], // Empty array as required
      lastMessageAt: new Date()
    };

    // Cache the result
    cache.set(cacheKey, {
      data: {
        finalTitle,
        summary: completeSummary,
        chatObj
      },
      timestamp: Date.now()
    });

    // Save to user
    userDoc.userChats = Array.isArray(userDoc.userChats) ? userDoc.userChats : [];
    userDoc.userChats.push(chatObj);

    // Save user (non-blocking)
    userDoc.save().catch(err => console.error("Background save error:", err));

    return res.json({
      message: "Video summarized successfully",
      video: { url: youtubeUrl, title: finalTitle },
      chat: chatObj,
      transcript: transcript.length > 500 ? "[truncated in response]" : transcript,
      summary: completeSummary,
      processingTime: "optimized"
    });

  } catch (err) {
    console.error("Summarize Error →", err);
    return res.status(500).json({ error: String(err?.message || err) });
  }
});

/* ---------------- Get All User Chats ---------------- */
router.get("/chats/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    const userDoc = await User.findById(userId).select("userChats");
    if (!userDoc) {
      return res.status(404).json({ error: "User not found" });
    }

    const chats = userDoc.userChats.map(chat => ({
      _id: chat._id,
      title: chat.title,
      video: chat.video,
      summary: chat.summary,
      messageCount: chat.messages.length,
      lastMessageAt: chat.lastMessageAt,
      createdAt: chat.createdAt
    }));

    return res.json({
      chats: chats
    });

  } catch (err) {
    console.error("Get Chats Error →", err);
    return res.status(500).json({ error: String(err?.message || err) });
  }
});

/* ---------------- Get Specific Chat ---------------- */
router.get("/chat/:userId/:chatId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const chatId = req.params.chatId;

    const userDoc = await User.findById(userId);
    if (!userDoc) {
      return res.status(404).json({ error: "User not found" });
    }

    const chat = userDoc.userChats.id(chatId);
    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    return res.json({
      chat: {
        _id: chat._id,
        title: chat.title,
        video: chat.video,
        summary: chat.summary,
        messages: chat.messages,
        lastMessageAt: chat.lastMessageAt,
        createdAt: chat.createdAt
      }
    });

  } catch (err) {
    console.error("Get Chat Error →", err);
    return res.status(500).json({ error: String(err?.message || err) });
  }
});

export default router;