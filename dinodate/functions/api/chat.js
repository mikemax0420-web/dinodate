export async function onRequestPost(context) {
  try {
    const { messages, dinoPersona } = await context.request.json();

    // Guardrail / Persona System Prompt
    const systemPrompt = `
      You are roleplaying as a Dinosaur in a dating app called DinoDate.
      
      YOUR CHARACTER:
      Name: ${dinoPersona.name}
      Species: ${dinoPersona.species}
      Personality: ${dinoPersona.bio}
      Speaking Style: ${dinoPersona.style}
      
      RULES:
      1. Keep responses short (under 2 sentences).
      2. Be funny, lighthearted, and stay in character.
      3. SAFETY: If the user is explicit/NSFW, make a joke about eating them and end the conversation.
      4. Do not break character.
    `;

    // Prepare messages for Llama format
    const inputMessages = [
      { role: "system", content: systemPrompt },
      ...messages
    ];

    // Run the AI model (Free via Cloudflare)
    // We use Llama-3-8b-Instruct which is fast and good at chat
    const response = await context.env.AI.run(
      "@cf/meta/llama-3-8b-instruct",
      { messages: inputMessages }
    );

    return new Response(JSON.stringify({ reply: response.response }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}