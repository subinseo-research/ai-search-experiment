"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProgressBar from "../../components/ProgressBar";
import { v4 as uuidv4 } from "uuid";

export default function CheckPage() {
  const router = useRouter();
  const [prolificId, setProlificId] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // ✅ participant_id는 무조건 생성/유지
    let pid = localStorage.getItem("participant_id");
    if (!pid) {
      pid = uuidv4();
      localStorage.setItem("participant_id", pid);
    }

    // ✅ 매번 다시 prolific id 입력받기
    localStorage.removeItem("prolific_id");

    // ✅ 중복참여 차단 안함 (예전 흔적 제거)
    localStorage.removeItem("hasParticipated");
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const entered = prolificId.trim();
    if (!entered) {
      setError("Please enter your Prolific ID.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    const participantId = localStorage.getItem("participant_id") || uuidv4();
    localStorage.setItem("participant_id", participantId);
    localStorage.setItem("prolific_id", entered);

    // ✅ Airtable에 "ID 수집" 로그 저장 (실패해도 UX는 진행)
    try {
      const res = await fetch("/api/airtable/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participant_id: participantId,
          prolific_id: entered,
          source: "check_page",
        }),
      });

      if (!res.ok) {
        console.error("Airtable check log failed:", await res.text());
      }
    } catch (err) {
      console.error("Airtable check log error:", err);
    } finally {
      router.push("/consent");
      setIsSubmitting(false);
    }
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
          disabled={isSubmitting}
        />

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-2 rounded-md text-sm ${
            isSubmitting ? "bg-gray-300" : "bg-black text-white"
          }`}
        >
          {isSubmitting ? "Saving..." : "Continue"}
        </button>

        <p className="text-xs text-gray-500 text-center">
          You will be asked for your Prolific ID each time you start the study.
        </p>
      </form>
    </main>
  );
}
