// route.js 수정본

import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/genai"; // GoogleGenAI 대신 GoogleGenerativeAI 권장

export async function POST(req) {
  try {
    const { prompt } = await req.json();

    if (!prompt || !String(prompt).trim()) {
      return NextResponse.json({ text: "Error: Prompt is empty", sources: [] });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(apiKey); 
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
          { "title": "Title of Source 1", "link": "https://valid-url-1.com", "snippet": "Description of source 1..." }
        ]
      }
    `;

    // 수정 포인트 3: model.generateContent 사용
    const result = await model.generateContent(enhancedPrompt);
    const response = await result.response;
    const responseText = response.text();

    let parsedData;
    try {
      const cleanJson = responseText.replace(/```json|```/g, "").trim();
      parsedData = JSON.parse(cleanJson);
    } catch (parseError) {
      return NextResponse.json({ text: responseText, sources: [] });
    }

    return NextResponse.json({
      text: parsedData.text || responseText,
      sources: parsedData.sources || []
    });

  } catch (e) {
    console.error("Gemini API Error:", e);
    return NextResponse.json({ 
      text: `Error generated: ${e.message}`, 
      sources: [] 
    });
  }
}