import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend')));

// Initialize Google Gen AI lazily or using direct key
const apiKey = process.env.GEMINI_API_KEY;
let genAI = null;
if (apiKey && apiKey !== 'your_api_key_here') {
  genAI = new GoogleGenerativeAI(apiKey);
}

// Fallback helper to get Gen AI client
function getGenAI() {
  if (genAI) return genAI;
  
  const envKey = process.env.GEMINI_API_KEY;
  if (envKey && envKey !== 'your_api_key_here') {
    genAI = new GoogleGenerativeAI(envKey);
    return genAI;
  }
  
  throw new Error("GEMINI_API_KEY is not configured. Please set it in backend/.env file.");
}

// POST /api/generate-futureme
app.post('/api/generate-futureme', async (req, res) => {
  try {
    const { name, age, goal, struggle, oneYearVision, tone } = req.body;
    if (!name || !age || !goal || !struggle || !oneYearVision || !tone) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    const ai = getGenAI();
    // Using responseMimeType: "application/json" forces JSON output format
    const model = ai.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const systemPrompt = `You are FutureMe, the future successful version of the user. You are not a generic motivational coach. You speak with emotional intelligence, clarity, and deep personal understanding. Your job is to help the user see who they are becoming, what they must change, and what they should do next.

Write as if you are the user’s future self speaking directly to their current self.

Tone selected by user: ${tone}

User details:
Name: ${name}
Age: ${age}
Goal: ${goal}
Current struggle: ${struggle}
One-year vision: ${oneYearVision}

Return only valid JSON in this exact format:
{
  "message": "A powerful 120-180 word message from the future self.",
  "futureIdentity": "A concise description of who the user is becoming.",
  "nextMoves": ["Action 1", "Action 2", "Action 3"],
  "habit": "One small daily habit they should start today.",
  "warning": "One mistake their future self warns them about.",
  "mantra": "A short memorable line they can repeat daily."
}

Make it specific. Avoid generic motivation. Avoid clichés. Make it emotional but practical.`;

    const result = await model.generateContent(systemPrompt);
    const responseText = result.response.text();

    // Clean JSON response block if AI added markdown code fences
    let cleanedText = responseText.trim();
    if (cleanedText.includes('```')) {
      const startIdx = cleanedText.indexOf('{');
      const endIdx = cleanedText.lastIndexOf('}');
      if (startIdx !== -1 && endIdx !== -1) {
        cleanedText = cleanedText.substring(startIdx, endIdx + 1);
      }
    }

    let parsedData;
    try {
      parsedData = JSON.parse(cleanedText);
    } catch (parseErr) {
      console.error("Failed to parse Gemini response as JSON. Raw response:", responseText);
      return res.status(500).json({ 
        success: false, 
        error: "FutureMe generated an invalid format. Please try again.",
        raw: responseText
      });
    }

    res.json({
      success: true,
      data: parsedData
    });

  } catch (error) {
    console.error("Error generating FutureMe reflection:", error);
    res.status(500).json({ success: false, error: error.message || "Internal server error" });
  }
});

// POST /api/chat-futureme
app.post('/api/chat-futureme', async (req, res) => {
  try {
    const { userProfile, chatHistory, question } = req.body;
    if (!userProfile || !question) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    const { name, age, goal, struggle, oneYearVision, tone } = userProfile;

    let historyText = "";
    if (chatHistory && chatHistory.length > 0) {
      historyText = chatHistory.map(chat => {
        const roleName = chat.role === 'user' ? name : 'FutureMe';
        return `${roleName}: ${chat.message}`;
      }).join('\n');
    } else {
      historyText = "No previous chat history.";
    }

    const systemPrompt = `You are FutureMe, the future version of the user who already achieved their one-year vision. Reply directly to the user’s question. Be personal, sharp, honest, and useful. Do not sound like a normal AI assistant. Do not mention that you are Gemini or an AI model. Speak like the future self.

User profile:
Name: ${name}
Age: ${age}
Goal: ${goal}
Struggle: ${struggle}
One-year vision: ${oneYearVision}
Tone: ${tone}

Recent chat history:
${historyText}

Current question:
${question}

Reply in 2-5 short paragraphs. Give at least one clear action.`;

    const ai = getGenAI();
    const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(systemPrompt);
    const reply = result.response.text().trim();

    res.json({
      success: true,
      reply: reply
    });

  } catch (error) {
    console.error("Error during FutureMe chat:", error);
    res.status(500).json({ success: false, error: error.message || "Internal server error" });
  }
});

// Serve index.html for any other requests to enable direct routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
  console.log(`FutureMe server is running at http://localhost:${PORT}`);
});
