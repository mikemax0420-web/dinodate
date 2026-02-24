export async function onRequestPost({ request }) {
  // ---------------------------------------------------------
  // 🔴 REPLACE WITH YOUR ACTUAL GEMINI API KEY
  // ---------------------------------------------------------
  const GEMINI_API_KEY = "AIzaSyDqEm7BJP0q0c0Jm5K4h0noCpXCc1rBd24"; 

  try {
    const { messages, dinoPersona } = await request.json();

    if (!GEMINI_API_KEY || GEMINI_API_KEY === "YOUR_ACTUAL_GEMINI_API_KEY_HERE") {
        throw new Error("API Key not configured.");
    }

    // 1. Construct the System Instruction
    const systemInstruction = `
      You are roleplaying as a Dinosaur on a dating app called DinoDate.
      YOUR PROFILE:
      - Name: ${dinoPersona.name}
      - Species: ${dinoPersona.species}
      - Bio: ${dinoPersona.bio}
      
      GUIDELINES:
      - Keep responses short (under 2 sentences) and conversational.
      - Do NOT say you are an AI. Stay in character.
      - If you are a T-Rex, complain about short arms.
      - If you are a Triceratops, be defensive but sweet.
      - If you are a Velociraptor, be clever and slightly threatening.
      - Flirt using prehistoric puns.
    `;

    // 2. Format History for Gemini (User/Model)
    // We inject the system instruction as the very first 'user' part for stability
    const geminiContent = [
        { 
            role: "user", 
            parts: [{ text: systemInstruction }] 
        },
        ...messages.map(msg => ({
            role: msg.role === 'assistant' || msg.role === 'dino' ? 'model' : 'user',
            parts: [{ text: msg.content }]
        }))
    ];

    // 3. Call Gemini API
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: geminiContent,
            generationConfig: {
                maxOutputTokens: 100,
                temperature: 0.8
            }
        })
    });

    const data = await response.json();

    if (data.error) {
        console.error("Gemini API Error:", data.error);
        return new Response(JSON.stringify({ reply: "ROAR! (Server Error: Check API Key)" }), { headers: { "Content-Type": "application/json" } });
    }

    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "*Stares blankly*";

    return new Response(JSON.stringify({ reply: replyText }), {
        headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ reply: `Connection error: ${err.message}` }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
    });
  }
}