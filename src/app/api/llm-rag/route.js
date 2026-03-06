import { GoogleGenAI } from "@google/genai";

export async function POST(req) {
  console.log("Gemini RAG API called (streaming)");
  try {
    const body = await req.json();
    const userQuestion = String(body.question ?? body.prompt ?? "").trim();
    const sources = Array.isArray(body.sources) ? body.sources : [];
    const history = Array.isArray(body.history) ? body.history : [];

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

    const systemInstruction = `You are a helpful assistant engaged in an ongoing conversation.
Answer the current question using the provided sources as your primary evidence.
Use inline citations like [1], [2] to reference sources.
Write in clear Markdown with headings and bullet points where appropriate.

Important conversation rules:
- If the current question is a follow-up (e.g., "Should I be worried?", "What do you think?"), interpret it in the context of the previous conversation turns.
- Use previous turns to understand what topic the user is referring to, even if the sources don't explicitly repeat the topic.
- For claims drawn from the provided sources, always cite with [n]. For contextual framing from prior conversation, no citation is needed.
- Do NOT invent sources or fabricate citations.`;

    // Build multi-turn contents: history + current question (with fresh sources)
    const contents = [
      ...history
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        })),
      {
        role: "user",
        parts: [{ text: `Answer in ~250–300 words using clear Markdown headings and bullet points.\n\nSOURCES:\n${sourcesBlock}\n\nQUESTION:\n${userQuestion}` }],
      },
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
