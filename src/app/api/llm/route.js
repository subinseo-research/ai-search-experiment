import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req) {
  try {
    const { prompt } = await req.json();

    if (!prompt || !String(prompt).trim()) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const ai = new GoogleGenAI(apiKey);
    
    // 모델 설정 (gemini-2.0-flash 혹은 사용 가능한 최신 모델 확인)
    const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" }); 

    // 시스템 지시문과 프롬프트 결합 (RAG 모사)
    const refinedPrompt = `
      You are a helpful research assistant. 
      Based on the user's query, provide a detailed answer. 
      If you use specific information, you MUST cite it using [1], [2] format in the text.
      
      At the end of your response, you MUST provide a JSON-like structure for sources.
      User Query: ${prompt}
    `;

    // 실제로는 외부 검색 API(Serper, Google Custom Search 등) 결과가 여기 'contents'에 포함되어야 
    // 정확한 [1], [2] 매칭이 가능합니다. 
    // 여기서는 모델 자체 지식을 사용하되 'sources' 배열을 가공해서 보내는 구조를 제안합니다.
    const result = await model.generateContent(refinedPrompt);
    const responseText = result.response.text();

    // 프론트엔드 page.js가 기대하는 데이터 구조: { text: string, sources: Array }
    // 시뮬레이션을 위해 더미 소스를 포함하거나, 실제 검색 결과를 fetch하여 전달해야 합니다.
    return NextResponse.json({
      text: responseText,
      sources: [
        { title: "Academic Journal A", snippet: "Summary of evidence...", link: "https://example.com/1" },
        { title: "Scientific Report B", snippet: "Data showing that...", link: "https://example.com/2" }
      ]
    });

  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}