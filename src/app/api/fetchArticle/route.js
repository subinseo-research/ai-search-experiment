// src/app/api/fetchArticle/route.js
import { NextResponse } from "next/server";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

// (권장) 너무 긴 텍스트 방지
const MAX_CHARS = 20000;

// (권장) SSRF 최소 방지: http/https만 허용
function isSafeHttpUrl(raw) {
  try {
    const u = new URL(raw);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

// (선택) 도메인 allowlist를 두면 더 안전합니다.
// const ALLOWLIST = ["en.wikipedia.org", "www.who.int", "cdc.gov"];

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const u = searchParams.get("u");

  if (!u || !isSafeHttpUrl(u)) {
    return NextResponse.json(
      { ok: false, error: "Invalid URL" },
      { status: 400 }
    );
  }

  // (선택) allowlist 적용 시:
  // const host = new URL(u).hostname;
  // if (!ALLOWLIST.some((d) => host === d || host.endsWith("." + d))) {
  //   return NextResponse.json({ ok: false, error: "Domain not allowed" }, { status: 403 });
  // }

  try {
    // timeout 처리
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(u, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        // 사이트들에서 UA 없으면 막는 경우가 많아서 넣는게 좋습니다.
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
        "Accept":
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: `Fetch failed: ${res.status}` },
        { status: 502 }
      );
    }

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) {
      // pdf/image 등은 일단 제외 (PDF까지 하려면 별도 처리 필요)
      return NextResponse.json(
        { ok: false, error: "Not an HTML page", contentType },
        { status: 415 }
      );
    }

    const html = await res.text();

    // Readability는 "문서 URL"을 알아야 상대경로 처리 등이 안정적입니다.
    const dom = new JSDOM(html, { url: u });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article || !article.textContent) {
      return NextResponse.json(
        { ok: false, error: "Failed to extract article text" },
        { status: 422 }
      );
    }

    // 텍스트 정리
    let text = article.textContent.replace(/\n{3,}/g, "\n\n").trim();
    if (text.length > MAX_CHARS) text = text.slice(0, MAX_CHARS) + "\n\n...[truncated]";

    // title도 같이 주면 UI에 좋음
    const title = (article.title || "").trim();

    return NextResponse.json({
      ok: true,
      url: u,
      title,
      text,
      // 디버깅/연구용: 길이
      charCount: text.length,
    });
  } catch (err) {
    const msg =
      err?.name === "AbortError" ? "Timeout fetching page" : "Unexpected error";
    return NextResponse.json(
      { ok: false, error: msg },
      { status: 500 }
    );
  }
}
