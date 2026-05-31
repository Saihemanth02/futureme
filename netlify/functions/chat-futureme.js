const { GoogleGenerativeAI } = require('@google/generative-ai');

exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, error: 'Method Not Allowed' })
    };
  }

  try {
    let bodyText = event.body;
    if (event.isBase64Encoded) {
      bodyText = Buffer.from(event.body, 'base64').toString('utf-8');
    }

    const { userProfile, chatHistory, question } = JSON.parse(bodyText);
    if (!userProfile || !question) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: "Missing required fields" })
      };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: "GEMINI_API_KEY environment variable is not configured. Please configure it in your Netlify site settings." 
        })
      };
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

    const ai = new GoogleGenerativeAI(apiKey);
    const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(systemPrompt);
    const reply = result.response.text().trim();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        reply: reply
      })
    };

  } catch (error) {
    console.error("Error during FutureMe chat:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: error.message || "Internal server error"
      })
    };
  }
};
