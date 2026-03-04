"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import ProgressBar from "../../components/ProgressBar";
import ReactMarkdown from "react-markdown";
import { useSearchParams } from "next/navigation";

const REQUIRED_TIME = 240; // 4 minutes
const REQUIRED_QUESTIONS = 5;


function getFaviconUrl(pageUrl) {
  try {
    const u = new URL(pageUrl);
    const domain = u.hostname;
    // Google favicon service
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`;
  } catch {
    return "https://www.google.com/s2/favicons?domain=example.com&sz=64";
  }
}

function CitationPill({ n, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        inline-flex items-center gap-1
        px-2 py-1.5
        rounded-full
        border border-gray-300
        bg-gray-50 hover:bg-gray-100
        text-xs font-medium text-gray-700
        align-middle
        mx-0.5
      "
      aria-label={`Open source ${n}`}
    >
      <span aria-hidden className="text-gray-400">🔗</span>
      <span>source {n}</span>
    </button>
  );
}

function ReferenceModal({ open, source, onClose, onScrap }) {
  if (!open || !source) return null;

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/40 flex items-center justify-center p-8"
      onClick={onClose} 
    >
      <div
        className="w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-gray-200 p-6"
        onClick={(e) => e.stopPropagation()} 
      >
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-start gap-3 min-w-0">
            {/* ✅ favicon */}
            {source.url ? (
              <div className="h-8 w-8 rounded-full border border-gray-200 bg-white flex items-center justify-center overflow-hidden shrink-0 mt-0.5">
                <img
                  src={getFaviconUrl(source.url)}
                  alt=""
                  className="h-8 w-8 object-contain"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://www.google.com/s2/favicons?domain=example.com&sz=64";
                  }}
                />
              </div>
            ) : null}

            <div className="min-w-0">
              <div className="text-lg font-semibold text-gray-900 break-words">
                {source.title || "Source"}
              </div>

              {source.url && (
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-sm text-blue-600 hover:underline break-all"
                >
                  {source.url}
                </a>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-3xl leading-none"
          >
            ×
          </button>
        </div>

        {source.snippet && (
          <div className="mt-5 pt-4 border-t border-gray-100">
            <p className="mt-3 text-base text-gray-700 leading-relaxed whitespace-pre-wrap">
              {source.snippet}
            </p>
          </div>
        )}
        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
          <button
            type="button"
            onClick={() => { onScrap(source); onClose(); }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 text-sm font-medium text-gray-700 transition"
          >
            📌 Scrap this source
          </button>
        </div>
      </div>
    </div>
  );
}


function renderInlineCitations(children, sources = [], onOpenSource) {
  const childArray = React.Children.toArray(children);
  return childArray.map((child, idx) => {
    if (typeof child !== "string") return <span key={idx}>{child}</span>;

    const parts = child.split(/(\[[0-9,\s]+\])/g);

    return (
      <span key={idx}>
        {parts.map((part, i) => {
          const m = part.match(/^\[([0-9,\s]+)\]$/);
          if (!m) return <span key={`${idx}-${i}`}>{part}</span>;

          const nums = m[1]
            .split(",")
            .map((s) => Number(s.trim()))
            .filter((n) => Number.isFinite(n) && n > 0);

          return (
            <span key={`${idx}-${i}`} className="inline">
              {nums.map((n, j) => {
                const src = sources?.[n - 1];
                if (!src) return <span key={`${n}-${j}`}>[{n}]</span>;

                return (
                  <CitationPill
                    key={`${n}-${j}`}
                    n={n}
                    onClick={() => onOpenSource(src)}
                  />
                );
              })}
            </span>
          );
        })}
      </span>
    );
  });
}

function parseInline(text, sources, onOpenSource, keyPrefix) {
  if (!text) return null;
  const parts = text.split(/(\[[0-9,\s]+\])/g);
  const nodes = [];
  parts.forEach((part, i) => {
    const m = part.match(/^\[([0-9,\s]+)\]$/);
    if (m) {
      const nums = m[1].split(",").map(s => Number(s.trim())).filter(n => Number.isFinite(n) && n > 0);
      nums.forEach((n, j) => {
        const s2 = sources?.[n - 1];
        if (!s2) { nodes.push(<span key={`${keyPrefix}-${i}-${j}`}>[{n}]</span>); return; }
        nodes.push(<CitationPill key={`${keyPrefix}-${i}-${j}`} n={n} onClick={() => onOpenSource(s2)} />);
      });
      return;
    }
    const ip = part.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
    ip.forEach((x, ii) => {
      const k = `${keyPrefix}-${i}-${ii}`;
      if (/^\*\*([^*]+)\*\*$/.test(x)) nodes.push(<strong key={k}>{x.slice(2,-2)}</strong>);
      else if (/^\*([^*]+)\*$/.test(x)) nodes.push(<em key={k}>{x.slice(1,-1)}</em>);
      else if (/^`([^`]+)`$/.test(x)) nodes.push(<code key={k} className="bg-gray-100 rounded px-1 text-sm font-mono">{x.slice(1,-1)}</code>);
      else if (x) nodes.push(<span key={k}>{x}</span>);
    });
  });
  return nodes;
}

function MarkdownWithCitations({ content, sources, onOpenSource }) {
  if (!content) return null;
  const lines = String(content).split("\n");
  const blocks = [];
  let olCounter = 0; let inCode = false; let codeLines = [];
  lines.forEach((line, i) => {
    if (line.trim().startsWith("```")) {
      if (!inCode) { inCode = true; codeLines = []; }
      else { inCode = false; blocks.push(<pre key={`code-${i}`} className="bg-gray-100 rounded p-3 my-2 text-sm font-mono overflow-x-auto whitespace-pre-wrap">{codeLines.join("\n")}</pre>); codeLines = []; }
      return;
    }
    if (inCode) { codeLines.push(line); return; }
    if (!line.trim()) { olCounter = 0; blocks.push(<div key={`gap-${i}`} className="h-2" />); return; }
    const h1 = line.match(/^#\s+(.*)/);   if (h1) { olCounter=0; blocks.push(<div key={`h1-${i}`} className="mt-4 mb-1 text-lg font-bold text-gray-900 border-b border-gray-200 pb-1">{parseInline(h1[1],sources,onOpenSource,`h1-${i}`)}</div>); return; }
    const h2 = line.match(/^##\s+(.*)/);  if (h2) { olCounter=0; blocks.push(<div key={`h2-${i}`} className="mt-4 mb-1 text-base font-bold text-gray-900 border-b border-gray-200 pb-1">{parseInline(h2[1],sources,onOpenSource,`h2-${i}`)}</div>); return; }
    const h3 = line.match(/^###\s+(.*)/); if (h3) { olCounter=0; blocks.push(<div key={`h3-${i}`} className="mt-3 mb-1 text-sm font-bold text-gray-800">{parseInline(h3[1],sources,onOpenSource,`h3-${i}`)}</div>); return; }
    const ul = line.match(/^[\s]*[-*\u2022]\s+(.*)/u);
    if (ul) { olCounter=0; blocks.push(<div key={`ul-${i}`} className="flex gap-2 my-0.5 leading-relaxed"><span className="mt-2 shrink-0 w-1.5 h-1.5 rounded-full bg-gray-500 inline-block" /><span>{parseInline(ul[1],sources,onOpenSource,`ul-${i}`)}</span></div>); return; }
    const ol = line.match(/^[\s]*(\d+)[.)]\s+(.*)/);
    if (ol) { olCounter++; blocks.push(<div key={`ol-${i}`} className="flex gap-2 my-0.5 leading-relaxed"><span className="shrink-0 text-gray-600 font-medium min-w-[1.2rem]">{olCounter}.</span><span>{parseInline(ol[2],sources,onOpenSource,`ol-${i}`)}</span></div>); return; }
    if (/^---+$/.test(line.trim())) { olCounter=0; blocks.push(<hr key={`hr-${i}`} className="my-3 border-gray-200" />); return; }
    const bq = line.match(/^>\s+(.*)/); if (bq) { olCounter=0; blocks.push(<div key={`bq-${i}`} className="border-l-4 border-gray-300 pl-3 my-1 text-gray-600 italic">{parseInline(bq[1],sources,onOpenSource,`bq-${i}`)}</div>); return; }
    olCounter=0; blocks.push(<div key={`p-${i}`} className="my-0.5 leading-relaxed">{parseInline(line,sources,onOpenSource,`p-${i}`)}</div>);
  });
  return <div className="text-sm text-gray-800">{blocks}</div>;
}
function makeMessageId(prefix = "m") {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  // fallback
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function countWords(text = "") {
  const t = String(text).trim();
  if (!t) return 0;
  return t.split(/\s+/).filter(Boolean).length;
}

function nextTurnIndex(chatHistory = []) {
  const assistantCount = chatHistory.filter((m) => m.role === "assistant").length;
  return assistantCount + 1;
}

export default function Experiment() {
  return (
    <React.Suspense fallback={null}>
      <ExperimentContent />
    </React.Suspense>
  );
}

function ExperimentContent() {
  const router = useRouter(); 
  const searchParams = useSearchParams(); 
  useEffect(() => {
    const pid = searchParams.get("pid");
    const system = searchParams.get("system");
    const topic = searchParams.get("topic");

    if (pid) localStorage.setItem("participant_id", pid);

    if (system) {
      localStorage.setItem("system_type", system);
    }

    if (topic) localStorage.setItem("task_type", topic);
  }, [searchParams]);

  const [questionCount, setQuestionCount] = useState(0);
  const [showIntroModal, setShowIntroModal] = useState(true);

  const [step, setStep] = useState(1);
  const [participantId, setParticipantId] = useState(null);

  const [scenario, setScenario] = useState("");
  const [task, setTask] = useState("");
  const [systemType, setSystemType] = useState(null);
  const [taskType, setTaskType] = useState("");
  const topic = taskType;
  const taskPanelAnchorRef = useRef(null);

  const isRAG = systemType === "RAGSearch";


  // airtable 
  const logEvent = async ({ log_type, log_data }) => {
    try {
      const nowIso = new Date().toISOString();
      const nowMs = Date.now();

      const pid =
        participantId || (typeof window !== "undefined" ? localStorage.getItem("participant_id") : null);
      const condition =
        systemType || (typeof window !== "undefined" ? localStorage.getItem("system_type") : null);
      const taskid =
        taskType || (typeof window !== "undefined" ? localStorage.getItem("task_type") : null);

      if (!pid) {
        console.warn("[logEvent] missing participant_id; skipped:", { log_type, log_data });
        return;
      }

      await fetch("/api/experiment-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participant_id: pid,
          condition: condition || "",
          task_id: taskid || "",
          log_type,
          log_data: {
            ...log_data,
            timestamp_iso_ms: nowIso,
            timestamp_unix_ms: nowMs,
          },
          timestamp: nowIso,
        }),
      });
    } catch (err) {
      console.error("Logging failed:", err);
    }
  };

  const logFinalScrapbook = async () => {
    await logEvent({
      log_type: "final_scrapbook",
      log_data: {
        total_items: scraps.length,
        scraps: scraps.map((item, index) => ({
          index,
          type: item.type,           // scrap | web | note
          title: item.title || null,
          snippet: item.snippet || null,
          source: item.source || null,
          comment: item.comment || "",
        })),
      },
    });
  };

  const instructionMessage = systemType
    ? systemType === "WebSearch"
      ? `You will use search engines to conduct the search. You can revisit the search tasks on the left panel at any time and use the scrap section on the right to save any information you find.`
      : systemType === "RAGSearch"
        ? `You will use Chat AI to conduct the search. You can revisit the search tasks on the left panel at any time and use the scrap section on the right to save any information you find.`
        : `You will use Chat AI to conduct the search. You can revisit the search tasks on the left panel at any time and use the scrap section on the right to save any information you find.`
    : "";


  // Search Engine
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const isInitialState =
    searchResults.length === 0 && questionCount === 0;

  // GenAI Chat
  const [chatHistory, setChatHistory] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const isGenAIInitialState =
    chatHistory.length === 0 && questionCount === 0;

  // Common
  const [scraps, setScraps] = useState([]);
  const [seconds, setSeconds] = useState(0);
  const [taskOpen, setTaskOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refOpen, setRefOpen] = useState(false);
  const [activeSource, setActiveSource] = useState(null);
  const [scrapPopup, setScrapPopup] = useState({open: false, x: 0, y: 0, text: "", meta: null, msgSources: null});
  const generatingRef = useRef(false);
  const selectionRangeRef = useRef(null);    
  const suppressRestoreRef = useRef(false); 

  const chatScrollRef = useRef(null);
  const clearHighlight = () => {};

  const openSource = (src) => {
    setActiveSource(src);
    setRefOpen(true);
  };
  const closeSource = () => {
    setRefOpen(false);
    setActiveSource(null);
  };
  const canProceed = seconds >= REQUIRED_TIME && questionCount >= REQUIRED_QUESTIONS;

  const cleanSnippet = (raw) => {
    if (!raw) return "";
    return raw
      .split("\n")
      .filter(line => {
        const t = line.trim();
        if (!t) return false;
        if (/^source\s+\d+$/i.test(t)) return false;
        if (/^[\p{Emoji}\p{So}\p{Sk}\s]+$/u.test(t)) return false;
        if (/^[.\s]+$/.test(t)) return false;
        return true;
      })
      .join("\n")
      .replace(/\s*\[\d[\d,\s]*\]/g, "")
      .trim();
  };

  // scrap
  const addScrap = ({ title, fullText = "", source, meta, snippetOverride, msgSources }) => {
    const forced = (snippetOverride || "").trim();
    let selection = "";
    if (!forced && typeof window !== "undefined") {
      selection = window.getSelection()?.toString()?.trim() || "";
    }
    const rawText = (forced || selection || fullText || "").trim();
    if (!rawText) return;
    const citedNums = [...new Set(
      [...rawText.matchAll(/\[(\d[\d,\s]*)\]/g)]
        .flatMap(m => m[1].split(",").map(s => Number(s.trim())))
        .filter(n => Number.isFinite(n) && n > 0)
    )];
    const links = (msgSources && citedNums.length > 0)
      ? citedNums.map(n => ({ n, ...(msgSources[n - 1] || {}) })).filter(s => s.url)
      : [];
    const snippet = cleanSnippet(rawText);
    if (!snippet) return;
    setScraps((prev) => [
      ...prev,
      { type: "scrap", title, snippet, source, comment: "", links },
    ]);
    logEvent({
      log_type: "scrap",
      log_data: { title, snippet, source, links, system: systemType || "", ...(meta || {}) },
    });
  };

  const addWebScrap = (source) => {
    if (!source?.url) return;
    const item = { type: "web", title: source.title || source.url, link: source.url, comment: "" };
    setScraps((prev) => [...prev, item]);
    logEvent({
      log_type: "scrap",
      log_data: {
        title: source.title || "web",
        snippet: source.snippet || "",
        source: "rag_reference",
        link: source.url,
        system: systemType || "",
      },
    });
  };

  const handleDeleteScrap = (index) => {
  setScraps((prev) => prev.filter((_, i) => i !== index));
  };
  const autoResizeTextarea = (el) => {
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  };
  const [scrapWidth, setScrapWidth] = useState(24);
  const isDraggingRef = useRef(false);
  const isSelectingRef = useRef(false);
  const chatAreaRef = useRef(null);
  const addNote = () => {
    setScraps((prev) => {
      logEvent({
        log_type: "note",
        log_data: {
          action: "add",
          index: prev.length,
          system: systemType || "",
        },
      });
      return [
        ...prev,
        { type: "note", title: "Note", snippet: "", source: "note", comment: "" },
      ];
    });
  };

  useEffect(() => {
    const onMove = (e) => {
      if (!isDraggingRef.current) return;
      const newWidth = ((window.innerWidth - e.clientX) / window.innerWidth) * 100;
      if (newWidth >= 14 && newWidth <= 30) {
        setScrapWidth(newWidth);
      }
    };

    const onUp = () => {
      isDraggingRef.current= false;
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  const chatTitle = systemType;

  const closeScrapPopup = () =>
  setScrapPopup({ open: false, x: 0, y: 0, text: "", meta: null, msgSources: null });

  const maybeOpenScrapPopup = (msg) => {
    if (typeof window === "undefined") return;

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const text = sel.toString().trim();
    if (!text) return;

    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    if (!rect || (rect.width === 0 && rect.height === 0)) return;

    selectionRangeRef.current = range.cloneRange();
    suppressRestoreRef.current = false;

    // position:fixed → viewport coords only, no scrollX/Y offset
    const x = Math.min(rect.right + 6, window.innerWidth - 130);
    const y = Math.max(rect.top - 42, 8);

    setScrapPopup({
      open: true,
      x,
      y,
      text,
      meta: {
        request_id: msg.request_id,
        turn_index: msg.turn_index,
        message_id: msg.message_id,
      },
      msgSources: msg.sources || null,
    });
  };
  
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Bubble phase (no capture flag) so React synthetic events fire first.
    // Never call removeAllRanges() here — that kills drag-select in progress.
    // Only close UI chrome (popup + highlight overlay) when clicking outside.
    const onDocMouseDown = (e) => {
      const el = e.target instanceof Element ? e.target : null;
      if (el?.closest?.('[data-scrap-popup="1"]')) return;
      if (el?.closest?.('[data-selectable="1"]')) return;
      closeScrapPopup();
      clearHighlight();
    };

    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  const isRangeFullyInside = (containerEl, range) => {
    if (!containerEl || !range) return false;

    const startNode =
      range.startContainer?.nodeType === 1
        ? range.startContainer
        : range.startContainer?.parentElement;

    const endNode =
      range.endContainer?.nodeType === 1
        ? range.endContainer
        : range.endContainer?.parentElement;

    if (!startNode || !endNode) return false;

    return containerEl.contains(startNode) && containerEl.contains(endNode);
  };

  const setHighlightFromRange = () => {};
    
  /* =========================
     Initial setup
  ========================= */

  useEffect(() => {
    const storedTaskType = localStorage.getItem("task_type");
    if (storedTaskType) setTaskType(storedTaskType);
  }, []);

  useEffect(() => {
    const id = localStorage.getItem("participant_id");
    if (!id) {
      window.location.href = "/check";
      return;
    }
    setParticipantId(id);

    // Load task assignment from TaskPage
    const storedCase = localStorage.getItem("search_case");
    const storedTask = localStorage.getItem("search_task");
    if (storedCase) setScenario(storedCase);
    if (storedTask) setTask(storedTask);

    // Assign system type (persist)
    const storedSystem = localStorage.getItem("system_type");
    if (!storedSystem) {
      // assignment missing → safety fallback
      window.location.href = "/task";
      return;
    }
      setSystemType(storedSystem); // "WebSearch" | "RAGSearch" | "GenSearch"

    // Load scrapbook
    const savedScraps = localStorage.getItem("scrapbook");
    if (savedScraps) {
      try {
        setScraps(JSON.parse(savedScraps));
      } catch {
        // ignore malformed
      }
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    localStorage.setItem("scrapbook", JSON.stringify(scraps));
  }, [scraps]);

  /* =========================
     TIMER (STEP 2)
     Start only after intro modal is closed
  ========================= */
  useEffect(() => {
    if (step !== 2 || showIntroModal) return;

    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [step, showIntroModal]);

  /* =========================
     Page popstate and step
  ========================= */

  useEffect(() => {
    window.history.pushState({ step }, "");

    const handlePopState = () => {
      if (step === 2) {
        setStep(1);
        window.history.pushState({ step: 1 }, "");
      } else {
        window.history.pushState({ step: 1 }, "");
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [step]);

  /* =========================
     Search Engine (WebSearch)
  ========================= */
  const handleSearch = async (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;

    // Count only valid queries
    setQuestionCount((prev) => prev + 1);
    logEvent({ log_type: "query", log_data: { query: q } }); //save log data 

    try {
      const res = await fetch(`/api/SearchEngine?q=${encodeURIComponent(q)}&requestedTotal=40`);
      const data = await res.json();

      const results =
        data.items?.map((item, idx) => ({
          id: `search-${idx}`,
          title: item.title,
          snippet: item.snippet,
          link: item.link,
        })) || [];

      setSearchResults(results);
      setSearchQuery("");
    } catch (err) {
      console.error(err);
    }
  };

  /* =========================
     Gen AI + Web (RAGSearch)
  ========================= */
  const handleRAGSubmit = async (e) => {
    e.preventDefault();
    const userInput = searchQuery.trim();
    if (!userInput) return;
    if (generatingRef.current) return; 
    generatingRef.current = true;  
    setIsGenerating(true);

    const request_id = makeMessageId("req");
    const turn_index = nextTurnIndex(chatHistory);
    const prompt_message_id = makeMessageId("p");     

    await logEvent({
      log_type: "prompt",
      log_data: {
        system: "RAGSearch",
        request_id,
        turn_index,
        message_id: prompt_message_id,
        prompt: userInput,
        prompt_word_count: countWords(userInput),
      },
    });
    setQuestionCount((prev) => prev + 1);

    // Fetch top N web results as sources (same as WebSearch)
    const searchRes = await fetch(
      `/api/SearchEngine?q=${encodeURIComponent(userInput)}&requestedTotal=8`
    );
    const searchData = await searchRes.json();

    const sources =
      searchData.items?.slice(0, 8).map((item, i) => ({
        id: i + 1,
        title: item.title,
        url: item.link,
        snippet: item.snippet,
      })) || [];


    // Append user + loading assistant
    setChatHistory((prev) => [
      ...prev,
      { role: "user", content: userInput, request_id, turn_index, message_id: prompt_message_id },
      { role: "assistant", content: "Generating response...", loading: true, request_id, turn_index },
    ]);

    setSearchQuery("");
    setIsGenerating(true);

    try {
      const res = await fetch("/api/llm-rag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: userInput,
          sources,
        }),
      });

      const data = await res.json();
      // AI answer log (RAGSearch)
      const answerText = data?.text || "";
      const answer_message_id = makeMessageId("rag");
      const word_count = countWords(answerText);
      await logEvent({
        log_type: "ai_answer",
        log_data: {
          system: "RAGSearch",
          request_id,
          turn_index,
          message_id: answer_message_id,
          prompt: userInput,
          answer: answerText,
          word_count,
          sources_used: (data?.sources || sources || []).map((s, i) => ({
            index: i + 1,
            title: s.title || null,
            url: s.url || null,
          })),
        },
      });

      setChatHistory((prev) => {
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        const assistantMsg = {
          role: "assistant",
          content: data?.text || "No response generated.",
          request_id,
          turn_index,
          message_id: answer_message_id,
          sources: data?.sources || sources,
        };
        if (lastIdx >= 0 && updated[lastIdx]?.role === "assistant" && updated[lastIdx]?.loading) {
          updated[lastIdx] = assistantMsg;
        } else {
          updated.push(assistantMsg);
        }
        return updated;
      });
    } catch (err) {
      console.error(err);
      setChatHistory((prev) => {
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        if (lastIdx >= 0 && updated[lastIdx]?.role === "assistant" && updated[lastIdx]?.loading) {
          updated[lastIdx] = { role: "assistant", content: "An error occurred while generating the response." };
        } else {
          updated.push({ role: "assistant", content: "An error occurred while generating the response." });
        }
        return updated;
      });
    } finally {
      setIsGenerating(false);
      generatingRef.current = false;
    }
  };

  /* =========================
     Gen AI (GenSearch)
  ========================= */
  const handleGenSubmit = async (e) => {
    e.preventDefault();
    const userInput = searchQuery.trim();
    if (!userInput) return;
    if (generatingRef.current) return;
    generatingRef.current = true;    
    setIsGenerating(true); 

    const request_id = makeMessageId("req");
    const turn_index = nextTurnIndex(chatHistory);
    const prompt_message_id = makeMessageId("p");

    await logEvent({
      log_type: "prompt",
      log_data: {
        system: "GenSearch",
        request_id,
        turn_index,
        message_id: prompt_message_id,
        prompt: userInput,
      },
    });

    setQuestionCount((prev) => prev + 1);
    setChatHistory((prev) => [
      ...prev,
      { role: "user", content: userInput, request_id, turn_index, message_id: prompt_message_id },
      { role: "assistant", content: "Generating response...", loading: true, request_id, turn_index },
    ]);

    setSearchQuery("");
    setIsGenerating(true);

    try {
      const res = await fetch("/api/llm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({      
          prompt: userInput,      
        }),
      });
      const data = await res.json();

      // AI answer logging (GenSearch)
      const answerText = data?.text || "";
      const answer_message_id = makeMessageId("gen");
      const word_count = countWords(answerText);
      await logEvent({
        log_type: "ai_answer",
        log_data: {
          system: "GenSearch",
          request_id,
          turn_index,
          message_id: answer_message_id,
          prompt_message_id,
          answer: answerText,
          word_count,
        },
      });

      setChatHistory((prev) => {
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        const assistantMsg = {
          role: "assistant",
          content: data?.text || "No response generated.",
          request_id,
          turn_index,
          message_id: answer_message_id,
        };
        if (lastIdx >= 0 && updated[lastIdx]?.role === "assistant" && updated[lastIdx]?.loading) {
          updated[lastIdx] = assistantMsg;
        } else {
          updated.push(assistantMsg);
        }
        return updated;
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
      generatingRef.current = false;
    }
  };

  /* =========================
     Scrapbook
  ========================= */
  const handleDrop = (e) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData("text/plain");
    if (!raw) return;

    try {
      const dropped = JSON.parse(raw);
      if (dropped.type === "web") {
        const item = { type: "web", title: dropped.title, link: dropped.link, comment: "" };
        setScraps((prev) => [...prev, item]);
        logEvent({
          log_type: "scrap",
          log_data: {
            title: dropped.title || "web",
            snippet: dropped.title || "",
            source: "web",
            link: dropped.link || "",
          },
        });
      return;
    }
    if (dropped.type === "scrap") {
      const item = { ...dropped, comment: "" };
      setScraps((prev) => [...prev, item]);

      logEvent({
        log_type: "scrap",
        log_data: {
          title: dropped.title || "chat",
          snippet: dropped.snippet || "",
          source: dropped.source || "chat",
          ...(dropped.meta || {}),
        },
      });
      return;
    }
  } catch {
  }
};

  const handleUpdateScrapComment = (index, value) => {
      if (value.length % 10 === 0) {
        logEvent({
          log_type: "note",
          log_data: {
            action: "update",
            index,
            content: value,
            system: systemType || "",
          },
        });
      }
      setScraps((prev) => {
        const next = [...prev];
        if (!next[index]) return prev;
        next[index] = { ...next[index], comment: value };
        return next;
      });
    };

  const handleNext = async () => {
    try {
      await logFinalScrapbook(); //final scrap & notes log

      await logEvent({
        log_type: "session_end",    //session end time log 
        log_data: {
          total_time_sec: seconds,
          total_questions: questionCount,
        },
      });

    } catch (err) {
      console.error("Final scrapbook logging failed:", err);
    } finally {
      router.push("/postsurvey");
    }
  };


  if (loading) {
    return (
      <main className="flex items-center justify-center min-h-screen">
        Loading experiment...
      </main>
    );
  }

  /* =========================
     PAGE 1
  ========================= */
  if (step === 1) {
    return (
      <div className="flex flex-col min-h-screen">
        <ProgressBar progress={15} />

        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel */}
          <div
            className={`
              sticky top-0 h-screen
              bg-gray-100 border-r border-gray-300
              transition-all
              ${taskOpen ? "w-[20%]" : "w-[64px]"}
              overflow-hidden
            `}
          >
            <div className="px-4 pt-2">
              <button
                onClick={() => setTaskOpen((v) => !v)}
                className="mb-4 w-10 h-10 rounded border bg-white shadow"
              >
                {taskOpen ? "←" : "→"}
              </button>

              {taskOpen && (
                <div className="p-4 mt-2">
                  <div className="p-4 rounded border border-gray-300 text-base space-y-4">
                    <div>
                      <strong>Search Case</strong>
                      <p className="mt-1 whitespace-pre-wrap">
                        {scenario}
                      </p>
                    </div>
                    <div>
                      <strong>Search Task</strong>
                      <p className="mt-1 whitespace-pre-wrap">
                        {task}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Intro Content */}
          <div className="flex-1 flex items-center justify-center">
            <div className="max-w-2xl w-full text-center space-y-8 px-6">
              <h1 className="text-3xl font-bold leading-snug">
                Now you will start a search!
                <br />
                Perform a search to explore evidence about {topic}.
              </h1>

              <div className="bg-gray-100 p-6 rounded-lg text-left">
                <p className="text-base leading-relaxed">
                  {instructionMessage}
                </p>
              </div>

              <button
                onClick={() => {
                  setStep(2);
                  setShowIntroModal(true);
                }}
                className="
                  inline-flex items-center justify-center
                  bg-blue-600 text-white
                  px-8 py-3 rounded-lg
                  font-medium
                  hover:bg-blue-700
                  transition
                "
              >
                Start Experiment →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* =========================
     PAGE 2
  ========================= */
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <div className="sticky top-0 z-50">
        <ProgressBar progress={50} />
      </div>

      {/* Timer */}
      <div className="fixed top-6 right-5 z-[60]">
        {/* Timer Overlay */}
        <div className="bg-black text-white px-4 py-2 rounded-md text-sm">
            Time: {Math.floor(seconds / 60)}:
            {(seconds % 60).toString().padStart(2, "0")}
        </div>
      </div>

      <div className="relative flex flex-1 overflow-x-hidden">
        {/* Left Panel */}
        <div
          className={`
            fixed top-0 left-0 h-full 
            bg-gray-100 border-r border-gray-300
            transition-all
            ${taskOpen ? "w-[20%]" : "w-[64px]"}
          `}
        >

          <div className="px-4 pt-4">
            <button
              onClick={() => setTaskOpen((v) => !v)}
              className="mb-4 w-10 h-10 rounded border bg-white shadow"
            >
              {taskOpen ? "←" : "→"}
            </button>

            {taskOpen && (
              <div className="p-4 mt-2">
                <div ref={taskPanelAnchorRef} className="p-4 rounded border border-gray-300 text-base space-y-4">
                  <div>
                    <strong>Search Case</strong>
                    <p className="mt-1 whitespace-pre-wrap">{scenario}</p>
                  </div>
                  <div>
                    <strong>Search Task</strong>
                    <p className="mt-1 whitespace-pre-wrap">{task}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Intro Modal: blocks interaction until closed */}
        {showIntroModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white max-w-lg w-full p-6 rounded-xl relative shadow-lg">
              <button
                onClick={() => {
                  setShowIntroModal(false);
                  logEvent({
                    log_type: "session_start",
                    log_data: { system: systemType || "" },
                  });
                }}
                className="absolute top-3 right-3 text-gray-500 text-xl"
                aria-label="Close"
              >
                ×
              </button>

              <h2 className="text-xl font-semibold mb-4">Notification</h2>

              <p className="text-base leading-relaxed">
                Please search freely regarding the assigned task. <br />
                If you search... <br />
                1. for at least four minutes and <br />
                2. enter multiple search inputs, <br />
                you will be able to proceed to the next page.
              </p>

              <div className="mt-5 text-sm text-gray-500">
                Your timer will start after you close this window.
              </div>
            </div>
          </div>
        )}

        {/* Main Area */}
        <div className="flex-1 overflow-hidden"
          style={{
            paddingLeft: taskOpen ? "20%" : "64px",
            paddingRight: `${scrapWidth}%`,
          }}
        >
        <div className="h-full flex">
          <div className="flex-1 overflow-hidden">
            <div className="mx-auto max-w-3xl h-full">
          {systemType === "WebSearch" ? ( 
            /* Search Engine UI */
            <div className="flex flex-col h-full">

              {/* search result */}
              {isInitialState ? (
                <div className="flex flex-col items-center justify-center h-full bg-white px-4">
                  <div className="w-full max-w-xl bg-white border rounded-xl p-10 text-center space-y-6 mb-8">
                    <div className="text-4xl">🔍</div>

                    <h2 className="text-2xl font-semibold">
                      Start your search
                    </h2>

                    <p className="text-gray-600">
                      Use the search box above to explore scientific evidence about {" "}
                      <span className="font-medium">{topic}</span>.
                    </p>

                    <ul className="text-sm text-gray-500 space-y-2">
                      <li>• Try different search approaches</li>
                      <li>• Refine your queries as you go</li>
                      <li>• Save anything useful in the scrapbook</li>
                    </ul>
                  </div>

                  {/* search bar */}
                  <form 
                    onSubmit={handleSearch} 
                    className="flex w-full max-w-xl"
                  >
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1 border px-4 py-3 rounded-l-md"
                      placeholder="Search Anything"
                      disabled={showIntroModal}
                    />
                    <button
                      className="bg-blue-600 text-white px-6 rounded-r-md"
                      disabled={showIntroModal}
                      type="submit"
                    >
                      Search
                    </button>
                  </form>
                </div>
              ) : (

                /* ===== After First Search ===== */
                <>
                  {/* search bar */}
                  <form onSubmit={handleSearch} className="flex p-3">
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1 border px-3 py-2"
                      placeholder="Type your query..."
                      disabled={showIntroModal}
                    />
                    <button
                      className="bg-blue-600 text-white px-4 disabled:opacity-50"
                      disabled={showIntroModal}
                      type="submit"
                    >
                      Search
                    </button>
                  </form>

                  <div className="flex-1 p-4 bg-gray-50 overflow-y-auto">
                    {searchResults.map((r) => (
                      <a
                        key={r.id}
                        href={r.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                        onClick={() => {
                          logEvent({
                            log_type: "click",
                            log_data: {
                              title: r.title,
                              snippet: r.snippet,
                              link: r.link,
                              rank: searchResults.findIndex(x => x.id === r.id) + 1,
                            },
                          });
                        }}
                      >
                        <div
                          draggable
                          onDragStart={(e) =>
                            e.dataTransfer.setData(
                              "text/plain",
                              JSON.stringify({ type: "web", title: r.title, link: r.link })
                            )
                          }
                          className="
                            bg-white border p-3 mb-3 rounded
                            cursor-pointer hover:bg-gray-50
                            transition
                          "
                        >
                          <div className="flex items-start gap-3">
                            {/* favicon */}
                            <div className="h-8 w-8 rounded-full border border-gray-200 bg-white flex items-center justify-center overflow-hidden shrink-0 mt-0.5">
                              <img
                                src={getFaviconUrl(r.link)}
                                alt=""
                                className="h-6 w-7 object-contain block"
                                loading="lazy"
                                referrerPolicy="no-referrer"
                              />
                            </div>

                            <div className="min-w-0">
                              <h3 className="font-semibold text-blue-700">
                                {r.title}
                              </h3>

                              <p className="text-sm mt-1 text-gray-800">
                                {r.snippet}
                              </p>
                            </div>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            
            /* GenAI Chat UI */
            <div className="flex flex-col h-full bg-white">
              {isGenAIInitialState ? (
                /* ===== Initial Empty State ===== */
                <div className="flex flex-col items-center justify-center h-full px-4">
                  <div className="w-full max-w-xl bg-white border rounded-xl p-10 text-center space-y-6">
                    <div className="text-4xl">🤖</div>
                    <h2 className="text-2xl font-semibold">
                      Start a conversation
                    </h2>
                    <p className="text-gray-600">
                      Ask the AI anything you'd like to know or discuss.
                    </p>
                    <ul className="text-sm text-gray-500 space-y-2 text-left inline-block">
                      <li>• Ask questions about {topic}</li>
                      <li>• Feel free to ask follow-up questions</li>
                      <li>• Save anything useful in the scrapbook</li>
                    </ul>
                  </div>
                </div>
                
              ) : (         
                <div ref={chatScrollRef} className="relative flex-1 p-4 overflow-y-auto pb-36">

                {/* Chat history */}
                <div ref={chatAreaRef} className="mx-auto w-full max-w-3xl space-y-4">
                  {chatHistory.map((msg, idx) => {
                    const isAssistant = msg.role === "assistant";

                    return (
                      <div
                        key={idx}
                        className={`relative p-4 rounded-xl text-base leading-relaxed ${
                          isAssistant
                            ? "bg-white border cursor-text"
                            : "bg-blue-600 text-white ml-auto max-w-lg"
                        }`}
                
                        onMouseUp={(e) => {
                          if (!isAssistant || msg.loading) return;
                          // Ignore mouseup on citation buttons / links
                          if (e.target?.closest?.("button, a")) return;

                          const sel = window.getSelection();
                          if (!sel || sel.rangeCount === 0) return;
                          const text = sel.toString().trim();
                          if (!text || text.length < 2) return;

                          const range = sel.getRangeAt(0);
                          // Only check that selection START is inside this message.
                          // We don't restrict the end — multi-line selections across
                          // <li> / <h2> / <p> boundaries must all work.
                          const startNode = range.startContainer.nodeType === 3
                            ? range.startContainer.parentElement
                            : range.startContainer;
                          if (!e.currentTarget.contains(startNode)) return;

                          setHighlightFromRange(range);
                          maybeOpenScrapPopup(msg);
                        }}
                      >
                      {isAssistant ? (
                        <div
                          data-selectable="1"
                          className="select-text"
                          style={{ userSelect: "text" }} 
                        >
                          <MarkdownWithCitations
                            content={msg.content}
                            sources={msg.sources || []}
                            onOpenSource={openSource}
                          />
                        </div>
                      ) : (
                        <div className="select-none">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      )}

                      {isAssistant && !msg.loading && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            addScrap({
                              title: chatTitle,
                              fullText: msg.content,
                              source: "chat",
                              snippetOverride: msg.content,
                              msgSources: msg.sources,
                              meta: {
                                request_id: msg.request_id,
                                turn_index: msg.turn_index,
                                message_id: msg.message_id,
                              },
                            });
                            closeScrapPopup();
                          }}
                          className="mt-4 self-end text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 border"
                        >
                          📌Scrap
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              </div>
              )}
              
              {isRAG && (
                <ReferenceModal open={refOpen} source={activeSource} onClose={closeSource} onScrap={addWebScrap} />
                )}

              {/* Input area */}
              <form
                onSubmit={isRAG ? handleRAGSubmit : handleGenSubmit}
                className="bg-white py-4 flex justify-center"
              >
                <div className="w-full max-w-xl flex items-center gap-2">
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Ask anything"
                    disabled={isGenerating || showIntroModal}
                    className="
                      w-full border rounded-full px-4 py-2 text-base
                      focus:outline-none focus:ring-2 focus:ring-blue-400
                      disabled:bg-gray-100
                    "
                  />
                  <button
                    type="submit"
                    disabled={isGenerating || showIntroModal || !searchQuery.trim()}
                    className="
                      ml-2 px-4 py-2 rounded-full
                      bg-blue-600 text-white
                      disabled:opacity-50
                    "
                  >
                    Enter
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>

        {/* Scrapbook */}
        <div
          className="absolute top-0 right-0 h-full bg-gray-50 border-l flex flex-col z-40"
          style={{ width: `${scrapWidth}%`, minWidth: 220, maxWidth: 600 }}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          {/* Drag Handle */}
          <div
            onMouseDown={() => (isDraggingRef.current = true)}
            className="absolute left-0 top-0 h-full w-1 cursor-col-resize bg-transparent hover:bg-blue-400/30 z-50"
            aria-label="Resize Scrapbook"
          />

          {/* Title */}
          <div className="p-4 border-b">
            <h2 className="mt-2 font-semibold mb-1">Scrapbook & Notes</h2>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 p-4 overflow-y-auto">
            {scraps.map((item, i) => (
              <div key={i} className="bg-white p-3 pt-6 mb-3 rounded border relative">
                <button
                  onClick={() => handleDeleteScrap(i)}
                  className="absolute top-2 right-2"
                >
                  ✕
                </button>

                {item.type === "scrap" && (
                  <div>
                    <div className="whitespace-pre-wrap text-sm text-gray-800">
                      {item.snippet}
                    </div>
                    {item.links && item.links.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-100 space-y-0.5">
                        {item.links.map((lk, li) => (
                          <div key={li} className="flex gap-1 text-xs">
                            <span className="shrink-0 font-medium text-gray-500">[{lk.n}]</span>
                            <a href={lk.url} target="_blank" rel="noopener noreferrer"
                               className="break-all text-blue-500 hover:underline">
                              {lk.url}
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {item.type === "web" && (
                  <div className="space-y-1">
                    <div className="text-sm font-semibold text-gray-800">
                      {item.title}
                    </div>
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-gray-500 break-all hover:underline"
                    >
                      {item.link}
                    </a>
                  </div>
                )}

                <textarea
                  className="w-full border mt-2 p-2 text-sm resize-none overflow-hidden"
                  placeholder={
                    item.type === "note"
                      ? "Write your note here..."
                      : "Your notes..."
                  }
                  value={item.comment}
                  onChange={(e) => {
                    handleUpdateScrapComment(i, e.target.value);
                    autoResizeTextarea(e.target);
                  }}
                  rows={1}
                />
              </div>
            ))}

          {/* + Note button*/}
          <button
            onClick={addNote}
            className="
                w-full mt-4 py-2
                border-2 border-dashed
                rounded-lg
                text-sm
                text-gray-600
                hover:bg-gray-100
                transition
              "
          >
            + Add a new note
          </button>
        </div>

          {/* Proceed button */}
          <div className="sticky bottom-0 bg-gray-50 p-4">
            <button
              onClick={handleNext}
              disabled={!canProceed}
              className={`
                w-full py-2.5 rounded-md font-semibold transition 
                ${canProceed
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"}
              `}
            >
              Proceed to Next Step →
            </button>
            
            {!canProceed && (
              <p className="mt-2 text-xs text-gray-500 text-center">
                Available after 4 minutes and multiple search inputs.
              </p>
            )}
            </div>
          </div>
        </div>
        {scrapPopup.open && (
          <div
            data-scrap-popup="1"
            className="fixed z-[70]"
            style={{ left: scrapPopup.x, top: scrapPopup.y }}
          >
            <button
              type="button"
              onMouseDown={(e) =>{
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();

                addScrap({
                  title: chatTitle,
                  source: "chat",
                  fullText: "",
                  snippetOverride: scrapPopup.text,
                  meta: scrapPopup.meta,
                  msgSources: scrapPopup.msgSources,
                });
                suppressRestoreRef.current = true;
                selectionRangeRef.current = null;
                window.getSelection()?.removeAllRanges();  
                closeScrapPopup();
              }}
              className="px-3 py-1 rounded-md bg-white border shadow text-xs hover:bg-gray-50"
            >
              📌 Scrap
            </button>
          </div>
        )}
      </div>
  );
}
