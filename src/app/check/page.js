"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProgressBar from "../../components/ProgressBar";
import { v4 as uuidv4 } from "uuid";

export default function CheckPage() {
  const router = useRouter();
  const [prolificId, setProlificId] = useState("");
  const [error, setError] = useState("");

  // participant_id 생성/유지
  useEffect(() => {
    let participantId = localStorage.getItem("participant_id");
    if (!participantId) {
      participantId = uuidv4();
      localStorage.setItem("participant_id", participantId);
    }

    // ✅ 매번 다시 prolific id 받기 원하면 유지
    localStorage.removeItem("prolific_id");
  }, []);

  const handleContinue = () => {
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

      <div className="bg-white p-8 rounded-xl shadow-sm w-[500px] space-y-6">
        <h1 className="text-xl font-semibold text-center">Before You Begin</h1>

        {/* ✅ Prolific ID 수집 */}
        <div className="space-y-2">
          <p className="font-medium">Please enter your Prolific ID.</p>

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
        </div>

        <button
          onClick={handleContinue}
          className="w-full bg-black text-white py-2 rounded-md text-sm"
        >
          Continue
        </button>

        <p className="text-xs text-gray-500 text-center">
          You will be asked for your Prolific ID each time you start the study.
        </p>
      </div>
    </main>
  );
}
