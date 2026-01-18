import { NextResponse } from "next/server";

const safeStringify = (obj) => {
  try {
    return JSON.stringify(obj ?? {});
  } catch {
    return JSON.stringify({});
  }
};

export async function POST(req) {
  try {
    const body = await req.json();

    const {
      participant_id,
      task_id,
      condition,
      serendipity_responses,
      emotion_responses,
      post_self_efficacy_responses,
      open_ended,
    } = body;

    if (!participant_id) throw new Error("participant_id is required");
    if (!task_id) throw new Error("task_id is required");
    if (!condition) throw new Error("condition is required");

    if (!process.env.AIRTABLE_BASE_ID)
      throw new Error("Missing AIRTABLE_BASE_ID");
    if (!process.env.AIRTABLE_API_KEY)
      throw new Error("Missing AIRTABLE_API_KEY");

    const table =
      process.env.AIRTABLE_POST_SURVEY_TABLE || "post_survey";

    const fields = {
      participant_id,
      task_id,
      condition,
      serendipity_responses: safeStringify(serendipity_responses),
      emotion_responses: safeStringify(emotion_responses),
      post_self_efficacy_responses: safeStringify(post_self_efficacy_responses),
      open_ended: safeStringify(open_ended),
    };

    const res = await fetch(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${encodeURIComponent(
        table
      )}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ records: [{ fields }] }),
      }
    );

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    if (!res.ok) {
      console.error("Airtable post-survey error:", {
        status: res.status,
        data,
      });
      return NextResponse.json(
        { success: false, where: "airtable", status: res.status, data },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PostSurvey API error:", error);
    return NextResponse.json(
      { success: false, where: "server", error: error.message },
      { status: 500 }
    );
  }
}
