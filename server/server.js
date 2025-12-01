// import "dotenv/config";
// import express from "express";
// import cors from "cors";
// import fetch from "node-fetch"; // 如果 Node 18+ 可以直接用全局 fetch

// const app = express();
// app.use(cors());
// app.use(express.json());

// // ============================
// // ⚙️ Config
// // ============================

// const PORT = process.env.PORT || 4000;
// const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// const MODEL = process.env.GEMINI_MODEL || "gemini-pro";

// if (!GEMINI_API_KEY) {
//   console.error("❌ GEMINI_API_KEY is not set in .env");
//   process.exit(1);
// }

// // In-memory store for multi-turn conversation
// // Key: sessionId -> Value: Array of { role, parts: [{ text }] }
// const userSessions = {};

// // ============================
// // 🚀 Helper: call Google Gemini API
// // ============================
// async function callGeminiAPI(sessionId, userText, data) {
//   // Retrieve or initialize conversation history
//   let history = userSessions[sessionId] || [];

//   // 把 dataset 和用户提问合并
//   const combinedMessage = data ? 
//   `Here is the dataset:\n${JSON.stringify(data, null, 2)}\n\nUser question: ${userText}` : userText;
//   console.log(combinedMessage)

//   // Append user message
//   history.push({ role: "user", parts: [{ text: combinedMessage }] });

//   // Construct payload
//   const payload = {
//     contents: history,
//     systemInstruction: {
//       parts: [
//         {
//           text: `You are a helpful AI assistant. Keep responses concise and conversational. Remember previous messages in this session.`
//         }
//       ]
//     },
//   };

//   const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;

//   let result;
//   try {
//     const response = await fetch(apiUrl, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(payload),
//     });

//     if (!response.ok) {
//       const text = await response.text();
//       throw new Error(`API error ${response.status}: ${text}`);
//     }

//     result = await response.json();
//   } catch (err) {
//     console.error("❌ Gemini API error:", err);
//     throw new Error("Failed to get response from AI service.");
//   }

//   const aiText = result?.candidates?.[0]?.content?.parts?.[0]?.text || 
//                  "I couldn't generate a response right now.";

//   // Save AI response to history
//   history.push({ role: "model", parts: [{ text: aiText }] });
//   userSessions[sessionId] = history;

//   return aiText;
// }

// // ============================
// // 🚀 Routes
// // ============================

// // POST /api/messages
// app.post("/api/messages", async (req, res) => {
//   const { data, text, sessionId } = req.body;

//   if (!text || !sessionId) {
//     return res.status(400).json({ error: "Missing text or sessionId in request body." });
//   }

//   try {
//     const aiReply = await callGeminiAPI(sessionId, text, data);
//     res.json({ text: aiReply });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // Health check
// app.get("/health", (req, res) => {
//   res.json({ status: "healthy", model: MODEL });
// });

// // Start server
// app.listen(PORT, () => {
//   console.log(`✅ AI chat server running on http://localhost:${PORT}`);
// });
