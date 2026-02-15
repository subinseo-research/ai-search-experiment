"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProgressBar from "../../components/ProgressBar";

export default function CheckPage() {
  const router = useRouter();

  // 1) participant_id 존재 여부 "체크만" (기능적 영향 없음)
  const [hasParticipantId, setHasParticipantId] = useState(false);

  // 2) Prolific ID 입력/수집
  const [prolificId, setProlificId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const existing = localStorage.getItem("participant_id");
    setHasParticipantId(Boolean(existing));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();

    const pid = prolificId.trim();
    if (!pid) {
      setError("Please enter your Prolific ID.");
      return;
    }

    // ✅ (2) 1번과 상관없이 "무조건" 수집/저장 (덮어쓰기)
    localStorage.setItem("participant_id", pid);

    // 다음 페이지로 이동
    router.push("/consent");
  };

  return (
    <main className="relative flex flex-col items-center justify-center min-h-screen bg-gray-50 text-gray-800">
      <div className="absolute top-0 left-0 w-full">
        <ProgressBar progress={0} />
      </div>

      <div className="bg-white p-8 rounded-xl shadow-md w-[400px]">
        <h1 className="text-xl font-semibold mb-4 text-center">
          Enter Your Prolific ID
        </h1>

        {/* (1) participant_id check 결과: "표시만" (원치 않으면 이 블록 삭제) */}
        <p className="text-xs text-gray-500 text-center mb-4">
          Existing participant_id in this browser:{" "}
          <span className="font-medium">
            {hasParticipantId ? "Found" : "Not found"}
          </span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={prolificId}
            onChange={(e) => {
              setProlificId(e.target.value);
              if (error) setError("");
            }}
            placeholder="Prolific ID"
            className="w-full border rounded-lg px-4 py-2"
          />

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            className="w-full bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition"
          >
            Continue
          </button>
        </form>
      </div>
    </main>
  );
}
