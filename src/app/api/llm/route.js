import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

function tryParseJsonLoose(raw) {
  if (!raw) return null;

  // 1) ```json ... ``` 코드펜스 제거
  const unfenced = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  // 2) 통째로 파싱 시도
  try {
    return JSON.parse(unfenced);
  } catch {}

  // 3) 텍스트 안에 JSON이 섞여 있으면 {...} 부분만 뽑아서 파싱
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

    const instruction = `
Return ONLY valid JSON (no markdown).
Schema:
{
  "answer": "string with in-text citations like [1], [2] ...",
  "citations": [{ "id": 1, "title": "string", "url": "string" }]
}
Rules:
- Use ONLY provided sources.
- Every [k] must exist in citations with matching id.
`;

    const fullPrompt = `${instruction}

SOURCES:
${sourcesBlock}

USER PROMPT:
${prompt}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: fullPrompt,
      generationConfig: {
        maxOutputTokens: 600,
        temperature: 0.2,
        topP: 0.9,
      },
    });

    const raw = (response.text || "").trim();

    // ✅ 여기서부터가 핵심: 파싱 실패해도 절대 막지 않기
    const parsed = tryParseJsonLoose(raw);

    if (parsed && typeof parsed === "object") {
      return NextResponse.json({
        answer: parsed.answer || "",
        citations: Array.isArray(parsed.citations) ? parsed.citations : [],
        raw, // 디버깅용 (원하면 나중에 제거)
      });
    }

    // ✅ JSON이 아니면 그냥 raw를 answer로 내려보내서 "NO response generated" 방지
    return NextResponse.json({
      answer: raw,
      citations: [],
      raw,
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
