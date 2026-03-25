"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import ProgressBar from "../../components/ProgressBar";

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getColColors(n) {
  const half = Math.floor(n / 2);
  return Array.from({ length: n }, (_, i) => {
    if (i < half) {
      const t = half > 1 ? (half - 1 - i) / (half - 1) : 1;
      const opacity = 0.07 + t * 0.11;
      return {
        bg: `rgba(239, 68, 68, ${opacity.toFixed(2)})`,
        bgSelected: `rgba(239, 68, 68, ${(opacity + 0.12).toFixed(2)})`,
      };
    } else if (i > half) {
      const t = half > 1 ? (i - half - 1) / (half - 1) : 1;
      const opacity = 0.07 + t * 0.11;
      return {
        bg: `rgba(59, 130, 246, ${opacity.toFixed(2)})`,
        bgSelected: `rgba(59, 130, 246, ${(opacity + 0.12).toFixed(2)})`,
      };
    } else {
      return {
        bg: "rgba(107, 114, 128, 0.06)",
        bgSelected: "rgba(107, 114, 128, 0.18)",
      };
    }
  });
}

/* -------------------------------
   Likert Row (Pre-survey style)
-------------------------------- */
function LikertRow({
  index,
  question,
  labels,
  value,
  onChange,
  highlightRef,
  highlight,
}) {
  return (
    <div
      ref={highlightRef}
      className={`border-b pb-8 space-y-4 transition-all
        ${highlight ? "animate-flash border-2 border-red-500 rounded-lg p-4" : ""}`}
    >
      <p className="font-medium text-[18px]">
        {index}. {question}
      </p>

      <div className="flex justify-between text-sm text-gray-600">
        {labels.map((label, i) => (
          <label
            key={label}
            className="flex flex-col items-center w-[110px] cursor-pointer"
          >
            <input
              type="radio"
              checked={value === i + 1}
              onChange={() => onChange(i + 1)}
              className="w-7 h-7 accent-blue-600 hover:scale-110 transition-transform"
            />
            <span className="mt-1 text-center">{label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function LikertMatrix({ items, labels, columnNumbers = null, innerScroll = false, responses, onChange, highlightKeys = new Set(), itemRefs = {} }) {
  const n = labels.length;
  const colMinPx = n <= 7 ? 48 : 36;
  const colColors = getColColors(n);
  const gridStyle = {
    display: "grid",
    gridTemplateColumns: `minmax(350px, 5fr) repeat(${n}, minmax(${colMinPx}px, 1fr))`,
    columnGap: "6px",
    alignItems: "center",
  };

  return (
    <div className={`w-full overflow-x-hidden ${innerScroll ? "flex flex-col flex-1 min-h-0" : ""}`}>
      {/* Header row */}
      <div className={`bg-white z-30 pt-2 pb-3 border-b border-gray-200 ${innerScroll ? "flex-shrink-0" : "sticky top-[54px]"}`}>
        {/* Label text row — only when columnNumbers (above the colored blocks) */}
        {columnNumbers && (
          <div style={gridStyle} className="mb-1">
            <div />
            {labels.map((h, i) => (
              <div
                key={i}
                className="flex items-end justify-center text-center text-[12px] text-gray-600 font-semibold min-h-[28px] leading-tight px-1"
              >
                {h}
              </div>
            ))}
          </div>
        )}

        {/* Colored blocks row */}
        <div style={gridStyle}>
          <div />
          {labels.map((h, i) => (
            <div
              key={i}
              style={{ backgroundColor: colColors[i].bg }}
              className="flex items-center justify-center text-center font-medium text-gray-700 h-[40px] rounded-lg leading-tight px-1"
            >
              {columnNumbers ? (
                <span className="text-[13px]">{columnNumbers[i]}</span>
              ) : (
                h && <span className="text-[14px]">{h}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Items */}
      <div className={`divide-y divide-gray-200 ${innerScroll ? "overflow-y-auto flex-1 min-h-0 pb-6" : columnNumbers ? "pt-20" : "pt-14"}`}>
        {items.map((q, idx) => {
          const key = typeof q === "string" ? q : q.key;
          const value = responses[key];
          const highlighted = highlightKeys.has(key);

          return (
            <div
              key={key}
              ref={(el) => (itemRefs[key] = el)}
              className={`py-6 px-2 rounded-xl transition-colors hover:bg-gray-50/60 ${
                highlighted ? "ring-2 ring-inset ring-red-500 animate-flash" : ""
              }`}
            >
              <div style={gridStyle}>
                <div className="pr-6 text-lg text-gray-800 leading-snug">
                  <span className="font-medium">{idx + 1}.</span>{" "}
                  {typeof q === "string" ? q : q.text}
                </div>

                {Array.from({ length: n }).map((_, i) => {
                  const selected = value === i + 1;

                  return (
                    <label
                      key={i}
                      style={{
                        backgroundColor: selected ? colColors[i].bgSelected : colColors[i].bg,
                      }}
                      className={[
                        "flex justify-center items-center",
                        "py-2 rounded-lg cursor-pointer",
                        "transition-colors duration-150",
                        "hover:brightness-[0.98]",
                        "focus-within:ring-2 focus-within:ring-blue-300",
                      ].join(" ")}
                      title={labels[i] || String(i + 1)}
                    >
                      <input
                        type="radio"
                        name={key}
                        checked={selected}
                        onChange={() => onChange(key, i + 1)}
                        className={[
                          "w-5 h-5 accent-blue-600",
                          "transition-transform",
                          selected ? "scale-110" : "",
                        ].join(" ")}
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


const COMMON_7_HEADERS = [
  "Extremely",
  "Moderately",
  "Slightly",
  "Neutral",
  "Slightly",
  "Moderately",
  "Extremely",
];

const COL_BG = [
  "rgba(239, 68, 68, 0.18)",  // 1 red 
  "rgba(239, 68, 68, 0.12)",  // 2
  "rgba(239, 68, 68, 0.07)",  // 3 red
  "rgba(107, 114, 128, 0.06)",// 4 gray
  "rgba(59, 130, 246, 0.07)", // 5 blue 
  "rgba(59, 130, 246, 0.12)", // 6
  "rgba(59, 130, 246, 0.18)", // 7 blue 
];

const COL_BG_SELECTED = [
  "rgba(239, 68, 68, 0.30)",
  "rgba(239, 68, 68, 0.24)",
  "rgba(239, 68, 68, 0.18)",
  "rgba(107, 114, 128, 0.18)",
  "rgba(59, 130, 246, 0.18)",
  "rgba(59, 130, 246, 0.24)",
  "rgba(59, 130, 246, 0.30)",
];

function BipolarMatrix({ items, responses, onChange, highlightKeys = new Set(), itemRefs = {} }) {
  const gridStyle = {
    display: "grid",
    gridTemplateColumns: "minmax(180px, 3fr) repeat(7, minmax(58px, 1fr))",
    columnGap: "6px",
    alignItems: "center",
  };

  return (
    <div className="w-full overflow-x-hidden">
      <div className="divide-y divide-gray-200">
      {/* ===== questions rows ===== */}
      {items.map((item, idx) => {
        const value = responses[item.key];
        const highlighted = highlightKeys.has(item.key);

        return (
          <div
            key={item.key}
            ref={(el) => (itemRefs[item.key] = el)}
            className={`py-6 px-2 rounded-xl transition-colors hover:bg-gray-50/60 ${
              highlighted ? "ring-2 ring-inset ring-red-500 animate-flash" : ""
            }`}
          >
            {/* Row A */}
            <div style={gridStyle}>
              <div className="pr-6 text-lg text-gray-800 leading-snug">
                <span className="font-medium">{idx + 1}.</span>{" "}
                {item.text}
              </div>

              {Array.from({ length: 7 }).map((_, i) => {
                const selected = value === i + 1;

                return (
                  <label
                    key={i}
                    style={{ backgroundColor: selected ? COL_BG_SELECTED[i] : COL_BG[i] }}
                    className={[
                      "flex justify-center items-center",
                      "py-2 rounded-lg cursor-pointer",
                      "transition-colors duration-150",
                      "hover:brightness-[0.98]",   // hover 시 아주 살짝만 강조
                      "focus-within:ring-2 focus-within:ring-blue-300",
                    ].join(" ")}
                    title={`Select ${COMMON_7_HEADERS[i]}`}
                  >
                    <input
                      type="radio"
                      name={item.key}
                      checked={selected}
                      onChange={() => onChange(item.key, i + 1)}
                      className={[
                        "w-5 h-5 accent-blue-600",
                        "transition-transform",
                        selected ? "scale-110" : "",
                      ].join(" ")}
                    />
                  </label>
                );
              })}
            </div>

            {/* Row B */}
            <div style={gridStyle} className="mt-2">
              <div /> 
              <div className="text-center text-[15px] text-gray-600">
                {item.left}
              </div>
              <div />
              <div />
              <div />
              <div />
              <div />
              <div className="text-center text-[15px] text-gray-600">
                {item.right}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  </div>
  );
}

export default function PostSurveyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <PostSurvey />
    </Suspense>
  );
}

function PostSurvey() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const questionRefs = useRef({});
  const scrollContainerRef = useRef(null);
  const pageRef = useRef(1);

  const [participantId, setParticipantId] = useState(null);
  const [systemType, setSystemType] = useState(null);
  const [taskType, setTaskType] = useState("");
  const [scraps, setScraps] = useState([]);

  // section-based states
  const [serendipityResponses, setSerendipityResponses] = useState({});
  const [emotionResponses, setEmotionResponses] = useState({});
  const [emotion2Responses, setEmotion2Responses] = useState({});
  const [selfEfficacyResponses, setSelfEfficacyResponses] = useState({});
  const [openEndedResponses, setOpenEndedResponses] = useState({});
  const [shuffledQuestionsByPage, setShuffledQuestionsByPage] = useState({});


  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const [showWarningModal, setShowWarningModal] = useState(false);
  const [highlightQuestions, setHighlightQuestions] = useState(new Set());

  // Keep pageRef in sync so popstate handler always reads current page
  useEffect(() => { pageRef.current = page; }, [page]);

  /* -------------------------------
     Back button → previous survey page
  -------------------------------- */
  useEffect(() => {
    history.pushState(null, "", location.href);

    const handlePopState = () => {
      setTimeout(() => {
        history.pushState(null, "", location.href);
        const cur = pageRef.current;
        if (cur > 1) {
          const prevPage = cur - 1;
          setPage(prevPage);
          localStorage.setItem("postsurvey_page", prevPage);
          scrollContainerRef.current?.scrollTo(0, 0);
        }
      }, 0);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  /* -------------------------------
     useEffect
  -------------------------------- */
  {/* Participants' information load */}
  useEffect(() => {
    const id = localStorage.getItem("participant_id");
    if (!id) {
      router.push("/check");
      return;
    }
    setParticipantId(id);
    
    const system = localStorage.getItem("system_type");
    if (!system) {
      router.push("/task");
      return;
    }
    setSystemType(system); 

    const topicParam = searchParams.get("topic");
    if (topicParam) localStorage.setItem("task_type", topicParam);
    setTaskType(topicParam || localStorage.getItem("task_type") || "the topic");

    const savedPage = localStorage.getItem("postsurvey_page");
    if (savedPage) setPage(parseInt(savedPage, 10));
  }, [router, searchParams]);

  useEffect(() => {
    const shuffled = {};
    pages.forEach((p, index) => {
      if (p.section === "openEnded") {
        shuffled[index] = p.questions;
      } else if (p.section === "emotion1") {
        shuffled[index] = shuffleArray(evaluationQuestions.slice(0, 5));
      } else if (p.section === "emotion2") {
        shuffled[index] = shuffleArray(evaluationQuestions.slice(5, 10));
      } else {
        shuffled[index] = shuffleArray(p.questions);
      }
    });

    setShuffledQuestionsByPage(shuffled);
  }, [taskType]);

  {/* scrapbook load */}
  useEffect(() => {
    const savedScraps = localStorage.getItem("scrapbook");
    if (savedScraps) {
      try {
        setScraps(JSON.parse(savedScraps));
      } catch {
        setScraps([]);
      }
    }
  }, []);

  /* -------------------------------
     Question Sets
  -------------------------------- */
  const serendipityQuestions = [
    `I obtained unexpected insights about ${taskType}.`,
    `I made connections about ${taskType} that I had not thought of before.`,
    `I had unexpected revelations about ${taskType}.`,
    `I found things about ${taskType} that surprised me.`,
    `I was able to see ordinary knowledge about ${taskType} in new ways.`,
  ];

  const evaluationQuestions = [
    {
      key: "understanding",
      text: "Your understanding of the provided search system",
      left: "low",
      right: "high",
    },
    {
      key: "confidence",
      text: "Your feelings of assurance about the provided search systems",
      left: "low",
      right: "high",
    },
    {
      key: "feelings",
      text: "Your feelings of participating in search",
      left: "negative",
      right: "positive",
    },
    {
      key: "involvement",
      text: "The degree of your involvement in the search",
      left: "uninvolved",
      right: "involved",
    },
    {
      key: "control",
      text: "Your feeling of the personal power to regulate the provided search system",
      left: "weak",
      right: "strong",
    },
    {
      key: "reliability",
      text: "The consistency of the output information",
      left: "inconsistent",
      right: "consistent",
    },
    {
      key: "relevancy",
      text: " The degree of match between what the you wants and what is provided by the system",
      left: "irrelevant",
      right: "relevant",
    },
    {
      key: "accuracy",
      text: "The correctness of the output information",
      left: "low",
      right: "high",
    },
    {
      key: "precision",
      text: "The variability of the output information from what it is intended to retrieve",
      left: "low",
      right: "high",
    },
    {
      key: "completeness",
      text: "The comprehensiveness of the output information content",
      left: "inadequate",
      right: "adequate",
    },
  ];

  const selfEfficacyQuestions = [
    "I think I'm able to develop search queries that accurately reflect what I'm looking for.",
    "I think I'm able to distinguish between results that are relevant to my needs and those that are not.",
    "I think I'm able to find an adequate amount of information.",
    "I think I'm able to navigate through information spaces to find what I need.",
    "I think I'm able to quickly decide which results to skip and which to pursue.",
    "I think I'm able to compare multiple results and draw an integrated conclusion.",
    "I think I'm able to form and revise my understanding as I discover new information.",
  ]

  const sevenPointLabels = [
    "Strongly Disagree",
    "Disagree",
    "Slightly Disagree",
    "Neutral",
    "Slightly Agree",
    "Agree",
    "Strongly Agree",
  ];

  const BanduraLabels = [
    "Cannot do at all",
    "Cannot do",
    "Moderately cannot do",
    "Uncertain",
    "Moderately can do",
    "Can do",
    "Hihgly certain can do",
  ];

  // 0–10 scale: labels only at anchors (0, 5, 10)
  const BanduraLabels2 = [
    "Cannot do at all", // 0
    "", // 1
    "", // 2
    "", // 3
    "", // 4
    "Moderately can do", // 5
    "", // 6
    "", // 7
    "", // 8
    "", // 9
    "Highly certain can do", // 10
  ];

  const pages = [
    { title: "", questions: serendipityQuestions, section: "serendipity" },
    { title: "", questions: [], section: "emotion2" },
    { title: "", questions: [], section: "emotion1" },
    { title: "", questions: selfEfficacyQuestions, section: "selfEfficacy" },
    { title: "", questions: [], section: "openEnded" },
  ];

  const sectionSetters = {
    serendipity: setSerendipityResponses,
    emotion1: setEmotionResponses,
    emotion2: setEmotion2Responses,
    selfEfficacy: setSelfEfficacyResponses,
    openEnded: setOpenEndedResponses,
  };

  const sectionResponses = {
    serendipity: serendipityResponses,
    emotion1: emotionResponses,
    emotion2: emotion2Responses,
    selfEfficacy: selfEfficacyResponses,
    openEnded: openEndedResponses,
  };

  const handleChange = (section, question, value) => {
    sectionSetters[section]((prev) => ({
      ...prev,
      [question]: value,
    }));
  };

  const handleFinalSubmit = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/airtable/post-survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participant_id: participantId,
          condition: systemType, // WebSearch | GenSearch | RAGSearch
          task_id: taskType,
          serendipity_responses: serendipityResponses,
          emotion_responses: { ...emotionResponses, ...emotion2Responses },
          post_self_efficacy_responses: selfEfficacyResponses,
          open_ended: openEndedResponses,
        }),
      });

    if (!res.ok) {
      const errText = await res.text();
      let err;
      try {
        err = JSON.parse(errText);
      } catch {
        err = { raw: errText };
      }
      alert("SAVE FAILED:\n\n" + JSON.stringify(err, null, 2));
      return;
    }

    localStorage.removeItem("postsurvey_page");
    router.push("/demographic");
  } catch (e) {
    alert("SAVE FAILED (network/runtime):\n\n" + (e?.message || String(e)));
  } finally {
    setLoading(false);
  }
};

  const handleNext = () => {
    const { section } = pages[page - 1];
    const questions = 
      shuffledQuestionsByPage[page - 1] || pages[page - 1].questions || [];
    const currentResponses = sectionResponses[section];

    const unanswered = questions.filter((q) => {
      const k = typeof q === "string" ? q : q.key;
      return currentResponses[k] === undefined;
    });

    if (unanswered.length > 0) {
      setShowWarningModal(true);
      return;
    }

    if (page < pages.length) {
      const nextPage = page + 1;
      setPage(nextPage);
      localStorage.setItem("postsurvey_page", nextPage);
      scrollContainerRef.current?.scrollTo(0, 0);
    } else {
      handleFinalSubmit();
    }
  };

  /* -------------------------------
     Render
  -------------------------------- */
  let qIndex = 1;
  const { section } = pages[page - 1];
  const questions = shuffledQuestionsByPage[page - 1] || pages[page - 1].questions;

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Progress */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-white border-b">
        <ProgressBar progress={50 + page * 8} />
      </div>

      {/* Main layout */}
      <div className="flex min-h-[calc(100vh-56px)] overflow-x-hidden">
        {/* Survey */}
        <div ref={scrollContainerRef} className={`flex-1 min-w-0 ${section === "selfEfficacy" ? "overflow-y-hidden flex flex-col h-[calc(100vh-56px)]" : "overflow-y-auto"}`}>
          <div className={`w-full bg-white px-6 lg:px-10 pt-2 ${section === "selfEfficacy" ? "flex flex-col flex-1 min-h-0" : "pb-10"}`}>
            <h2 className="text-xl font-semibold mb-10 text-center">
              {pages[page - 1].title}
            </h2>

            {page === 1 && (
              <p className="text-lg text-gray-700 mb-0 leading-relaxed">
                Now we will ask you what you experienced in the previous search session.<br />
                Please read the following items and evaluate your overall search experience during the session.
              </p>
            )}

            {(page === 2 || page === 3) && (
              <p className="text-lg text-gray-700 mb-8 leading-relaxed">
                On the scales below, we will ask your feelings about the output information you just read and your overall search experience.<br />
                Please read the following items and evaluate your feelings according to each specific adjective.
              </p>
            )}

            {page === 4 && (
              <p className="text-lg text-gray-700 mb-0 leading-relaxed flex-shrink-0">
                On this page, we will ask about your belief in your ability to search based on your experience today.<br />
                Please rate how certain you are that you can search information at each of the aspects described below.<br />
                Here, the information refers to information in general in your life and is not limited to {taskType}.
              </p>
            )}

            {questions.length > 0 && (
              section === "emotion1" || section === "emotion2" ? (
                <BipolarMatrix
                  items={questions}
                  responses={sectionResponses[section]}
                  onChange={(key, v) => handleChange(section, key, v)}
                  highlightKeys={highlightQuestions}
                  itemRefs={questionRefs.current}
                />
              ) : section === "serendipity" ? (
                <LikertMatrix
                  items={questions}
                  labels={sevenPointLabels}
                  responses={sectionResponses[section]}
                  onChange={(key, v) => handleChange(section, key, v)}
                  highlightKeys={highlightQuestions}
                  itemRefs={questionRefs.current}
                />
              ) : section === "selfEfficacy" ? (
                <LikertMatrix
                  items={questions}
                  labels={BanduraLabels2}
                  columnNumbers={[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]}
                  innerScroll
                  responses={sectionResponses[section]}
                  onChange={(key, v) => handleChange(section, key, v)}
                  highlightKeys={highlightQuestions}
                  itemRefs={questionRefs.current}
                />
              ) : (
                <div className="space-y-8">
                  {questions.map((q) => (
                    <LikertRow
                      key={q}
                      index={qIndex++}
                      question={q}
                      labels={sevenPointLabels}
                      value={sectionResponses[section][q]}
                      onChange={(v) => handleChange(section, q, v)}
                      highlightRef={(el) => (questionRefs.current[q] = el)}
                      highlight={highlightQuestions.has(q)}
                    />
                  ))}
                </div>
              )
            )}

            {page === 5 && (
              <>
                <p className="text-[18px] text-gray-700 mb-8 leading-relaxed">
                  Now, you are almost done!👏🏻 <br />
                  The following two questions are very important parts of our studies. There is no right or wrong answer, so please feel free to share your thoughts openly. <br/>
                  You may want to refer to the scrapbook content shown on the right.
                </p>
              </>
            )}

            {page === pages.length && (
              <div className="space-y-10 mt-2">
                {/* OEQ1 */}
                <div className="space-y-3">
                  <p className="font-medium text-[18px]">
                    1. Based on the information you found during your search, what advice would you give your friend about {" "}
                    {taskType}?
                  </p>
                  <textarea
                    className="w-full border rounded-md p-4 min-h-[200px]"
                    placeholder="There are no right or wrong answers. Please provide anything."
                    value={openEndedResponses["OEQ1"] || ""}
                    onChange={(e) =>
                      handleChange("openEnded", "OEQ1", e.target.value)
                    }
                  />
                </div>

                {/* OEQ2 */}
                <div className="space-y-3">
                  <p className="font-medium text-[18px]">
                    2. Did you encounter any interesting or valuable information that led to new insights or unexpected connections? If so, please describe it.
                  </p>
                  <textarea
                    className="w-full border rounded-md p-4 min-h-[200px]"
                    placeholder="There are no right or wrong answers. Please provide anything."
                    value={openEndedResponses["OEQ2"] || ""}
                    onChange={(e) =>
                      handleChange("openEnded", "OEQ2", e.target.value)
                    }
                  />
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Scrapbook */}
        <div className="w-[22%] min-w-[200px] max-w-[320px] bg-gray-50 border-l flex flex-col flex-shrink-0 min-h-screen">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Your Scrapbook</h2>
            <p className="text-xs text-gray-500">
              Saved during the search session (read-only)
            </p>
          </div>

          <div className="p-4 space-y-3 flex-1 overflow-y-auto">
            {scraps.length === 0 && (
              <p className="text-sm text-gray-400">
                No items were saved during the search.
              </p>
            )}

            {scraps.map((item, i) => (
              <div
                key={i}
                className="bg-white border rounded-lg p-3 text-sm space-y-2"
              >
                {item.type === "scrap" && (
                  <div className="prose prose-sm max-w-none">{item.snippet}</div>
                )}

                {item.type === "web" && (
                  <>
                    <div className="font-medium">{item.title}</div>
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 break-all"
                    >
                      {item.link}
                    </a>
                  </>
                )}

                {item.comment && (
                  <div className="pt-2 mt-2 border-t text-xs text-gray-600">
                    <strong>Note:</strong> {item.comment}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="sticky bottom-0 p-4 bg-gray-50 border-t">
            <button
              onClick={handleNext}
              disabled={loading}
              className={`w-full py-2.5 rounded-md font-semibold transition ${
                loading
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {loading ? "Submitting..." : page < pages.length ? "Next →" : "Submit"}
            </button>
          </div>
        </div>
      </div>

      {/* ✅ Warning Modal*/}
      {showWarningModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full text-center space-y-2">
            <p>
              There is an unanswered question on this page.
              <br />
              Would you like to continue?
            </p>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowWarningModal(false);
                  page < pages.length ? setPage(page + 1) : handleFinalSubmit();
                }}
                className="flex-1 border rounded-lg py-2"
              >
                Continue Without Answering
              </button>

              <button
                onClick={() => {
                  const unansweredKeys = questions
                    .filter((q) => {
                      const k = typeof q === "string" ? q : q.key;
                      return sectionResponses[section][k] === undefined;
                    })
                    .map((q) => (typeof q === "string" ? q : q.key));

                  setHighlightQuestions(new Set(unansweredKeys));
                  setTimeout(() => setHighlightQuestions(new Set()), 3000);

                  const firstKey = unansweredKeys[0];
                  if (firstKey && questionRefs.current[firstKey]) {
                    questionRefs.current[firstKey].scrollIntoView({
                      behavior: "smooth",
                      block: "center",
                    });
                  }
                  setShowWarningModal(false);
                }}
                className="flex-1 bg-blue-600 text-white rounded-lg py-2"
              >
                Answer the Question
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
