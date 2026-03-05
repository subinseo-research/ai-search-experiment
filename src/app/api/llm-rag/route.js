import { GoogleGenAI } from "@google/genai";

export async function POST(req) {
  console.log("Gemini RAG API called (streaming)");
  try {
    const body = await req.json();
    const userQuestion = String(body.question ?? body.prompt ?? "").trim();
    const sources = Array.isArray(body.sources) ? body.sources : [];

    if (!userQuestion) {
      return new Response(JSON.stringify({ error: "Missing question" }), { status: 400 });
    }

    if (sources.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing sources: citation mode requires sources" }),
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Server misconfigured: missing GEMINI_API_KEY" }),
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const sourcesBlock = sources
      .map((s, i) => `[${i + 1}] ${s.title || ""} — ${s.url || ""}\n${s.snippet || ""}`)
      .join("\n\n");

    const instruction = `Answer the question using ONLY the provided sources.
Use inline citations like [1], [2] to reference sources.
Write in clear Markdown with headings and bullet points where appropriate.
Every factual claim must cite at least one source. Do NOT invent sources.
Aim for ~250–300 words.`;

    const fullPrompt = `${instruction}

SOURCES:
${sourcesBlock}

QUESTION:
${userQuestion}`;

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await ai.models.generateContentStream({
            model: "gemini-2.5-flash",
            contents: fullPrompt,
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

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "done", sources })}\n\n`)
          );
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
