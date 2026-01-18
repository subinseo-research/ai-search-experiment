"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function LandingPage() {
  const params = useSearchParams();
  const url = params.get("u");

  const [content, setContent] = useState("");
  const lastActivityRef = useRef(Date.now());
  const [art, setArt] = useState(0);

  /* ===== Fetch landing content ===== */
    useEffect(() => {
    if (!url) return;

    fetch(`/api/fetchArticle?u=${encodeURIComponent(url)}`)
        .then((res) => res.json())
        .then((data) => {
        if (data.ok) {
            setContent(data.text);
        } else {
            setContent(`Failed to load content.\n\nReason: ${data.error}`);
        }
        })
        .catch(() => {
        setContent("Failed to load content due to a network error.");
        });
    }, [url]);
    
  /* ===== ART activity signals ===== */
  useEffect(() => {
    const mark = () => (lastActivityRef.current = Date.now());

    window.addEventListener("scroll", mark);
    window.addEventListener("mousemove", mark);
    window.addEventListener("keydown", mark);
    window.addEventListener("mouseup", mark);

    return () => {
      window.removeEventListener("scroll", mark);
      window.removeEventListener("mousemove", mark);
      window.removeEventListener("keydown", mark);
      window.removeEventListener("mouseup", mark);
    };
  }, []);

  /* ===== ART timer ===== */
  useEffect(() => {
    const i = setInterval(() => {
      const active =
        Date.now() - lastActivityRef.current < 5000 &&
        document.visibilityState === "visible";

      if (active) setArt((t) => t + 1);
    }, 1000);

    return () => clearInterval(i);
  }, []);

  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 bg-white border-b px-6 py-2 text-sm flex justify-between z-50">
        <span className="truncate">Source: {url}</span>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          Open original
        </a>
      </div>

      <article className="prose mt-16">
        {content || "Loading..."}
      </article>
    </main>
  );
}
