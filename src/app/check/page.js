"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProgressBar from "../../components/ProgressBar";

export default function CheckPage() {
  const router = useRouter();

  const [prolificId, setProlificId] = useState("");
  const [error, setError] = useState("");

  // (선택) 이미 prolific_id & participant_id가 있으면 바로 consent로 보내고 싶으면 활성화
  useEffect(() => {
    const existingPid = localStorage.getItem("participant_id");
    const existingProlific = localStorage.getItem("prolific_id");
    if (existingPid && existingProlific) {
      router.replace("/consent");
    }
  }, [router]);

  const generateUUID = () => {
    // modern browsers 지원 (https)
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // fallback (드물게 필요)
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const pid = prolificId.trim();
    if (!pid) {
      setError("Please enter your Prolific ID.");
      return;
    }

    setError("");

    // 1) prolific id 저장 (무조건 수집)
    localStorage.setItem("prolific_id", pid);

    // 2) participant_id 생성/저장 (이미 있으면 재사용해도 됨)
    let participantId = localStorage.getItem("participant_id");
    if (!participantId) {
      participantId = generateUUID();
      localStorage.setItem("participant_id", participantId);
    }

    // 3) consent로 이동
    router.push("/consent");
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-40 bg-white border-b">
        <ProgressBar progress={5} />
      </div>

      <div className="max-w-[720px] mx-auto bg-white px-8 py-12 mt-8 rounded-xl shadow-sm border">
        <h1 className="text-3xl font-semibold text-center mb-3">Welcome</h1>
        <p className="text-gray-600 text-center mb-10">
          Please enter your Prolific ID to begin the study.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block font-medium">Prolific ID</label>
            <input
              value={prolificId}
              onChange={(e) => setProlificId(e.target.value)}
              className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="e.g., 5f2c1a3b9d..."
              autoComplete="off"
            />
            {error && <p className="text-red-600 text-sm">{error}</p>}
          </div>

          <button
            type="submit"
            className="w-full bg-black text-white rounded-lg py-3 font-medium hover:opacity-90"
          >
            Continue
          </button>
        </form>
      </div>
    </main>
  );
}
