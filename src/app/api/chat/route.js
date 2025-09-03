export async function POST(req) {
  const { message } = await req.json();

  // System instructions
  const systemPrompt = `
You are Codevenient AI, a business assistant for small and medium businesses.
- Only respond to business-related topics (finance, marketing, operations, strategy, productivity).
- Keep responses concise and to-the-point.
- Redirect back to business if asked about casual or unrelated topics.
- Act like a proactive consultant.
`;

  // Special greeting
  let finalPrompt = "";
  if (message.toLowerCase() === "new_chat" || message.trim() === "") {
    finalPrompt = `${systemPrompt}\n\nAssistant: 💼 I’m Codevenient AI, your business assistant. Ask me about operations, marketing, or strategy.`;
  } else {
    finalPrompt = `${systemPrompt}\n\nUser: ${message}\nAssistant:`;
  }

  try {
    const res = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gemma3:1b",
        prompt: finalPrompt,
        stream: true,
      }),
    });

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    return new Response(
      new ReadableStream({
        async start(controller) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true }).trim();
            for (const line of chunk.split("\n")) {
              if (!line) continue;
              try {
                const parsed = JSON.parse(line);
                if (parsed.response) {
                  controller.enqueue(new TextEncoder().encode(parsed.response));
                }
              } catch {
              }
            }
          }
          controller.close();
        },
      })
    );
  } catch (err) {
    console.error("Ollama API error:", err);
    return new Response(JSON.stringify({ error: "Ollama API error: " + err.message }), { status: 500 });
  }
}
