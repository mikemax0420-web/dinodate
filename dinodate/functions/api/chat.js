export async function onRequestPost({ request }) {
  // ---------------------------------------------------------
  // 🔴 PASTE YOUR GEMINI API KEY HERE (Between the quotes)
  // ---------------------------------------------------------
  const GEMINI_API_KEY = "AIzaSy..."; 

  try {
    // 1. Parse the incoming data from app.js
    const { messages, dinoPersona } = await request.json();

    // 2. Define the Dino's Personality
    // We tell Gemini to act like the specific dinosaur
    const systemPrompt = `
      You are a ${dinoPersona.species || "Dinosaur"}.
      Name: ${dinoPersona.name}.
      Personality: ${dinoPersona.type} - ${dinoPersona.style}.
      
      INSTRUCTIONS:
      - Reply to the user as this dinosaur.
      - Keep responses SHORT (under 2 sentences).
      - Be funny, flirty, or aggressive based on your personality type.
      - Do NOT say you are an AI. You are a dinosaur.
    `;

    // 3. Convert Chat History to Gemini Format
    // Gemini expects roles to be 'user' or 'model' (not 'assistant')
    const geminiHistory = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    // 4. Prepare the API Payload
    const payload = {
      contents: [
        { role: 'user', parts: [{ text: systemPrompt }] }, // Priming the system
        ...geminiHistory
      ],
      generationConfig: {
        maxOutputTokens: 150, // Keep it short
        temperature: 0.9      // High creativity
      }
    };

    // 5. Send to Google
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }
    );

    const data = await response.json();

    // 6. Handle Errors from Google
    if (data.error) {
      console.error("Gemini Error:", data.error);
      return new Response(JSON.stringify({ 
        reply: "*Confused roar* (My AI brain is broken right now.)" 
      }), { headers: { "Content-Type": "application/json" } });
    }

    // 7. Get the text answer
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "*Growls silently*";

    // 8. Send back to the frontend
    return new Response(JSON.stringify({ 
      reply: replyText 
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ 
      reply: "Lost connection to the Jurassic Era. (Server Error)" 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}