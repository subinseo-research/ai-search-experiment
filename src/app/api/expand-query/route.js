import { GoogleGenAI } from "@google/genai";

export async function POST(req) {
  try {
    const { query, history = [] } = await req.json();

    if (!query) {
      return Response.json({ expandedQuery: query });
    }

    // No history — nothing to expand
    if (history.length === 0) {
      return Response.json({ expandedQuery: query });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json({ expandedQuery: query });
    }

    const ai = new GoogleGenAI({ apiKey });

    const historyText = history
      .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n\n");

    const prompt = `Conversation so far:
${historyText}

User's latest query: "${query}"

If this query is a follow-up that omits context from the conversation (e.g. "Do I have to be worried?" after discussing GMO foods), rewrite it as a complete, self-contained web search query (e.g. "Should I be worried about GMO foods?").
If the query is already self-contained, return it unchanged.

Return ONLY the rewritten query string, nothing else.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      generationConfig: { maxOutputTokens: 60, temperature: 0 },
    });

    const expandedQuery = response.text?.trim() || query;
    return Response.json({ expandedQuery });
  } catch {
    const { query } = await req.json().catch(() => ({}));
    return Response.json({ expandedQuery: query || "" });
  }
}
