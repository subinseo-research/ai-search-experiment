import { GoogleGenAI } from "@google/genai";

export async function POST(req) {
  console.log("Gemini API called (streaming)");
  try {
    const { prompt, history = [] } = await req.json();

    if (!prompt || !String(prompt).trim()) {
      return new Response(JSON.stringify({ error: "Missing prompt" }), { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Server misconfigured: missing GEMINI_API_KEY" }), { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `
    Write a concise, well-organized answer in Markdown.
    Answering style requirements:
    - Provide a clear, multi-sentence explanation.
    - Use clear headings, bullet points for listed itmes, and formatting to organize the information.
    - Treat the interaction as a continuous conversation rather than isolated questions.
    - Use previous turns to maintain topic continuity and provide more relevant answers.`;

    // Build multi-turn contents: previous history + current user message
    const contents = [
      ...history
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        })),
      { role: "user", parts: [{ text: `Answer in ~250–300 words using clear Markdown headings and bullet points.\n\n${String(prompt).trim()}` }] },
    ];

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await ai.models.generateContentStream({
            model: "gemini-2.5-flash",
            systemInstruction,
            contents,
            generationConfig: {
              maxOutputTokens: 400,
              temperature: 0.3,
              topP: 0.9,
            },
          });

          for await (const chunk of response) {
            const text = chunk.text || "";
            if (text) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: "chunk", text })}\n\n`)
              );
            }
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`));
        } catch (e) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "error", error: e.message })}\n\n`)
          );
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
