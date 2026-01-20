import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const body = await req.json();

    const fields = {
      participant_id: body.participant_id ?? null,

      // basic demographics
      age:
        body.age !== undefined && body.age !== null
          ? Number(body.age)
          : null,
      gender: body.gender ?? null,
      education: body.education ?? null,
      race: Array.isArray(body.race) ? body.race : null,
      hispanic: body.hispanic ?? null,

      // political
      party_id: body.party_id ?? null,
      party_lean: body.party_lean ?? null,
      ideology_scale: body.ideology_scale ?? null,

      // usage – Generative AI
      use_chatgpt: body.use_chatgpt ?? null,
      use_gemini: body.use_gemini ?? null,
      use_copilot: body.use_copilot ?? null,
      use_genai_other: body.use_genai_other ?? null,
      use_genai_other_name: body.use_genai_other_name ?? null,

      // usage – Web Search
      use_google: body.use_google ?? null,
      use_bing: body.use_bing ?? null,
      use_search_other: body.use_search_other ?? null,
      use_search_other_name: body.use_search_other_name ?? null,
    };

    const airtableRes = await fetch(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Demographic`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fields }),
      }
    );

    if (!airtableRes.ok) {
      const err = await airtableRes.text();
      throw new Error(err);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Airtable insert error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
