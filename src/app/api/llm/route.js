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
      return NextResponse.json({ text: "Error: API Key missing in Environment Variables", sources: [] });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const MODEL_NAME = "gemini-1.5-flash"; 

    const model = genAI.getGenerativeModel({ 
      model: MODEL_NAME,
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const enhancedPrompt = `
      You are a helpful research assistant.
      User Query: "${prompt}"

      Instructions:
      1. Answer the query comprehensively.
      2. Generate a list of legitimate sources.
      3. Cite sources as [Source 1], [Source 2], etc.
      4. Return ONLY a valid JSON object.
      
      Response Format (JSON):
      {
        "text": "answer text...",
        "sources": [{ "title": "...", "link": "...", "snippet": "..." }]
      }
    `;

    const result = await model.generateContent(enhancedPrompt);
    const response = await result.response;
    const responseText = response.text();

    // JSON 추출 로직 강화
    let parsedData;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/); // JSON 형태만 추출
      const cleanJson = jsonMatch ? jsonMatch[0] : responseText;
      parsedData = JSON.parse(cleanJson);
    } catch (parseError) {
      console.error("JSON Parsing failed. Raw response:", responseText);
      return NextResponse.json({ text: responseText, sources: [] });
    }

    return NextResponse.json({
      text: parsedData.text || "No text generated.",
      sources: parsedData.sources || []
    });

  } catch (e) {
    console.error("Gemini API Error details:", e);
    
    // 배포 환경에서 구체적인 에러 원인을 파악하기 위한 응답
    return NextResponse.json({ 
      text: `Deployment Error: ${e.message}. (Model: gemini-2.5-flash)`, 
      status: e.status || 500,
      sources: [] 
    }, { status: 500 });
  }
}