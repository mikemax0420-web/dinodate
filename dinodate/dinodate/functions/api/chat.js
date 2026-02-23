// This runs on Cloudflare Edge (not the browser)
export async function onRequestPost(context) {
  try {
    // 1. Get data from the frontend
    const { messages, dinoPersona } = await context.request.json();

    // 2. Create the System Prompt (The Dino's Brain)
    const systemPrompt = `
      You are roleplaying as a Dinosaur in a dating app called DinoDate.
      
      YOUR CHARACTER:
      Name: ${dinoPersona.name}
      Species: ${dinoPersona.species}
      Bio: ${dinoPersona.bio}
      Speaking Style: ${dinoPersona.style}
      
      RULES:
      1. Keep responses short (under 2 sentences).
      2. Be funny, lighthearted, and stay STRICTLY in character.
      3. If the user is rude, roar at them.
      4. Never admit you are an AI. You are a real dinosaur.
    `;

    // 3. Format for Llama-3
    const inputMessages = [
      { role: "system", content: systemPrompt },
      ...messages
    ];

    // 4. Run Cloudflare Workers AI
    // We use the 'AI' binding which acts as the bridge
    const response = await context.env.AI.run(
      "@cf/meta/llama-3-8b-instruct", 
      { messages: inputMessages }
    );

    // 5. Send result back to frontend
    return new Response(JSON.stringify({ reply: response.response }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}