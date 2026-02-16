import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

function tryParseJsonLoose(raw) {
  if (!raw) return null;

  const unfenced = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(unfenced);
  } catch {}

  const first = unfenced.indexOf("{");
  const last = unfenced.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    const slice = unfenced.slice(first, last + 1);
    try {
      return JSON.parse(slice);
    } catch {}
  }
  return null;
}

export async function POST(req) {
  console.log("Gemini API called");
  try {
    // ✅ Accept both {question} and legacy {prompt}
    const body = await req.json();
    const userQuestion = String(body.question ?? body.prompt ?? "").trim();
    const sources = Array.isArray(body.sources) ? body.sources : [];

    if (!userQuestion) {
      return NextResponse.json({ error: "Missing question" }, { status: 400 });
    }

    // ✅ ConvSearch citation mode: sources are REQUIRED
    if (sources.length === 0) {
      return NextResponse.json(
        { error: "Missing sources: citation mode requires sources" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Server misconfigured: missing GEMINI_API_KEY" },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const sourcesBlock = JSON.stringify(
      sources.map((s, i) => ({
        id: i + 1,
        title: s.title || "",
        url: s.url || "",
        snippet: s.snippet || "",
      })),
      null,
      2
    );

    // ✅ Stronger instruction: ONLY sources, cite as [n], no invented sources
    const instruction = `
Return ONLY valid JSON (no markdown).
Schema:
{
  "answer": "string with in-text citations like [1], [2] ...",
  "citations": [{ "id": 1, "title": "string", "url": "string" }]
}
Rules:
- You MUST use ONLY the provided sources to answer.
- Every factual claim should be supported by at least one citation [n].
- Do NOT invent or add sources. Do NOT cite numbers that are not in the source list.
- If the sources are insufficient to answer, cite the closest relevant source(s).
`;
    const fullPrompt = `${instruction}

SOURCES (numbered):
${sourcesBlock}

QUESTION:
${userQuestion}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: fullPrompt,
      generationConfig: {
        maxOutputTokens: 120,
        temperature: 0.3,
        topP: 0.9,
      },
    });

    const raw = (response.text || "").trim();
    const parsed = tryParseJsonLoose(raw);

    const text =
      parsed && typeof parsed === "object"
        ? String(parsed.answer || "").trim()
        : raw;

    const citations =
      parsed && typeof parsed === "object" && Array.isArray(parsed.citations)
        ? parsed.citations
        : [];

    return NextResponse.json({
      text,
      citations,
      sources, 
      raw,     
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
