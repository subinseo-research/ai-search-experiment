"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProgressBar from "../../components/ProgressBar";

export default function TaskPage() {
  const router = useRouter();
  const [assignedScenario, setAssignedScenario] = useState(null);
  const [participantId, setParticipantId] = useState(null);
  const [loading, setLoading] = useState(true);

  /* =========================
     Factorial design settings
     ========================= */
  const TASKS = ["Nanotechnology", "GMO", "Cultivated Meat"];
  const SYSTEMS = ["WebSearch", "RAGSearch", "GenSearch"];
  const MAX_PER_SYSTEM = 25; // 총 75명 = 시스템 3개 × 25명

  /* =========================
     Highlight helper
     (Search Task ONLY)
     ========================= */
  const highlightKeywords = (text, condition) => {
    const keywordMap = {
      Nanotechnology: ["nanotechnology", "nanoparticles"],
      GMO: ["genetically modified organisms", "GMOs", "GMO"],
      "Cultivated Meat": ["cultivated meat"],
    };

    const keywords = keywordMap[condition] || [];
    let highlightedText = text;

    keywords.forEach((keyword) => {
      const regex = new RegExp(`(${keyword})`, "gi");
      highlightedText = highlightedText.replace(
        regex,
        `<span class="bg-yellow-200 font-semibold px-1 rounded">$1</span>`
      );
    });

    return highlightedText;
  };

  /* =========================
     Cell assignment (server-based)
     Counts come from Airtable Demographic records —
     only participants who completed demographic are counted.
     ========================= */
  function pickBalancedCell(cellCounts, sysCounts) {
    // 시스템별 25명 미만인 시스템의 cell만 후보에 포함
    const available = [];
    for (const system of SYSTEMS) {
      if ((sysCounts[system] || 0) >= MAX_PER_SYSTEM) continue;
      for (const task of TASKS) {
        const key = `${task}__${system}`;
        const n = cellCounts[key] || 0;
        available.push({ task, system, n });
      }
    }

    if (available.length === 0) {
      // 모든 시스템 25명 도달 (75명 완료) → overflow
      const pool = TASKS.flatMap((t) => SYSTEMS.map((s) => ({ task: t, system: s })));
      const picked = pool[Math.floor(Math.random() * pool.length)];
      return { ...picked, overflow: true };
    }

    const minCount = Math.min(...available.map((x) => x.n));
    const minPool = available.filter((x) => x.n === minCount);
    const picked = minPool[Math.floor(Math.random() * minPool.length)];
    return { task: picked.task, system: picked.system, overflow: false };
  }

  /* =========================
     1. Load participant_id
     ========================= */
  useEffect(() => {
    const id = localStorage.getItem("participant_id");
    if (!id) {
      window.location.href = "/check";
    } else {
      setParticipantId(id);
    }
  }, []);

  /* =========================
     2. Assign task × system (ONCE)
     ========================= */
  useEffect(() => {
    if (!participantId) return;

    const scenarios = [
      {
        condition: "Nanotechnology",
        searchCase:
          "Your friend visited a grocery store. While your friend was standing in front of the fresh corner, your friend overheard some people passing by saying that these days, the nanoparticles used in packaging materials can also mix into the food. You want to check what scientific evidence actually says.",
        searchTask:
          "Perform a search to explore evidence about nanotechnology.",
      },
      {
        condition: "GMO",
        searchCase:
          "Your friend visited a grocery store. While your friend was standing in front of the cereal and snack section, your friend overheard some people talking about how some genetically modified organisms (GMOs) food may disrupt hormones or cause long-term health effects. You want to check what scientific evidence actually says.",
        searchTask:
          "Perform a search to explore evidence about GMO foods.",
      },
      {
        condition: "Cultivated Meat",
        searchCase:
          "Your friend visited a grocery store. While your friend was standing in front of the meat section, trying to decide which meat to buy, your friend overheard some people passing by saying that these days, some meat is cultivated meat but is often not labeled properly. You want to check what scientific evidence actually says.",
        searchTask:
          "Perform a search to explore evidence about cultivated meat.",
      },
    ];

    /* ===== Restore existing assignment ===== */
    const savedTask = localStorage.getItem("task_type");
    const savedSystem = localStorage.getItem("system_type");

    const isValidTask = TASKS.includes(savedTask);
    const isValidSystem = SYSTEMS.includes(savedSystem);

    if (isValidTask && isValidSystem) {
      const existingScenario = scenarios.find((s) => s.condition === savedTask);
      if (existingScenario) {
        localStorage.setItem("search_case", existingScenario.searchCase);
        localStorage.setItem("search_task", existingScenario.searchTask);
        setAssignedScenario(existingScenario);
        setLoading(false);

        // Ensure pending record exists in Airtable (may be missing if participant revisits)
        if (!localStorage.getItem("assignment_record_id")) {
          fetch("/api/assignment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              participant_id: participantId,
              task_type: savedTask,
              system_type: savedSystem,
            }),
          })
            .then((r) => r.json())
            .then(({ recordId }) => {
              if (recordId) localStorage.setItem("assignment_record_id", recordId);
            })
            .catch((e) => console.error("assignment reserve error:", e));
        }

        return;
      }
    }

    /* ===== Balanced factorial assignment (server-based counts) ===== */
    const applyAssignment = (task, system, overflow, recordId, scenario) => {
      if (recordId) localStorage.setItem("assignment_record_id", recordId);
      localStorage.setItem("task_type", task);
      localStorage.setItem("system_type", system);
      localStorage.setItem("search_case", scenario.searchCase);
      localStorage.setItem("search_task", scenario.searchTask);
      localStorage.setItem("is_overflow", overflow ? "1" : "0");
      setAssignedScenario(scenario);
      setLoading(false);
    };

    fetch("/api/assignment-counts")
      .then((res) => res.json())
      .then(({ cellCounts, sysCounts }) => {
        const picked = pickBalancedCell(cellCounts || {}, sysCounts || {});

        // Reserve slot in Airtable (idempotent: returns existing if already reserved)
        return fetch("/api/assignment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            participant_id: participantId,
            task_type: picked.task,
            system_type: picked.system,
          }),
        })
          .then((r) => r.json())
          .then(({ recordId, task_type, system_type, existing }) => {
            // If Airtable already had a record for this participant, honour it
            const finalTask = existing ? task_type : picked.task;
            const finalSystem = existing ? system_type : picked.system;
            const scenario = scenarios.find((s) => s.condition === finalTask);
            applyAssignment(finalTask, finalSystem, picked.overflow, recordId, scenario);
          });
      })
      .catch((err) => {
        console.error("assignment error:", err);
        // 서버 조회 실패 시 완전 랜덤 배정으로 fallback
        const task = TASKS[Math.floor(Math.random() * TASKS.length)];
        const system = SYSTEMS[Math.floor(Math.random() * SYSTEMS.length)];
        const scenario = scenarios.find((s) => s.condition === task);
        applyAssignment(task, system, true, null, scenario);
      });
  }, [participantId]);

  const handleContinue = () => {
    router.push("/presurvey");
  };

  if (loading || !assignedScenario) {
    return (
      <main className="flex items-center justify-center min-h-screen text-gray-700">
        <p>Loading your assigned task...</p>
      </main>
    );
  }

  return (
    <main className="min-h-[100svh] flex flex-col bg-white text-gray-900">
      {/* Progress bar */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <ProgressBar progress={5} />
      </div>

      {/* Main content */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="max-w-2xl text-center">
          <h1 className="text-3xl font-bold mb-8">📋 Your Search Task</h1>

          <p className="text-gray-600 text-base mb-10">
            Please read the task carefully. 
            <br />
            You will first answer a few questions, followed by the main search task.
          </p>

          {/* Search Case */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl shadow-sm p-8 mb-6 text-left">
            <h2 className="font-semibold mb-2">Search Case</h2>
            <p className="text-gray-800 leading-relaxed">
              {assignedScenario.searchCase}
            </p>
          </div>

          {/* Search Task */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl shadow-sm p-8 mb-10 text-left">
            <h2 className="font-semibold mb-2">Search Task</h2>
            <p
              className="text-gray-800 leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: highlightKeywords(
                  assignedScenario.searchTask,
                  assignedScenario.condition
                ),
              }}
            />
          </div>

          <p className="text-gray-600 text-base mb-10">
            You will be able to review your search task at any time.
          </p>

          <button
            onClick={handleContinue}
            className="px-8 py-3 bg-blue-600 text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 transition"
          >
            Continue to Next
          </button>
        </div>
      </div>
    </main>
  );
}
