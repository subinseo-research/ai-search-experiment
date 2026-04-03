import { NextResponse } from "next/server";

const BASE_URL = () =>
  `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Assignment`;

const HEADERS = () => ({
  Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
  "Content-Type": "application/json",
});

// POST: Reserve a pending assignment slot (idempotent by participant_id)
export async function POST(req) {
  try {
    const { participant_id, task_type, system_type } = await req.json();

    // Check if an assignment already exists for this participant
    const checkUrl = new URL(BASE_URL());
    checkUrl.searchParams.set(
      "filterByFormula",
      `{participant_id}="${participant_id}"`
    );
    checkUrl.searchParams.set("maxRecords", "1");

    const checkRes = await fetch(checkUrl.toString(), {
      headers: HEADERS(),
    });
    if (!checkRes.ok) throw new Error(await checkRes.text());
    const checkData = await checkRes.json();

    if (checkData.records.length > 0) {
      const existing = checkData.records[0];
      return NextResponse.json({
        recordId: existing.id,
        task_type: existing.fields.task_type,
        system_type: existing.fields.system_type,
        existing: true,
      });
    }

    // Create new pending record
    const res = await fetch(BASE_URL(), {
      method: "POST",
      headers: HEADERS(),
      body: JSON.stringify({
        fields: { participant_id, task_type, system_type, status: "pending" },
      }),
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();

    return NextResponse.json({
      recordId: data.id,
      task_type,
      system_type,
      existing: false,
    });
  } catch (error) {
    console.error("assignment POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH: Mark assignment as completed
export async function PATCH(req) {
  try {
    const { recordId } = await req.json();
    if (!recordId) {
      return NextResponse.json({ error: "recordId required" }, { status: 400 });
    }

    const res = await fetch(`${BASE_URL()}/${recordId}`, {
      method: "PATCH",
      headers: HEADERS(),
      body: JSON.stringify({ fields: { status: "completed" } }),
    });
    if (!res.ok) throw new Error(await res.text());

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("assignment PATCH error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
