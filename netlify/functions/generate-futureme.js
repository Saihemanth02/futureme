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

    const { name, age, goal, struggle, oneYearVision, tone } = JSON.parse(bodyText);
    if (!name || !age || !goal || !struggle || !oneYearVision || !tone) {
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

    const ai = new GoogleGenerativeAI(apiKey);
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

    const parsedData = JSON.parse(cleanedText);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: parsedData
      })
    };

  } catch (error) {
    console.error("Error generating FutureMe reflection:", error);
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
