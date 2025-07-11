// This is our secure middleman function
exports.handler = async function(event, context) {
  // Get the data the game sent (topic, audience, etc.)
  const { topic, audience, age, difficulty, questionsPerRound } = JSON.parse(event.body);
  const apiKey = process.env.GEMINI_API_KEY; // Get the secret key from Netlify's vault

  const prompt = `You are a quizmaster creating an engaging quiz game. Generate ${questionsPerRound} unique and challenging multiple-choice questions.

  - Topic: ${topic}
  - Target Audience: ${audience}
  - Age Group: ${age}
  - Difficulty: ${difficulty}

  Do not repeat questions. Ensure the incorrect options are plausible but clearly wrong.`;

  const schema = {
      type: "ARRAY",
      items: {
          type: "OBJECT",
          properties: {
              question: { type: "STRING" },
              options: { type: "ARRAY", items: { type: "STRING" }, minItems: 3, maxItems: 3 },
              answer: { type: "STRING" }
          },
          required: ["question", "options", "answer"]
      }
  };

  const payload = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
          responseMimeType: "application/json",
          responseSchema: schema,
      }
  };

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const result = await response.json();
    const jsonText = result.candidates[0].content.parts[0].text;

    // Send the questions back to the game
    return {
      statusCode: 200,
      body: jsonText
    };

  } catch (error) {
    console.error("Error in Netlify function:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to generate questions from the AI." })
    };
  }
};
