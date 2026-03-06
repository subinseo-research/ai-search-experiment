"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ProgressBar from "../../components/ProgressBar";

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
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

function LikertMatrix({ items, labels, responses, onChange }) {
  const gridStyle = {
    display: "grid",
    gridTemplateColumns: "minmax(140px, 2fr) repeat(7, minmax(58px, 1fr))",
    columnGap: "6px",
    alignItems: "center",
  };

  return (
    <div className="w-full overflow-x-hidden">
      <div className="space-y-10 pt-2">
        {/* Header row (same 7 labels) */}
        <div
          style={gridStyle}
          className="sticky top-[54px] bg-white z-30 pt-2 pb-3 border-b border-gray-200"
        >
          <div />
          {labels.map((h, i) => (
            <div
              key={i}
              style={{ backgroundColor: COL_BG[i] }}
              className="text-center text-[15px] font-medium text-gray-700 py-2 rounded-lg leading-tight"
            >
              {h}
            </div>
          ))}
        </div>

        {/* Items */}
        {items.map((q, idx) => {
          const key = typeof q === "string" ? q : q.key; // 안전장치
          const value = responses[key];

          return (
            <div
              key={key}
              className="py-5 border-b border-gray-200 rounded-xl px-2 transition-colors hover:bg-gray-50/60"
            >
              <div style={gridStyle} className="mt-2">
                <div className="pr-6 text-lg text-gray-800 leading-snug">
                  <span className="font-medium">{idx + 1}.</span>{" "}
                  {typeof q === "string" ? q : q.text}
                </div>

                {Array.from({ length: 7 }).map((_, i) => {
                  const selected = value === i + 1;

                  return (
                    <label
                      key={i}
                      style={{
                        backgroundColor: selected ? COL_BG_SELECTED[i] : COL_BG[i],
                      }}
                      className={[
                        "flex justify-center items-center",
                        "py-2 rounded-lg cursor-pointer",
                        "transition-colors duration-150",
                        "hover:brightness-[0.98]",
                        "focus-within:ring-2 focus-within:ring-blue-300",
                      ].join(" ")}
                      title={`Select ${labels[i]}`}
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

function BipolarMatrix({ items, responses, onChange }) {
  const gridStyle = {
    display: "grid",
    gridTemplateColumns: "minmax(140px, 2fr) repeat(7, minmax(58px, 1fr))",
    columnGap: "6px",
    alignItems: "center",
  };

  return (
    <div className="w-full overflow-x-hidden">
      <div className="space-y-10 pt-6">
        <div style={gridStyle} className="sticky top-[54px] bg-white z-30 pt-3 pb-3 border-b border-gray-200">
          <div /> {/* questions column */}
            {COMMON_7_HEADERS.map((h, i) => (
              <div
                key={i}
                style={{ backgroundColor: COL_BG[i] }}
                className="text-center text-[15px] font-medium text-gray-700 py-2 rounded-lg leading-tight"
              >
                {h}
              </div>
            ))}
        </div>
      {/* ===== questions rows ===== */}
      {items.map((item, idx) => {
        const value = responses[item.key];

        return (
          <div
            key={item.key}
            className="py-5 border-b border-gray-200 rounded-xl px-2 transition-colors hover:bg-gray-50/60"
          >
            {/* Row A */}
            <div style={gridStyle} className="mt-4">
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

export default function PostSurvey() {
  const router = useRouter();
  const questionRefs = useRef({});

  const [participantId, setParticipantId] = useState(null);
  const [systemType, setSystemType] = useState(null);
  const [taskType, setTaskType] = useState("");
  const [scraps, setScraps] = useState([]);

  // section-based states
  const [serendipityResponses, setSerendipityResponses] = useState({});
  const [emotionResponses, setEmotionResponses] = useState({});
  const [selfEfficacyResponses, setSelfEfficacyResponses] = useState({});
  const [openEndedResponses, setOpenEndedResponses] = useState({});
  const [shuffledQuestionsByPage, setShuffledQuestionsByPage] = useState({});


  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const [showWarningModal, setShowWarningModal] = useState(false);
  const [highlightQuestion, setHighlightQuestion] = useState(null);

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

    setTaskType(localStorage.getItem("task_type") || "the topic");
  }, [router]);

  useEffect(() => {
    const shuffled = {};

    pages.forEach((p, index) => {
      if (p.section === "openEnded") {
        shuffled[index] = p.questions; 
      } else {
        shuffled[index] = shuffleArray(p.questions); 
      }
    });

    setShuffledQuestionsByPage(shuffled);
  }, []);

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
    "I obtained unexpected insights.",
    "I made connections that I had not thought of before.",
    "I had unexpected revelations about old ideas.",
    "I found things that surprised me.",
    "I was able to see ordinary knowledge in new ways.",
  ];

  const evaluationQuestions = [
    {
      key: "overall",
      text: "My overall experience with search",
      left: "bad",
      right: "good",
      neutral: "Neither good nor bad",
    },
    {
      key: "understanding",
      text: "Your understanding of information",
      left: "insufficient",
      right: "sufficient",
      neutral: "Neither sufficient nor insufficient",
    },
    {
      key: "feelings",
      text: "Your feelings of participating in search",
      left: "negative",
      right: "positive",
      neutral: "Neither positive nor negative",
    },
    {
      key: "attitude",
      text: "Attitude of search engines/chat AI",
      left: "belligerent",
      right: "cooperative",
      neutral: "Neither cooperative nor belligerent",
    },
    {
      key: "communication",
      text: "Communication with the search engines/chat AI",
      left: "destructive",
      right: "productive",
      neutral: "Neither productive nor destructive",
    },
    {
      key: "reliability",
      text: "Reliability of output information",
      left: "low",
      right: "high",
      neutral: "Neither high nor low",
    },
    {
      key: "relevancy",
      text: "Relevancy of output information",
      left: "irrelevant",
      right: "relevant",
      neutral: "Neither relevant nor irrelevant",
    },
    {
      key: "accuracy",
      text: "Accuracy of output information",
      left: "inaccurate",
      right: "accurate",
      neutral: "Neither accurate nor inaccurate",
    },
    {
      key: "precision",
      text: "Precision of output information",
      left: "uncertain",
      right: "definite",
      neutral: "Neither definite nor uncertain",
    },
    {
      key: "completeness",
      text: "Completeness of the output information",
      left: "inadequate",
      right: "adequate",
      neutral: "Neither adequate nor inadequate",
    },
  ];

  const selfEfficacyQuestions = [
    "Given enough time and effort, I believe I can find information that interests me.",
    "I can do a good search and feel confident it will lead me to interesting information.",
    "The concept is too complex for me to explore through online search.",
    "I trust my ability to find new and interesting information.",
  ];

  const sevenPointLabels = [
    "Strongly Disagree",
    "Disagree",
    "Slightly Disagree",
    "Neutral",
    "Slightly Agree",
    "Agree",
    "Strongly Agree",
  ];

  const pages = [
    { title: "", questions: serendipityQuestions, section: "serendipity" },
    { title: "", questions: evaluationQuestions, section: "emotion" },
    { title: "", questions: selfEfficacyQuestions, section: "selfEfficacy" },
    { title: "", questions: [], section: "openEnded" },
  ];

  const sectionSetters = {
    serendipity: setSerendipityResponses,
    emotion: setEmotionResponses,
    selfEfficacy: setSelfEfficacyResponses,
    openEnded: setOpenEndedResponses,
  };

  const sectionResponses = {
    serendipity: serendipityResponses,
    emotion: emotionResponses,
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
          emotion_responses: emotionResponses,
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
      setPage(page + 1);
      window.scrollTo(0, 0);
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
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Progress */}
      <div className="sticky top-0 z-40 bg-white border-b">
        <ProgressBar progress={50 + page * 10} />
      </div>

      {/* Main layout */}
      <div className="flex min-h-[calc(100vh-56px)] overflow-x-hidden">
        {/* Survey */}
        <div className="flex-1 overflow-y-auto min-w-0">
          <div className="w-full bg-white px-6 lg:px-10 pt-2 pb-10">
            <h2 className="text-xl font-semibold mb-10 text-center">
              {pages[page - 1].title}
            </h2>

            {page === 1 && (
              <p className="text-base text-gray-700 mb-0 leading-relaxed">
                Now we will ask you what you experienced in the previous search session.<br />
                Please read the following items and evaluate your overall search experience during the session.
              </p>
            )}

            {page === 2 && (
              <p className="text-base text-gray-700 mb-0 leading-relaxed">
                On the scales below, we will ask your feelings about the output information you just read and your overall search experience.<br />
                Red indicates negative emotions, and blue indicates positive emotions.<br />
                The deeper the color becomes, the stronger the intensity of the emotion.<br />
                Please read the following items and evaluate your feelings according to each specific adjective.
              </p>
            )}

            {page === 3 && (
              <p className="text-base text-gray-700 mb-0 leading-relaxed">
                On this page, we will ask about your belief in your ability to successfully complete a search task, even when the task is difficult, based on your search experience today.<br />
                Please read the following sentences and evaluate your level of agreement or disagreement.
              </p>
            )}

            {questions.length > 0 && (
              section === "emotion" ? (
                <BipolarMatrix
                  items={questions}
                  responses={sectionResponses[section]}
                  onChange={(key, v) => handleChange(section, key, v)}
                />
              ) : section === "serendipity" || section === "selfEfficacy" ? (
                <LikertMatrix
                  items={questions}
                  labels={sevenPointLabels}
                  responses={sectionResponses[section]}
                  onChange={(key, v) => handleChange(section, key, v)}
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
                      highlight={highlightQuestion === q}
                    />
                  ))}
                </div>
              )
            )}

            {page === 4 && (
              <>
                <p className="text-base text-gray-700 mb-0 leading-relaxed">
                  Now, you are almost done!👏🏻 <br />
                  The following two questions are very important parts of our studies. There is no right or wrong answer, so please feel free to share your thoughts openly. <br/>
                  You may want to refer to the scrapbook content shown on the right.
                </p>
                <p className="text-[18px] text-gray-900 mt-4 mb-0 leading-relaxed">
                  You conducted a search to broadly explore information on the given topic:
                </p>
              </>
            )}

            {page === pages.length && (
              <div className="space-y-10 mt-2">
                {/* OEQ1 */}
                <div className="space-y-3">
                  <p className="font-medium text-[18px]">
                    1. What keywords can you think of when you think about{" "}
                    <strong>{taskType}</strong>?
                  </p>
                  <textarea
                    className="w-full border rounded-md p-4 min-h-[120px]"
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
                    2. Did you encounter any information that you could relate to your
                    own experiences or to similar situations?
                  </p>
                  <textarea
                    className="w-full border rounded-md p-4 min-h-[140px]"
                    placeholder="There are no right or wrong answers. Please provide anything."
                    value={openEndedResponses["OEQ2"] || ""}
                    onChange={(e) =>
                      handleChange("openEnded", "OEQ2", e.target.value)
                    }
                  />
                </div>
              </div>
            )}

            <div className="mt-16 text-center">
              <button
                onClick={handleNext}
                disabled={loading}
                className="px-10 py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg disabled:opacity-50"
              >
                {loading ? "Submitting..." : page < pages.length ? "Next" : "Submit"}
              </button>
            </div>
          </div>
        </div>

        {/* Scrapbook */}
        <div className="w-[22%] min-w-[200px] max-w-[320px] bg-gray-50 border-l overflow-y-auto flex-shrink-0">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Your Scrapbook</h2>
            <p className="text-xs text-gray-500">
              Saved during the search session (read-only)
            </p>
          </div>

          <div className="p-4 space-y-3">
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
        </div>
      </div>

      {/* ✅ Warning Modal: 최상위 div 내부, main layout 밖 */}
      {showWarningModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full text-center space-y-6">
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
                  const firstUnanswered = questions.find((q) => {
                    const k = typeof q === "string" ? q : q.key;
                    return sectionResponses[section][k] === undefined;
                  });
                  if (firstUnanswered && questionRefs.current[firstUnanswered]) {
                    questionRefs.current[firstUnanswered].scrollIntoView({
                      behavior: "smooth",
                      block: "center",
                    });
                    setHighlightQuestion(firstUnanswered);
                    setTimeout(() => setHighlightQuestion(null), 2000);
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
