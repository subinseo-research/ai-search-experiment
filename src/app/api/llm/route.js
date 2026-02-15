import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

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

    const ai = new GoogleGenAI(apiKey);
    const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });
    const enhancedPrompt = `
      ${prompt}

      Instructions:
            1. Answer the question detailly.
            2. Provide a 'sources' array containing credible-looking references.
            3. In the text, use [Source 1], [Source 2] to cite these references.
            4. Return the response strictly in JSON format:
              {
                "text": "Your cited answer here...",
                "sources": [
                  {"title": "Source Title", "link": "https://...", "snippet": "Summary of source..."}
                ]
              }
          `;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: enhancedPrompt }] }],
      generationConfig: { 
        maxOutputTokens: 500, 
        temperature: 0.5, 
        topP: 0.9,
        responseMimeType: "application/json" 
      }, 
    });

    const responseText = result.response.text();

    // 2. 응답 파싱: 텍스트 내 JSON만 추출 (혹시 모를 마크다운 방지)
    try {
      const cleanJson = responseText.includes("```json")
        ? responseText.split("```json")[1].split("```")[0]
        : responseText;
      
      const parsedData = JSON.parse(cleanJson);
      
      // page.js가 기대하는 형태로 반환
      return NextResponse.json({
        text: parsedData.text,
        sources: parsedData.sources || []
      });
    } catch (parseError) {
      // 파싱 실패 시 기본 텍스트라도 반환하는 fallback
      return NextResponse.json({ 
        text: responseText, 
        sources: [] 
      });
    }

  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

