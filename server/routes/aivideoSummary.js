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

function buildFutureIntegrationPrompt({ transcript, detectedTitle }) {
  const shortTranscript = transcript.length > 3000 
    ? transcript.substring(0, 2500) + "...[truncated for efficiency]" 
    : transcript;
    
  return `
You are an expert coach and learning-designer. Based ONLY on the transcript below (and the generated title "${detectedTitle}"), determine the content type and produce a "futureIntegration" plan.

The output must be JSON with these exact fields:
{
  "contentType": "<one-line category>",
  "roleAdvice": { "<role>": ["concrete short actionable step 1", "..."] , ... },
  "exams": ["how to study/apply this for exams"],
  "interviews": ["how to use the ideas to prepare answers or demonstrate skill"],
  "dailyRoutine": ["micro-habits or practices to integrate this content daily"],
  "projectsAndPractice": ["project ideas or practice tasks to apply the content"],
  "oneSentencePitch": "<one sentence telling why this matters to the user's future>"
}

Be concise; keep each list to 3–6 items. Use plain text values.
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

/* ---------------- Parallel Processing Helper ---------------- */
async function processInParallel(tasks, maxConcurrent = 2) {
  const results = [];
  const executing = [];
  
  for (const task of tasks) {
    const p = Promise.resolve().then(() => task());
    results.push(p);
    
    const e = p.then(() => executing.splice(executing.indexOf(e), 1));
    executing.push(e);
    
    if (executing.length >= maxConcurrent) {
      await Promise.race(executing);
    }
  }
  
  return Promise.all(results);
}

/* ---------------- Generate Chat Prompt ---------------- */
function buildChatPrompt(chatTitle, summary, futureIntegration, userQuestion) {
  return `
You are an AI learning assistant helping a student understand the video: "${chatTitle}"

VIDEO SUMMARY:
${summary}

FUTURE INTEGRATION PLAN:
${JSON.stringify(futureIntegration, null, 2)}

STUDENT'S QUESTION: ${userQuestion}

Instructions:
- Answer based ONLY on the video content provided above
- Be concise and educational (2-4 paragraphs max)
- Focus on practical applications and key insights
- If the question is outside the video scope, politely redirect to the video content
- Use simple, clear language suitable for students

Answer:
`;
}

/* ---------------- Generate Ready-to-Use Prompt ---------------- */
function generateReadyToUsePrompt(chatTitle, summary, futureIntegration) {
  return `
# AI Learning Assistant Prompt for: "${chatTitle}"

## CONTEXT:
You are an expert AI learning assistant specialized in helping students understand and apply knowledge from educational videos. Use the following video content to answer student questions.

## VIDEO CONTENT:

### SUMMARY:
${summary}

### FUTURE INTEGRATION PLAN:
${JSON.stringify(futureIntegration, null, 2)}

## INSTRUCTIONS FOR AI:

1. **Answer Scope**: Only use information from the video content provided above
2. **Response Style**: 
   - Be concise and educational (2-4 paragraphs maximum)
   - Use simple, clear language suitable for students
   - Focus on practical applications and key insights
   - Provide actionable advice when possible

3. **When Question is Outside Scope**:
   - Politely explain that the question is outside the video content
   - Suggest relevant aspects from the video that might help
   - Do not invent or hallucinate information

4. **Learning Focus**:
   - Emphasize understanding over memorization
   - Connect concepts to real-world applications
   - Suggest practice exercises when relevant
   - Relate to the future integration plan provided

## EXAMPLE RESPONSES:

**Good**: "Based on the video, React components work by... The key insight mentioned was... For practice, you could try..."

**When Outside Scope**: "The video focuses on React fundamentals and doesn't cover advanced state management. However, from the video you learned about... which might help you understand the basics before moving to advanced topics."

**Always maintain**: Professional, educational, and helpful tone while staying strictly within the video content.
`;
}

// ... [Keep all the previous routes: summarize, chat, get-chat, get-chats] ...

/* ---------------- Generate Ready-to-Paste Prompt ---------------- */
router.get("/generate-prompt/:userId/:chatId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const chatId = req.params.chatId;

    // Find user and specific chat
    const userDoc = await User.findById(userId);
    if (!userDoc) {
      return res.status(404).json({ error: "User not found" });
    }

    const chat = userDoc.userChats.id(chatId);
    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    // Generate the ready-to-use prompt
    const readyToUsePrompt = generateReadyToUsePrompt(
      chat.title,
      chat.summary,
      chat.futureIntegretion
    );

    // Update the chat with the generated prompt
    chat.generatedPrompt = readyToUsePrompt;
    await userDoc.save();

    return res.json({
      message: "Prompt generated successfully",
      chatId: chatId,
      title: chat.title,
      generatedPrompt: readyToUsePrompt,
      promptLength: readyToUsePrompt.length
    });

  } catch (err) {
    console.error("Generate Prompt Error →", err);
    return res.status(500).json({ error: String(err?.message || err) });
  }
});

/* ---------------- Get Generated Prompt ---------------- */
router.get("/prompt/:userId/:chatId", async (req, res) => {
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

    if (!chat.generatedPrompt) {
      return res.status(404).json({ error: "No generated prompt found for this chat" });
    }

    return res.json({
      chatId: chatId,
      title: chat.title,
      generatedPrompt: chat.generatedPrompt,
      promptLength: chat.generatedPrompt.length,
      lastUpdated: chat.updatedAt
    });

  } catch (err) {
    console.error("Get Prompt Error →", err);
    return res.status(500).json({ error: String(err?.message || err) });
  }
});

/* ---------------- Auto-Generate Prompt on Summarize ---------------- */
// This function is called automatically when a video is summarized
function autoGeneratePrompt(title, summary, futureIntegration) {
  return generateReadyToUsePrompt(title, summary, futureIntegration);
}

// ... [Rest of your existing routes remain the same] ...

/* ---------------- Optimized Route (Updated with Auto Prompt Generation) ---------------- */
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
        futureIntegration: cachedSummary.data.futureIntegration,
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

    let summary, futureIntegration;
    
    try {
      [summary, futureIntegration] = await processInParallel([
        async () => {
          const summaryPrompt = buildVideoSummaryPrompt({ 
            url: youtubeUrl, 
            title: finalTitle, 
            transcript 
          });
          const result = await summarizeWithGemini(summaryPrompt, { timeout: 25000 });
          return result;
        },
        async () => {
          try {
            const futurePrompt = buildFutureIntegrationPrompt({ 
              transcript, 
              detectedTitle: finalTitle 
            });
            const futureRaw = await summarizeWithGemini(futurePrompt, { timeout: 20000 });

            let parsed = null;
            try {
              parsed = typeof futureRaw === "string" ? JSON.parse(futureRaw) : futureRaw;
            } catch (jsonErr) {
              const jsonStart = futureRaw.indexOf("{");
              const jsonEnd = futureRaw.lastIndexOf("}");
              if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
                const maybe = futureRaw.slice(jsonStart, jsonEnd + 1);
                try {
                  parsed = JSON.parse(maybe);
                } catch (e) {
                  parsed = null;
                }
              }
            }

            if (!parsed) {
              return {
                contentType: "unknown",
                roleAdvice: { default: ["Could not parse model JSON"] },
                exams: ["See raw futureIntegration text"],
                interviews: ["See raw futureIntegration text"],
                dailyRoutine: ["See raw futureIntegration text"],
                projectsAndPractice: ["See raw futureIntegration text"],
                oneSentencePitch: String(futureRaw).slice(0, 200),
                raw: String(futureRaw),
              };
            }

            return {
              contentType: parsed.contentType || "unspecified",
              roleAdvice: parsed.roleAdvice || { default: ["No role-specific advice generated"] },
              exams: parsed.exams || [],
              interviews: parsed.interviews || [],
              dailyRoutine: parsed.dailyRoutine || [],
              projectsAndPractice: parsed.projectsAndPractice || [],
              oneSentencePitch: parsed.oneSentencePitch || "",
            };
          } catch (err) {
            console.error("Future integration generation failed:", err);
            return {
              contentType: "error",
              roleAdvice: { default: ["Future integration generation failed"] },
              exams: [],
              interviews: [],
              dailyRoutine: [],
              projectsAndPractice: [],
              oneSentencePitch: "Future integration unavailable due to generation error.",
            };
          }
        }
      ]);
    } catch (parallelError) {
      console.error("Parallel processing error:", parallelError);
      return res.status(500).json({ error: "AI processing failed", detail: String(parallelError.message) });
    }

    // AUTO-GENERATE THE PROMPT HERE
    const generatedPrompt = autoGeneratePrompt(finalTitle, summary, futureIntegration);

    const chatObj = {
      video: youtubeUrl,
      title: finalTitle,
      summary,
      futureIntegretion: futureIntegration,
      messages: [],
      generatedPrompt: generatedPrompt, // Store the auto-generated prompt
      lastMessageAt: new Date(),
    };

    cache.set(cacheKey, {
      data: {
        finalTitle,
        summary,
        futureIntegration,
        chatObj
      },
      timestamp: Date.now()
    });

    userDoc.userChats = Array.isArray(userDoc.userChats) ? userDoc.userChats : [];
    userDoc.userChats.push(chatObj);
    
    userDoc.save().catch(err => console.error("Background save error:", err));

    return res.json({
      message: "Video summarized successfully",
      video: { url: youtubeUrl, title: finalTitle },
      chat: chatObj,
      transcript: transcript.length > 500 ? "[truncated in response]" : transcript,
      summary,
      futureIntegration,
      generatedPrompt: generatedPrompt, // Also return in response
      processingTime: "optimized"
    });

  } catch (err) {
    console.error("Summarize Error →", err);
    return res.status(500).json({ error: String(err?.message || err) });
  }
});

// ... [Keep all the other existing routes: chat, get-chat, get-chats] ...

export default router;