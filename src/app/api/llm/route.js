import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req) {
  console.log("Gemini API called");
  try {
    const { prompt, sources = [] } = await req.json();

    if (!prompt || !String(prompt).trim()) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Server misconfigured: missing GEMINI_API_KEY" },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    // ✅ 모델에게 "인용은 반드시 아래 sources만 사용" + "JSON으로만 출력" 강제
    const citationInstruction = `
You must answer using ONLY the provided sources.
Return ONLY valid JSON (no markdown, no extra text).
Schema:
{
  "answer": "string with in-text citations like [1], [2] ...",
  "citations": [
    { "id": 1, "title": "string", "url": "string" }
  ]
}
Rules:
- Every bracket citation like [k] must exist in citations with matching id.
- If a claim cannot be supported by sources, say so in the answer without inventing citations.
`;

    // sources를 모델이 보기 좋게 stringify해서 prompt에 포함 (가난한 방식)
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

    const fullPrompt = `${citationInstruction}

SOURCES:
${sourcesBlock}

USER PROMPT:
${prompt}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: fullPrompt,
      // ⚠️ 80 tokens는 citation까지 내기엔 너무 짧아서 올려야 합니다.
      generationConfig: { maxOutputTokens: 600, temperature: 0.2, topP: 0.9 },
    });

    const raw = response.text?.trim() || "";

    // ✅ JSON 파싱. 실패하면 raw도 같이 내려서 디버깅/폴백 가능하게.
    let parsed = null;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json(
        { error: "Model did not return valid JSON", raw },
        { status: 502 }
      );
    }

    return NextResponse.json({
      answer: parsed.answer || "",
      citations: parsed.citations || [],
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
