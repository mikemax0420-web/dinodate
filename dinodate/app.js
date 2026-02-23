export async function onRequestPost(context) {
  try {
    // 1. Get data from the frontend
    const { messages, dinoPersona } = await context.request.json();

    // 2. Configuration (From your curl command)
    const ACCOUNT_ID = "5912b0e8d831f26903cc03af5265b6bf";
    const API_TOKEN = "hAjbVjxRzGg_pdhxQZiOG3XDscVQoHOUfklonWUu";
    const MODEL = "@cf/meta/llama-3-8b-instruct";

    // 3. Construct the System Prompt
    const systemPrompt = `You are a ${dinoPersona.species} named ${dinoPersona.name}. Bio: ${dinoPersona.bio}. Style: ${dinoPersona.style}. Keep it short and flirty.`;

    // 4. Prepare the payload
    const inputMessages = [
      { role: "system", content: systemPrompt },
      ...messages // Append history
    ];

    // 5. Call Cloudflare AI via REST API (fetch)
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/run/${MODEL}`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${API_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ messages: inputMessages })
      }
    );

    // 6. Parse the result
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.errors?.[0]?.message || "Unknown AI Error");
    }

    // 7. Send back to frontend
    // The REST API returns structure: { result: { response: "text" }, ... }
    return new Response(JSON.stringify({ reply: data.result.response }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ reply: `*Roar* (API Error: ${err.message})` }), {
      headers: { "Content-Type": "application/json" },
    });
  }
}