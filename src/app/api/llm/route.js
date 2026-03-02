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

    const ai = new GoogleGenAI({ apiKey });

    // ✅ GenSearch output format instruction
    const instruction = `
    Write a concise, well-organized answer in Markdown.
    Answering style requirements:
    - Provide a clear, multi-sentence explanation.
    - Use clear headings, bullet points, and formatting to organize the information.
    - Aim for ~250–300 words

    USER QUESTION:
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `${instruction}${String(prompt).trim()}`,
      generationConfig: {
        maxOutputTokens: 200,   
        temperature: 0.3,
        topP: 0.9,
      },
    });

    return NextResponse.json({ text: response.text });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}