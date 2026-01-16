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


  const instructionMessage = systemType
    ? systemType === "WebSearch"
      ? `You will use search engines to conduct the search about the given topic. You can revisit the search tasks on the left panel at any time and use the scrap section on the right to save any information you find.`
      : `You will use Chat AI to conduct the search about the given topic. You can revisit the search tasks on the left panel at any time and use the scrap section on the right to save any information you find.`
    : "";


  // Search Engine
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  // GenAI Chat
  const [chatHistory, setChatHistory] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Common
  const [scraps, setScraps] = useState([]);
  const [seconds, setSeconds] = useState(0);
  const [taskOpen, setTaskOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  const canProceed = seconds >= REQUIRED_TIME && questionCount >= REQUIRED_QUESTIONS;

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
     SEARCH ENGINE HANDLER
  ========================= */
  const handleSearch = async (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;

    // Count only valid queries
    setQuestionCount((prev) => prev + 1);

    try {
      const res = await fetch(`/api/SearchEngine?q=${encodeURIComponent(q)}&start=1`);
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
     GENAI HANDLER (CHAT)
  ========================= */
  const handleGenAISubmit = async (e) => {
    e.preventDefault();
    const userInput = searchQuery.trim();
    if (!userInput || isGenerating) return;

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
At the end of the response, always include 3 to 5 numbered suggestions for additional searching or follow-up questions.

User:
${userInput}
      `.trim();

      const res = await fetch("/api/llm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          maxTokens: 80,
        }),
      });

      const data = await res.json();

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

  /* =========================
     SCRAPBOOK
  ========================= */
  const handleDrop = (e) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData("text/plain");
    if (!raw) return;

    try {
      const dropped = JSON.parse(raw);
      // Use functional update to avoid stale-state bugs
      setScraps((prev) => [...prev, { ...dropped, comment: "" }]);
    } catch {
      // ignore invalid payload
    }
  };

  const handleUpdateScrapComment = (index, value) => {
    setScraps((prev) => {
      const next = [...prev];
      if (!next[index]) return prev;
      next[index] = { ...next[index], comment: value };
      return next;
    });
  };

  const handleNext = () => {
    router.push("/postsurvey");
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

      <div className="relative flex flex-1 overflow-hidden">
        {/* Left Panel (same as Step 2) */}
        <div
          className={`bg-gray-50 sticky top-0
            h-full
            transition-all
            ${taskOpen ? "w-[22%]" : "w-[64px]"}
            relative
            after:content-['']
            after:absolute
            after:top-0
            after:right-0
            after:w-px
            after:h-screen
            after:bg-gray-300
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
                <div ref={taskPanelAnchorRef} className="bg-white p-4 rounded border text-lg space-y-3">
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

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center">
          <div className="max-w-2xl w-full text-center space-y-6 px-6">
            <h1 className="text-3xl font-bold">
              Now you will start a search!
              <br />
              Perform a search to explore evidence about {topic}.
            </h1>

            <div className="bg-gray-100 p-6 rounded-lg text-left">
              <p className="text-lg">{instructionMessage}</p>
            </div>

            <button
              onClick={() => {
                setStep(2);
                setShowIntroModal(true);
              }}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg"
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
    <div className="flex flex-col min-h-screen">
      <div className="sticky top-0 z-50">
        <ProgressBar progress={50} />
      </div>

      {/* Timer */}
      <div className="fixed top-4 right-6 bg-black text-white px-4 py-2 rounded-md text-sm z-50">
        Time: {Math.floor(seconds / 60)}:{(seconds % 60).toString().padStart(2, "0")}
      </div>

      <div className="relative flex flex-1 overflow-hidden">
        {/* Left Panel */}
        <div
          className={`bg-gray-50 sticky top-0
            h-full
            transition-all
            ${taskOpen ? "w-[22%]" : "w-[64px]"}
            relative
            after:content-['']
            after:absolute
            after:top-0
            after:right-0
            after:w-px
            after:h-screen
            after:bg-gray-300
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
                <div ref={taskPanelAnchorRef} className="bg-white p-4 rounded border text-lg space-y-3">
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
        <div className="flex-1 border-r overflow-hidden mr-[18%]">
          {systemType === "WebSearch" ? (
            /* Search Engine UI */
            <div className="flex flex-col h-full">
              <form onSubmit={handleSearch} className="flex p-3 border-b">
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
                    onDragStart={(e) => e.dataTransfer.setData("text/plain", JSON.stringify(r))}
                    className="bg-white border p-3 mb-3 rounded cursor-grab"
                  >
                    <h3 className="font-semibold text-blue-700 hover:underline">
                      <a
                        href={r.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
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
            </div>
          ) : (
            /* GenAI Chat UI */
            <div className="flex flex-col h-full bg-gray-50">
              {/* Chat history */}
              <div className="flex-1 p-4 overflow-y-auto">
                <div className="mx-auto w-full max-w-3xl space-y-4">
                  {chatHistory.map((msg, idx) => {
                    const isAssistant = msg.role === "assistant";

                    return (
                      <div
                        key={idx}
                        className={`relative p-4 rounded-xl text-base leading-relaxed ${
                          isAssistant
                            ? "bg-white border"
                            : "bg-blue-600 text-white ml-auto max-w-lg"
                        }`}
                      >
                        <ReactMarkdown>{msg.content}</ReactMarkdown>

                        {isAssistant && !msg.loading && (
                          <button
                            onClick={() =>
                              setScraps((prev) => [
                                ...prev,
                                {
                                  title: "ConvSearch",
                                  snippet: msg.content,
                                  source: "chat",
                                  comment: "",
                                },
                              ])
                            }
                            className="
                              absolute top-2 right-2
                              text-xs px-2 py-1 rounded
                              bg-gray-100 hover:bg-gray-200
                              border cursor-pointer
                            "
                            title="Save to scrapbook"
                          >
                            📌 Scrap
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Input area */}
              <form
                onSubmit={handleGenAISubmit}
                className="border-t bg-white py-4 flex justify-center"
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

        {/* Scrapbook */}
        <div
          className="fixed top-0 right-0 h-screen
          w-[18%] min-w-[220px] bg-gray-50 border-l flex flex-col z-40"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          {/* Title */}
          <div className="p-4 border-b">
            <h2 className="mt-2 font-semibold mb-1">Scrapbook</h2>
          </div>

          {/* Scrap list (scrollable) */}
          <div className="flex-1 p-4 overflow-y-auto">
            {scraps.map((item, i) => (
              <div key={i} className="bg-white p-3 mb-3 rounded border">
                <p className="text-sm">{item.snippet}</p>
                <textarea
                  className="w-full border mt-2 p-2 text-sm"
                  placeholder="Your notes..."
                  value={item.comment}
                  onChange={(e) => handleUpdateScrapComment(i, e.target.value)}
                />
              </div>
            ))}
          </div>

          {/* Proceed button */}
          <div className="p-4 border-t">
            <button
              onClick={handleNext}
              disabled={!canProceed}
              className={`
                w-full py-3 rounded-lg font-semibold transition-all
                ${canProceed
                  ? "bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
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
