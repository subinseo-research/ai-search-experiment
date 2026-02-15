"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProgressBar from "../../components/ProgressBar";
import { v4 as uuidv4 } from "uuid";

export default function CheckPage() {
  const router = useRouter();
  const [prolificId, setProlificId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    // ✅ participant_id는 무조건 생성/유지 (겹치든 말든 로컬 기준으로만)
    let participantId = localStorage.getItem("participant_id");
    if (!participantId) {
      participantId = uuidv4();
      localStorage.setItem("participant_id", participantId);
    }

    // ✅ 재접속하면 Prolific ID는 무조건 다시 입력받기
    localStorage.removeItem("prolific_id");

    // ✅ (중요) 예전 중복차단 흔적 제거
    localStorage.removeItem("hasParticipated");
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();

    const pid = prolificId.trim();
    if (!pid) {
      setError("Please enter your Prolific ID.");
      return;
    }

    localStorage.setItem("prolific_id", pid);
    router.push("/consent");
  };

  return (
    <main className="relative flex flex-col items-center justify-center min-h-screen bg-gray-50 text-gray-800">
      <div className="absolute top-0 left-0 w-full">
        <ProgressBar progress={0} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-xl shadow-sm w-[420px] space-y-4"
      >
        <h1 className="text-xl font-semibold text-center">
          Enter Your Prolific ID
        </h1>

        <input
          type="text"
          value={prolificId}
          onChange={(e) => {
            setProlificId(e.target.value);
            if (error) setError("");
          }}
          placeholder="Prolific ID"
          className="w-full border rounded-md px-3 py-2 text-sm"
          autoComplete="off"
          spellCheck={false}
        />

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          className="w-full bg-black text-white py-2 rounded-md text-sm"
        >
          Continue
        </button>

        <p className="text-xs text-gray-500 text-center">
          You will be asked for your Prolific ID each time you start the study.
        </p>
      </form>
    </main>
  );
}
