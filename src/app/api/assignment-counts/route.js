import { NextResponse } from "next/server";

// Returns pending+completed assignment counts per cell (task×system) and per system.
// Counting both statuses acts as a reservation: a slot is held from the moment
// of task assignment, preventing overbooking even before demographic completion.
export async function GET() {
  const cellCounts = {};
  const sysCounts = {};

  let offset = null;

  try {
    do {
      const url = new URL(
        `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Assignment`
      );
      url.searchParams.append("fields[]", "task_type");
      url.searchParams.append("fields[]", "system_type");
      url.searchParams.append("fields[]", "status");
      if (offset) url.searchParams.set("offset", offset);

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}` },
      });

      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();

      for (const record of data.records) {
        const { task_type, system_type } = record.fields;
        if (!task_type || !system_type) continue;

        const key = `${task_type}__${system_type}`;
        cellCounts[key] = (cellCounts[key] || 0) + 1;
        sysCounts[system_type] = (sysCounts[system_type] || 0) + 1;
      }

      offset = data.offset ?? null;
    } while (offset);

    return NextResponse.json({ cellCounts, sysCounts });
  } catch (error) {
    console.error("assignment-counts error:", error);
    return NextResponse.json(
      { cellCounts: {}, sysCounts: {}, error: error.message },
      { status: 500 }
    );
  }
}
