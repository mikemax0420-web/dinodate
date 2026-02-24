export async function onRequestPost({ request }) {
  // ---------------------------------------------------------
  // YOUR KEY STAYS HERE
  // ---------------------------------------------------------
  const GEMINI_API_KEY = "AIzaSyDqEm7BJP0q0c0Jm5K4h0noCpXCc1rBd24"; 

  try {
    const { messages, dinoPersona } = await request.json();

    // Safety check to prevent crashes
    if (!messages || messages.length === 0) {
        return new Response(JSON.stringify({ reply: "*Stares silently*" }), { headers: { "Content-Type": "application/json" }});
    }

    // 1. Convert Chat History to Gemini Format
    const geminiHistory = messages.map(msg => ({
      role: msg.role === 'assistant' || msg.role === 'dino' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    // 2. Define the System Instruction (The Persona)
    const personaInstruction = {
        role: "user",
        parts: [{ 
            text: `SYSTEM INSTRUCTION: You are a ${dinoPersona.species || "Dinosaur"} named ${dinoPersona.name}. 
            Bio: ${dinoPersona.bio}. 
            Personality: ${dinoPersona.type} - ${dinoPersona.style}.
            Reply to the user as this dinosaur. Keep responses SHORT (under 2 sentences).
            Do NOT say you are an AI.` 
        }]
    };

    // 3. FIX: Prevent "User -> User" error.
    // If we just add the persona as a separate message, and the first history message is also 'user',
    // Gemini will error. We must merge the persona into the first message OR use the system_instruction field.
    // Here we use the system_instruction field supported by v1beta.
    
    const payload = {
      system_instruction: {
        parts: [{ text: personaInstruction.parts[0].text }]
      },
      contents: geminiHistory, // Just the conversation history
      generationConfig: {
        maxOutputTokens: 150,
        temperature: 0.9
      }
    };

    // 4. Send to Google
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }
    );

    const data = await response.json();

    // 5. Handle Errors from Google safely
    if (data.error) {
      // Return the error as a chat message so you can see it in the UI
      return new Response(JSON.stringify({ 
        reply: `*Confused roar* (Google API Error: ${data.error.message})` 
      }), { headers: { "Content-Type": "application/json" } });
    }

    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "*Growls silently*";

    return new Response(JSON.stringify({ 
      reply: replyText 
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    // Catch script crashes
    return new Response(JSON.stringify({ 
      reply: `*Coughs up smoke* (Server Script Error: ${err.message})` 
    }), {
      status: 200, // Return 200 so the frontend parses the JSON error message
      headers: { "Content-Type": "application/json" }
    });
  }
}