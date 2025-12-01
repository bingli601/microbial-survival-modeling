const dotenv = require("dotenv");
dotenv.config();
const { URL } = require('url');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || "gemini-pro";

if (!GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is not set in environment variables");
}

const userSessions = {};

async function callGeminiAPI(sessionId, userText, data, fitResult) {
    let history = userSessions[sessionId] || [];

    let combinedMessage = userText;

    if (data && data.length > 0) {
        const dataSample = data.slice(0, 10);
        combinedMessage = `Here is a sample of the dataset (first 10 rows):\n${JSON.stringify(dataSample, null, 2)}\n\nUser question: ${combinedMessage}`;
    }

    if (fitResult) {
        combinedMessage = `Here are the model fitting results:\n${JSON.stringify(fitResult, null, 2)}\n\n${combinedMessage}`;
    }
  
    history.push({ role: "user", parts: [{ text: combinedMessage }] });

    const payload = {
        contents: history,
        systemInstruction: {
            parts: [
                {
                    text: `You are a helpful AI data assistant. Your primary role is to analyze the provided dataset and model fitting results. Keep responses concise and insightful. Use the data and fit results provided in the prompt to answer the user's question.`
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

    if (result.error) {
        console.error("Gemini API Error:", result.error);
        throw new Error(`Gemini API Error: ${result.error.message || "Unknown error"}`);
    }

    const aiText =
        result?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "I couldn't generate a response right now. Please check the server logs.";

    history.push({ role: "model", parts: [{ text: aiText }] });
    userSessions[sessionId] = history;

    return aiText;
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.statusCode = 200;
        return res.end();
    }
    
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    
    if (req.method === 'GET' && parsedUrl.pathname === '/api/health') {
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 200;
        return res.end(JSON.stringify({ status: "healthy", model: MODEL }));
    }
    
    if (req.method === 'POST' && parsedUrl.pathname === '/api/messages') {
        let body = '';
        
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', async () => {
            try {
                const { data, text, sessionId, fitResult } = JSON.parse(body);

                if (!text || !sessionId) {
                    res.statusCode = 400;
                    res.end(JSON.stringify({ error: "Missing text or sessionId in body." }));
                    return;
                }
                
                const aiReply = await callGeminiAPI(sessionId, text, data, fitResult); 
                
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 200;
                res.end(JSON.stringify({ text: aiReply }));

            } catch (err) {
                console.error("Error processing message:", err.message);
                res.statusCode = 500;
                res.end(JSON.stringify({ error: err.message }));
            }
        });
        return;
    }
    
    res.statusCode = 404;
    res.end(JSON.stringify({ error: "API Route Not Found" }));
};