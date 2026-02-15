"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import ProgressBar from "../../components/ProgressBar";
import ReactMarkdown from "react-markdown";

const REQUIRED_TIME = 240; // 4 minutes
const REQUIRED_QUESTIONS = 5;

export default function Experiment() {
  const router = useRouter();

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

  // airtable 
  const logEvent = async ({ log_type, log_data }) => {
    try {
      const nowIso = new Date().toISOString(); 
      const nowMs = Date.now();               

      await fetch("/api/experiment-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participant_id: participantId,
          condition: systemType, // WebSearch | ConvSearch
          task_id: taskType,
          log_type,
          log_data: {
            ...log_data,
            timestamp_iso_ms: nowIso,
            timestamp_unix_ms: nowMs,
          },
          timestamp: nowIso, // Airtable Date field
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
      ? `You will use search engines to conduct the search about the given topic. You can revisit the search tasks on the left panel at any time and use the scrap section on the right to save any information you find.`
      : `You will use Chat AI to conduct the search about the given topic. You can revisit the search tasks on the left panel at any time and use the scrap section on the right to save any information you find.`
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

  const canProceed = seconds >= REQUIRED_TIME && questionCount >= REQUIRED_QUESTIONS;

  // scrap
  
  const addScrap = ({ title, fullText, source }) => {
    if (typeof window === "undefined") return;
    const selectedText = window.getSelection()?.toString().trim();
    logEvent({
      log_type: "scrap",
      log_data: {
        title,
        snippet: selectedText || fullText,
        source,
      },
    });

    setScraps((prev) => [
      ...prev,
      {
        type: "scrap",
        title,
        snippet: selectedText || fullText,
        source,
        comment: "",
      },
    ]);
    window.getSelection()?.removeAllRanges();
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
  const addNote = () => {
    setScraps((prev) => [
      ...prev,
      {
        type: "note",
        title: "Note",
        snippet: "",
        source: "note",
        comment: "",
      },
    ]);
  };
  const allowChatDragRef = useRef(false);

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

  const CitationBadge = ({ displayId, sources }) => {
    const [showPopup, setShowPopup] = useState(false);
    
    const numericId = displayId.replace(/[^0-9]/g, "");
    const source = sources?.find((s) => String(s.id) === numericId);
    if (!source) {
    return <span className="text-gray-500">{displayId}</span>;
    }

    return (
      <span className="relative inline-block mx-1 align-baseline">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowPopup(!showPopup);
          }}
          className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium border border-gray-300 bg-white text-blue-600 rounded-full hover:bg-blue-50 transition shadow-sm"
        >
          <span>🔗</span>
          Source {numericId}
        </button>

        {showPopup && (
          <>
          <div 
            className="fixed inset-0 z-[90]" 
            onClick={() => setShowPopup(false)} 
          />
          <div className="absolute bottom-full mb-2 left-0 w-72 bg-white border border-gray-200 shadow-2xl rounded-lg p-4 z-[100] text-left animate-in fade-in slide-in-from-bottom-1">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-bold text-blue-600 tracking-wider uppercase">
                Source {numericId}
              </span>
              <button
                onClick={() => setShowPopup(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                ✕
              </button>
            </div>
            
            <h4 className="text-sm font-bold text-gray-900 leading-snug mb-2 line-clamp-2">
              {source.title}
            </h4>
            
            <p className="text-xs text-gray-600 leading-relaxed mb-3 line-clamp-4">
              {source.snippet}
            </p>
            
            <div className="pt-2 border-t border-gray-100">
              <a
                href={source.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-blue-600 font-semibold hover:underline flex items-center gap-1"
                onClick={(e) => e.stopPropagation()} // 링크 클릭 시 팝업 닫힘 방지
              >
                자세히 보기 <span className="text-[9px]">↗</span>
              </a>
            </div>
          </div>
          </>
        )}
      </span>
    );
  };
  
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
      setSystemType(storedSystem); // "WebSearch" | "ConvSearch"

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
      logEvent({
        log_type: "ai_response",
        log_data: { response: data?.text || "" },
      });

      setChatHistory((prev) => {
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        updated[lastIdx] = {
          role: "assistant",
          content: data?.text,
          sources: data?.sources || [],
        };
        return updated;
      });
      
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
     Gen AI (ChatSearch)
  ========================= */
  const handleGenAISubmit = async (e) => {
    e.preventDefault();
    const userInput = searchQuery.trim();
    if (!userInput || isGenerating) return;
    logEvent({
      log_type: "prompt",
      log_data: { prompt: userInput },
    });


    // Count only valid user questions
    setQuestionCount((prev) => prev + 1);

    // Append user + loading assistant
    setChatHistory((prev) => [
      ...prev,
      { role: "user", content: userInput },
      { role: "assistant", content: "Generating response...", loading: true },
    ]);

    setSearchQuery("");
    setIsGenerating(true);

    try {
      const prompt = `
        Please answer briefly and kindly, as if responding in a friendly and helpful manner.
        When necessary, use clear headings, bullet points, and formatting to organize the information.
        **IMPORTANT CITATION RULE:**
          Provide a detailed answer with in-text citations. 
          Each citation MUST be in the format: [Sources 1], [Sources 2], etc.
        User:
        ${userInput}
              `.trim();

      const res = await fetch("/api/llm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          maxTokens: 120,
        }),
      });

      const data = await res.json();
      logEvent({
        log_type: "ai_response",
        log_data: { response: data?.text || "" },
      });

      setChatHistory((prev) => {
        const updated = [...prev];
        // Replace the last "loading" assistant message safely
        const lastIdx = updated.length - 1;
        if (lastIdx >= 0 && updated[lastIdx]?.role === "assistant" && updated[lastIdx]?.loading) {
          updated[lastIdx] = {
            role: "assistant",
            content: data?.text || "No response generated.",
          };
        } else {
          // fallback: append if structure changed unexpectedly
          updated.push({ role: "assistant", content: data?.text || "No response generated." });
        }
        return updated;
      });
    } catch (err) {
      console.error(err);
      setChatHistory((prev) => {
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        if (lastIdx >= 0 && updated[lastIdx]?.role === "assistant" && updated[lastIdx]?.loading) {
          updated[lastIdx] = {
            role: "assistant",
            content: "An error occurred while generating the response.",
          };
        } else {
          updated.push({
            role: "assistant",
            content: "An error occurred while generating the response.",
          });
        }
        return updated;
      });
    } finally {
      setIsGenerating(false);
    }
  };
  const renderWithCitations = (content, sources) => {
    if (Array.isArray(content)) {
      return content.map((child, idx) => (
        <span key={idx}>{renderWithCitations(child, sources)}</span>
      ));
    }
    if (typeof content !== "string") return content;

    const regex = /(\[(?:Source|Sources?)\s+\d+\])/gi;
    const parts = content.split(regex);

    return parts.map((part, i) => {
      if (part.match(/\[(?:Source|Sources?)\s+\d+\]/i)) {
        return <CitationBadge key={i} displayId={part} sources={sources} />;
      }
      return part;
    });
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
        setScraps((prev) => [...prev, {type: "web", title: dropped.title, link: dropped.link, comment: ""}]);
      return;
    }
      setScraps((prev) => [...prev, { ...dropped, comment: "" }]);
    } catch {
      // ignore invalid payload
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
                onClick={() => setShowIntroModal(false)}
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
                      <div
                        key={r.id}
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData("text/plain", JSON.stringify({type: "web", title: r.title, link: r.link}))}
                        className="bg-white border p-3 mb-3 rounded cursor-grab"
                      >
                        
                        <h3 className="font-semibold text-blue-700 hover:underline">
                          <a
                            href={r.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => {
                              e.stopPropagation();
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
                            {r.title}
                          </a>
                        </h3>
                        <p className="text-sm mt-1">{r.snippet}</p>
                        <a
                          href={r.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-green-700 break-all hover:underline mt-1 inline-block"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {r.link}
                        </a>
                      </div>
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
                <div className="flex-1 p-4 overflow-y-auto pb-36">
                {/* Chat history */}
                <div className="mx-auto w-full max-w-3xl space-y-4">
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
                        draggable={allowChatDragRef.current}
                        onMouseDown={() => {
                          allowChatDragRef.current = false;
                        }}
                          onMouseUp={() => {
                            const selection = window.getSelection()?.toString().trim();
                            if (selection) {
                              allowChatDragRef.current = true; 
                            }
                          }}
                          onDragStart={(e) => {
                            const selection = window.getSelection()?.toString().trim();
                            if (!selection) {
                              e.preventDefault();
                              return;
                            }
                            e.dataTransfer.setData(
                              "text/plain",
                              JSON.stringify({
                                type: "scrap",
                                title: "ConvSearch",
                                snippet: selection,
                                source: "chat",
                            })
                          );
                        }}
                      >
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => (
                              <p className="mb-2 last:mb-0">
                                {renderWithCitations(children, msg.sources)}
                              </p>
                            ),
                            li: ({ children }) => (
                              <li className="mb-1 last:mb-0">
                                {renderWithCitations(children, msg.sources)}
                              </li>
                            ),
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>

                        {isAssistant && !msg.loading && (
                          <button
                            onClick={() =>
                              addScrap({
                                title: "ConvSearch",
                                fullText: msg.content,
                                source: "chat",
                              })
                            }
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

              {/* Input area */}
              <form
                onSubmit={handleGenAISubmit}
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
                  <ReactMarkdown className="prose prose-sm max-w-none">
                    {item.snippet}
                  </ReactMarkdown>
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
      </div>
  );
}
