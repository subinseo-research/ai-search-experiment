"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CheckPage() {
  const router = useRouter();
  const [prolificId, setProlificId] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    const trimmed = prolificId.trim();
    if (!trimmed) return;

    // 1) prolific_id는 무조건 저장
    localStorage.setItem("prolific_id", trimmed);

    // 2) consent에서 요구하는 participant_id가 없으면 여기서 생성/저장
    let participantId = localStorage.getItem("participant_id");
    if (!participantId) {
      participantId = crypto.randomUUID(); // 브라우저 내장 UUID
      localStorage.setItem("participant_id", participantId);
    }

    // 3) 다음 페이지로 이동
    router.push("/consent");
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-md w-[420px] text-center">
        <h1 className="text-xl font-semibold mb-6">Enter Your Prolific ID</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Prolific ID"
            value={prolificId}
            onChange={(e) => setProlificId(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-4 py-2
                       focus:outline-none focus:ring-2 focus:ring-black"
          />

          <button
            type="submit"
            className="w-full bg-black text-white py-2 rounded-md
                       hover:opacity-90 transition"
          >
            Save and Continue
          </button>
        </form>
      </div>
    </main>
  );
}
