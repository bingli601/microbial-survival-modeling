import "dotenv/config";
import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

// ============================
// ⚙️ Config
// ============================

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || "gemini-pro";
const API_URL = "/api/messages";
if (!GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY is not set in environment variables");
}

// In-memory store per session
const userSessions = {};

async function callGeminiAPI(sessionId, userText, data) {
  let history = userSessions[sessionId] || [];

  const combinedMessage = data
    ? `Here is the dataset:\n${JSON.stringify(data, null, 2)}\n\nUser question: ${userText}`
    : userText;

  history.push({ role: "user", parts: [{ text: combinedMessage }] });

  const payload = {
    contents: history,
    systemInstruction: {
      parts: [
        {
          text: `You are a helpful AI assistant. Keep responses concise.`
        }
      ]
    }
  };

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const result = await response.json();
  const aiText =
    result?.candidates?.[0]?.content?.parts?.[0]?.text ||
    "I couldn't generate a response right now.";

  history.push({ role: "model", parts: [{ text: aiText }] });
  userSessions[sessionId] = history;

  return aiText;
}

// ============================
// 🚀 Routes
// ============================

//app.post("/messages", async (req, res) => {
app.post(API_URL, async (req, res) => {
  const { data, text, sessionId } = req.body;

  if (!text || !sessionId) {
    return res.status(400).json({ error: "Missing text or sessionId in body." });
  }

  try {
    const aiReply = await callGeminiAPI(sessionId, text, data);
    res.json({ text: aiReply });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/health", (req, res) => {
  res.json({ status: "healthy", model: MODEL });
});

// ❗❗ 关键：不能 app.listen
// export default Express handler for Vercel
export default app;
