import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/genai";

export async function POST(req) {
  try {
    const { prompt } = await req.json();

    if (!prompt || !String(prompt).trim()) {
      return NextResponse.json({ text: "Error: Prompt is empty", sources: [] });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ text: "Error: API Key missing", sources: [] });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // 모델명을 gemini-2.5-flash로 설정합니다.
    // 만약 404 에러가 지속되면 라이브러리 업데이트(npm install @google/genai@latest)를 먼저 진행해주세요.
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash", 
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const enhancedPrompt = `
      You are a helpful research assistant.
      User Query: "${prompt}"

      Instructions:
      1. Answer the query comprehensively.
      2. Generate a list of legitimate-looking sources relevant to the answer.
      3. Cite these sources in your text using the format [Source 1], [Source 2], etc.
      4. Return ONLY a valid JSON object.
      
      Response Format (JSON):
      {
        "text": "Your answer text here with citations like [Source 1]...",
        "sources": [
          { "title": "Title of Source 1", "link": "https://example.com", "snippet": "Description of source 1..." }
        ]
      }
    `;

    const result = await model.generateContent(enhancedPrompt);
    const response = await result.response;
    const responseText = response.text();

    let parsedData;
    try {
      // AI가 마크다운 블록(```json)을 포함할 경우를 대비한 정제 작업
      const cleanJson = responseText.replace(/```json|```/g, "").trim();
      parsedData = JSON.parse(cleanJson);
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);
      return NextResponse.json({ text: responseText, sources: [] });
    }

    return NextResponse.json({
      text: parsedData.text || responseText,
      sources: parsedData.sources || []
    });

  } catch (e) {
    console.error("Gemini API Error:", e);
    // 에러 메시지에 모델 관련 정보가 포함되어 출력됩니다.
    return NextResponse.json({ 
      text: `Error generated: ${e.message}`, 
      sources: [] 
    });
  }
}