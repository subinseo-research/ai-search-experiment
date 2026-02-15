// route.js 전체 코드

import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai"; 

export async function POST(req) {
  console.log("Gemini API called");
  try {
    const { prompt } = await req.json();

    if (!prompt || !String(prompt).trim()) {
      return NextResponse.json({ text: "Error: Prompt is empty", sources: [] });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("API Key missing");
      return NextResponse.json({ text: "Error: Server missing API Key", sources: [] });
    }

    const ai = new GoogleGenAI({ apiKey }); 
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
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash", // 1.5-flash로 변경 (안정성 확보)
      contents: [{ role: "user", parts: [{ text: enhancedPrompt }] }],
      config: {
        responseMimeType: "application/json", // JSON 모드
      },
    });

const responseText = response.text();
    console.log("Raw AI Response:", responseText.substring(0, 100) + "..."); // 로그 확인용

    let parsedData;
    try {
      // 마크다운 코드 블록(```json ... ```)이 있을 경우 제거
      const cleanJson = responseText.replace(/```json|```/g, "").trim();
      parsedData = JSON.parse(cleanJson);
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);
      // 파싱 실패 시 원본 텍스트라도 반환
      return NextResponse.json({ 
        text: responseText, 
        sources: [] 
      });
    }

    // 정상 반환
    return NextResponse.json({
      text: parsedData.text || responseText,
      sources: parsedData.sources || []
    });

  } catch (e) {
    console.error("Gemini API Error:", e);
    // [핵심] 에러 내용을 text로 보내서 채팅창에서 확인 가능하게 함
    return NextResponse.json({ 
      text: `Error generated: ${e.message}`, 
      sources: [] 
    });
  }
}