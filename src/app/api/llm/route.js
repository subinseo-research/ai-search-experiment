import { GoogleGenAI } from "@google/genai";

export async function POST(req) {
  console.log("Gemini API called (streaming)");
  try {
    const { prompt } = await req.json();

    if (!prompt || !String(prompt).trim()) {
      return new Response(JSON.stringify({ error: "Missing prompt" }), { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Server misconfigured: missing GEMINI_API_KEY" }), { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    const instruction = `
    Write a concise, well-organized answer in Markdown.
    Answering style requirements:
    - Provide a clear, multi-sentence explanation.
    - Use clear headings, bullet points, and formatting to organize the information.
    - Aim for ~250–300 words

    USER QUESTION:
    `;

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await ai.models.generateContentStream({
            model: "gemini-2.5-flash",
            contents: `${instruction}${String(prompt).trim()}`,
            generationConfig: {
              maxOutputTokens: 600,
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
