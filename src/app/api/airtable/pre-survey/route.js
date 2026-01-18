import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const body = await req.json();

    const {
      participant_id,
      task_id,
      presurvey_responses,
    } = body;

    if (!participant_id) {
      throw new Error("participant_id is required");
    }
    if (!task_id) {
      throw new Error("task_id is required");
    }
    if (!presurvey_responses) {
      throw new Error("presurvey_responses is required");
    }

    if (!process.env.AIRTABLE_BASE_ID) {
      throw new Error("Missing AIRTABLE_BASE_ID");
    }
    if (!process.env.AIRTABLE_API_KEY) {
      throw new Error("Missing AIRTABLE_API_KEY");
    }

    const fields = {
      participant_id,
      task_id,
      presurvey_responses: JSON.stringify(presurvey_responses),
      // created_at: Airtable auto
    };

    const table =
      process.env.AIRTABLE_PRE_SURVEY_TABLE || "Pre-Survey";

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
        body: JSON.stringify({
          records: [{ fields }],
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      console.error("Airtable pre-survey error:", data);
      throw new Error(
        data?.error?.message ||
        data?.error ||
        JSON.stringify(data)
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PreSurvey API error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
