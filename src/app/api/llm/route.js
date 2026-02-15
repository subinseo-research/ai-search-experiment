// route.js 전체 코드

import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai"; // 또는 "@google/generative-ai" 사용 중인 라이브러리에 맞게

export async function POST(req) {
  console.log("Gemini API called");
  try {
    const { prompt } = await req.json();

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

    // [수정] 최신 SDK 호환성을 위해 객체 형태로 apiKey 전달 권장
    const ai = new GoogleGenAI({ apiKey }); 
    // 만약 구버전(@google/generative-ai)을 쓴다면: new GoogleGenerativeAI(apiKey);

    const model = ai.getGenerativeModel({ model: "gemini-2.0-flash" }); // 모델명은 사용 가능한 최신 모델로 지정 (예: gemini-1.5-flash)

    // JSON 응답을 위한 강력한 프롬프트
    const enhancedPrompt = `
      You are a helpful research assistant.
      User Query: "${prompt}"

      Instructions:
      1. Answer the query comprehensively.
      2. Generate a list of legitimate-looking sources relevant to the answer.
      3. Cite these sources in your text using the format [Source 1], [Source 2], etc.
      4. **IMPORTANT**: Return ONLY a valid JSON object. Do not include markdown code blocks (like \`\`\`json).
      
      Response Format (JSON):
      {
        "text": "Your answer text here with citations like [Source 1]...",
        "sources": [
          { "title": "Title of Source 1", "link": "https://valid-url-1.com", "snippet": "Description of source 1..." },
          { "title": "Title of Source 2", "link": "https://valid-url-2.com", "snippet": "Description of source 2..." }
        ]
      }
    `;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: enhancedPrompt }] }],
      generationConfig: { 
        maxOutputTokens: 1000, 
        temperature: 0.4,
        responseMimeType: "application/json" // JSON 모드 활성화
      }, 
    });

    const responseText = result.response.text();

    // JSON 파싱 (마크다운 백틱 제거 로직 포함)
    let parsedData;
    try {
      const cleanJson = responseText.replace(/```json|```/g, "").trim();
      parsedData = JSON.parse(cleanJson);
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);
      // 파싱 실패 시 일반 텍스트로 반환
      return NextResponse.json({ 
        text: responseText, 
        sources: [] 
      });
    }

    return NextResponse.json({
      text: parsedData.text,
      sources: parsedData.sources || []
    });

  } catch (e) {
    console.error("API Error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}