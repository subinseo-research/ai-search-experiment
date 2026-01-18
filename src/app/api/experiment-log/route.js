import { NextResponse } from "next/server";

  export async function OPTIONS() {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }


export async function POST(req) {
  try {
    const body = await req.json();

    const {
      participant_id,
      condition,
      task_id,
      log_type,
      log_data,
      timestamp,
    } = body;

    if (!participant_id || !log_data) {
      throw new Error("participant_id and log_data are required");
    }

    const fields = {
      participant_id,
      condition: condition || "",
      task_id: task_id || "",
      log_type: log_type || "generic",
      log_data: JSON.stringify(log_data),
      timestamp: timestamp || new Date().toISOString(),
    };

    const res = await fetch(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/experiment_log`,
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
      console.error("Airtable experiment-log error:", data);
      throw new Error("Failed to save experiment log");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("ExperimentLog API error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
