export async function onRequestPost(context) {
  try {
    const { messages, dinoPersona } = await context.request.json();

    // Debugging: If binding is missing, tell the user why
    if (!context.env.AI) {
      throw new Error("AI Binding is missing! Check wrangler.toml.");
    }

    const systemPrompt = `You are a ${dinoPersona.species} named ${dinoPersona.name}. Bio: ${dinoPersona.bio}. Style: ${dinoPersona.style}. Keep it short.`;

    const inputMessages = [
      { role: "system", content: systemPrompt },
      ...messages
    ];

    const response = await context.env.AI.run(
      "@cf/meta/llama-3-8b-instruct",
      { messages: inputMessages }
    );

    return new Response(JSON.stringify({ reply: response.response }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ reply: `Error: ${err.message}` }), {
      headers: { "Content-Type": "application/json" },
    });
  }
}