"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ProgressBar from "../../components/ProgressBar";

const STORAGE_KEY = "presurvey_responses";
const GUIDE_SEEN_KEY = "presurvey_guide_seen";

export default function PreSurvey() {
  const router = useRouter();

  const [showWarningModal, setShowWarningModal] = useState(false);
  const [highlightQuestion, setHighlightQuestion] = useState(null);

  const [participantId, setParticipantId] = useState(null);
  const [taskType, setTaskType] = useState("");
  const [searchCase, setSearchCase] = useState("");
  const [searchTask, setSearchTask] = useState("");

  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(false);

  /* -------------------------------
     UI state
  -------------------------------- */
  const [panelOpen, setPanelOpen] = useState(true);
  const [showGuide, setShowGuide] = useState(true);

  /* -------------------------------
     Refs
  -------------------------------- */
  const taskPanelAnchorRef = useRef(null);
  const guideCardRef = useRef(null);
  const questionRefs = useRef({});

  /* -------------------------------
     Load participant + task
  -------------------------------- */
  useEffect(() => {
    const id = localStorage.getItem("participant_id");
    if (!id) {
      router.push("/check");
      return;
    }
    setParticipantId(id);

    const type = localStorage.getItem("task_type");
    const scase = localStorage.getItem("search_case");
    const stask = localStorage.getItem("search_task");

    if (!type || !scase || !stask) {
      router.push("/task");
      return;
    }

    setTaskType(type);
    setSearchCase(scase);
    setSearchTask(stask);

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setResponses(JSON.parse(saved));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }

    const guideSeen = localStorage.getItem(GUIDE_SEEN_KEY);
    if (guideSeen === "true") {
      setShowGuide(false);
    }
  }, [router]);

  /* -------------------------------
     Questions
  -------------------------------- */
  const topic = taskType; 
  const Pretask_Questionnaires = useMemo(
    () => [
      "How familiar are you with the {topic}?",
      "To what extent do keywords and concepts related to {topic} come to mind for your search?",
      "How clear is your plan for finding interesting and valuable information related to {topic}?",
    ],
    []
  );

  const Labels = ["Not at all", "Slightly", "Somewhat", "Moderately", "Fairly", "Very", "Extremely"];
  
  /* -------------------------------
     Handle response
  -------------------------------- */
  const handleChange = (question, value) => {
    setResponses((prev) => {
      const updated = { ...prev, [question]: value };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  /* -------------------------------
     Submit
  -------------------------------- */
  const handleSubmit = async () => {
    if (loading) return;

    const allQuestions = [...Pretask_Questionnaires];
    const unanswered = allQuestions.filter((q) => responses[q] === undefined);

    if (unanswered.length > 0) {
      setShowWarningModal(true);
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/airtable/pre-survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participant_id: participantId,
          Task_type: taskType,
          presurvey_responses: Object.fromEntries(
            Pretask_Questionnaires.map((q) => [q, responses[q]])
          ),
        }),
      });

      if (!res.ok) throw new Error(await res.text());

      localStorage.removeItem(STORAGE_KEY);
      router.push("/experiment");
    } catch {
      alert("Failed to save pre-survey responses. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* -------------------------------
     Render
  -------------------------------- */
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-40 bg-white border-b">
        <ProgressBar progress={10} />
      </div>

      <div className="flex">
        {/* Left panel */}
        <div
          className={`bg-gray-50 sticky top-[56px]
            h-[calc(100vh-56px)]
            transition-all
            ${panelOpen ? "w-[22%]" : "w-[64px]"}`}
        >
          {/* 👇 border는 여기! + h-full */}
          <div className="h-full border-r p-4">
            <button
              onClick={() => setPanelOpen((v) => !v)}
              className="mb-4 w-10 h-10 rounded border bg-white shadow"
            >
              {panelOpen ? "←" : "→"}
            </button>

            {panelOpen && (
              <div
                ref={taskPanelAnchorRef}
                className="bg-white p-4 rounded border text-lg space-y-3"
              >
                <div>
                  <strong>Search Case</strong>
                  <p className="mt-1 whitespace-pre-wrap">{searchCase}</p>
                </div>
                <div>
                  <strong>Search Task</strong>
                  <p className="mt-1 whitespace-pre-wrap">{searchTask}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>


        {/* Survey */}
        <div className="flex-1 flex justify-center overflow-y-auto">
          <div className="max-w-[900px] w-full px-8 py-12 bg-white">

            <p className="text-lg font-medium mt-10 mb-8">
              On the scales below, indicate how you think about the given topic.
              <br />
              There are no right or wrong answers; we are interested in what you think.  
            </p>

            <div className="space-y-8 mb-16">
              {Pretask_Questionnaires.map((q, idx) => {
                const renderedQuestion = q.replace("{topic}", taskType); 
              return (
                <div
                  key={q}
                  ref={(el) => (questionRefs.current[q] = el)}
                  className={`border-b pb-8 space-y-4 transition-all
                    ${highlightQuestion === q ? "animate-flash border-2 border-red-500 rounded-lg p-4" : ""}`}
                >
                  <p className="font-medium text-[18px]">
                    {idx + 1}. {renderedQuestion}
                  </p>
                  <div className="flex justify-between text-base text-gray-600">
                    {Labels.map((label, i) => (
                      <label key={label} className="flex flex-col items-center w-[100px]">
                        <input
                          type="radio"
                          checked={responses[q] === i + 1}
                          onChange={() => handleChange(q, i + 1)}
                          className="w-7 h-7 accent-blue-600 hover:scale-110 transition-transform cursor-pointer"
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
            </div>

            <div className="mt-16 text-center">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-10 py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg"
              >
                {loading ? "Submitting..." : "Next"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Pop-up Guide */}
      {showGuide && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div ref={guideCardRef} className="bg-white p-8 rounded-lg shadow-xl max-w-[720px]">
            <h2 className="text-2xl font-semibold mb-4">Notification</h2>
           <p className="mb-6 text-base text-gray-700">
              You can review your assigned search task on the left at any time.
            </p>
            <button
              onClick={() => {
                localStorage.setItem(GUIDE_SEEN_KEY, "true");
                setShowGuide(false);
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Incomplete warning modal */}
      {showWarningModal && (
        <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full text-center space-y-6">
            <p className="text-gray-800 text-lg">
              There is an unanswered question on this page.
              <br />
              Would you like to continue?
            </p>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowWarningModal(false);
                  router.push("/experiment");
                }}
                className="flex-1 px-4 py-2 border rounded-lg text-gray-700"
              >
                Continue Without Answering
              </button>

              <button
                onClick={() => {
                  const allQuestions = [...Pretask_Questionnaires];
                  const firstUnanswered = allQuestions.find((q) => responses[q] === undefined);

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
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg"
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
