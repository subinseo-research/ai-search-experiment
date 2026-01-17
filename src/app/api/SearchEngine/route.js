import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();

    // how many results the client wants in total
    const requestedTotal = Number(searchParams.get("requestedTotal") || 10);

    if (!q) {
      return NextResponse.json({ error: "Missing q" }, { status: 400 });
    }

    const key = process.env.GOOGLE_CSE_API_KEY;
    const cx = process.env.GOOGLE_CSE_CX;

    if (!key || !cx) {
      return NextResponse.json(
        { error: "Server misconfigured: missing GOOGLE_CSE_API_KEY or GOOGLE_CSE_CX" },
        { status: 500 }
      );
    }

    const MAX_PER_PAGE = 10; // Google CSE hard limit
    const pagesNeeded = Math.ceil(requestedTotal / MAX_PER_PAGE);

    let allItems = [];

    for (let i = 0; i < pagesNeeded; i++) {
      const start = i * MAX_PER_PAGE + 1;

      const url = new URL("https://www.googleapis.com/customsearch/v1");
      url.searchParams.set("key", key);
      url.searchParams.set("cx", cx);
      url.searchParams.set("q", q);
      url.searchParams.set("start", start.toString());
      url.searchParams.set("num", MAX_PER_PAGE.toString());

      const res = await fetch(url.toString());
      const data = await res.json();

      if (!res.ok) {
        return NextResponse.json(
          { error: "Google CSE error", details: data },
          { status: res.status }
        );
      }

      const items = (data.items || []).map((it) => ({
        title: it.title,
        link: it.link,
        snippet: it.snippet,
        displayLink: it.displayLink,
      }));

      allItems.push(...items);

      // stop early if Google returns fewer than expected
      if (items.length < MAX_PER_PAGE) break;
    }

    return NextResponse.json({
      query: q,
      totalReturned: allItems.length,
      items: allItems.slice(0, requestedTotal),
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
