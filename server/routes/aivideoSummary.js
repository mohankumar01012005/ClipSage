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
  } catch {}
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
You are an expert AI educator. Create a concise summary of this YouTube video for students.
Generate ONLY 5-6 bullet points that capture the most important takeaways.

Return STRICTLY in this JSON format:
{
  "bulletPoints": [
    "Bullet point 1",
    "Bullet point 2", 
    "Bullet point 3",
    "Bullet point 4",
    "Bullet point 5",
    "Bullet point 6"
  ]
}

IMPORTANT: 
- Return ONLY valid JSON, no additional text
- Create exactly 5-6 bullet points
- Make each bullet point concise and actionable
- Focus on the most important learning outcomes
- No summaries, no concept breakdowns, no TLDR, no future plans - JUST bullet points

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

/* ---------------- Parse JSON Response ---------------- */
function parseSummaryResponse(responseText) {
  try {
    // Try to parse the response as JSON directly
    return JSON.parse(responseText);
  } catch (jsonErr) {
    // If direct parsing fails, try to extract JSON from the response
    try {
      const jsonStart = responseText.indexOf('{');
      const jsonEnd = responseText.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        const jsonString = responseText.slice(jsonStart, jsonEnd + 1);
        return JSON.parse(jsonString);
      }
    } catch (extractErr) {
      console.error("JSON extraction failed:", extractErr);
    }
    
    // If all parsing fails, return a structured error response
    return {
      bulletPoints: ["Unable to generate bullet points. Please try again."]
    };
  }
}

/* ---------------- Format Bullet Points for Display ---------------- */
function formatBulletPointsForDisplay(parsedData) {
  if (!parsedData || !parsedData.bulletPoints || !Array.isArray(parsedData.bulletPoints)) {
    return "• Unable to generate summary\n• Please try again";
  }

  return parsedData.bulletPoints.map(point => `• ${point}`).join('\n');
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
        bulletPoints: cachedSummary.data.bulletPoints,
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

    // 2) Generate bullet points
    let aiResponse;
    try {
      const summaryPrompt = buildVideoSummaryPrompt({ 
        url: youtubeUrl, 
        title: finalTitle, 
        transcript 
      });
      aiResponse = await summarizeWithGemini(summaryPrompt, { timeout: 30000 });
    } catch (err) {
      console.error("Summary generation failed:", err);
      return res.status(500).json({ error: "Failed to generate summary", detail: String(err.message) });
    }

    // Parse the JSON response
    const parsedData = parseSummaryResponse(aiResponse);
    
    // Format for display in the summary field
    const formattedSummary = formatBulletPointsForDisplay(parsedData);

    // Create chat object according to your exact schema
    const chatObj = {
      video: youtubeUrl,
      title: finalTitle,
      summary: formattedSummary, // This is just the bullet points
      messages: [],
      lastMessageAt: new Date()
    };

    // Cache the result
    cache.set(cacheKey, {
      data: {
        finalTitle,
        summary: formattedSummary,
        bulletPoints: parsedData.bulletPoints, // Store the raw bullet points array
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
      bulletPoints: parsedData.bulletPoints, // Return the raw array for easy use
      transcript: transcript.length > 500 ? "[truncated in response]" : transcript,
      summary: formattedSummary,
      processingTime: "optimized"
    });

  } catch (err) {
    console.error("Summarize Error →", err);
    return res.status(500).json({ error: String(err?.message || err) });
  }
});


/* ---------------- Chat with AI about the Video ---------------- */
router.post("/chat/:userId/:chatId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const chatId = req.params.chatId;
    const { userMessage } = req.body;

    if (!userMessage || !userMessage.trim()) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Find user
    const userDoc = await User.findById(userId);
    if (!userDoc) {
      return res.status(404).json({ message: "User Not Found" });
    }

    // Find the specific chat
    const currentChat = userDoc.userChats.id(chatId);
    if (!currentChat) {
      return res.status(404).json({ message: "Chat Not Found" });
    }

    // Create user message object
    const userRoleMessage = {
      role: "user",
      content: userMessage.trim(),
      timestamp: new Date()
    };

    // Prepare prompt for AI using the chat summary
    const chatPrompt = `
You are an AI learning assistant helping a student understand the video: "${currentChat.title}"

VIDEO CONTENT:
${currentChat.summary}

STUDENT'S QUESTION: ${userMessage}

Instructions:
- Answer based ONLY on the video content provided above
- Be concise and educational (2-4 paragraphs max)
- Focus on practical applications and key insights
- If the question is outside the video scope, politely redirect to the video content
- Use simple, clear language suitable for students

Answer:
`;

    // Get AI response
    let aiMessage;
    try {
      aiMessage = await summarizeWithGemini(chatPrompt, { timeout: 15000 });
    } catch (err) {
      console.error("AI Response Error:", err);
      aiMessage = "I apologize, but I'm having trouble generating a response right now. Please try again later.";
    }

    // Create bot message object
    const botRoleMessage = {
      role: "bot",
      content: aiMessage,
      timestamp: new Date()
    };

    // Add messages to chat
    currentChat.messages.push(userRoleMessage);
    currentChat.messages.push(botRoleMessage);
    
    // Update last message timestamp
    currentChat.lastMessageAt = new Date();

    // Save the updated user document
    await userDoc.save();

    return res.json({
      message: "Chat response generated successfully",
      userMessage: userRoleMessage,
      botMessage: botRoleMessage,
      chatId: chatId
    });

  } catch (err) {
    console.error("Chat Error →", err);
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