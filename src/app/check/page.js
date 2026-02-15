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

    // Prolific ID 저장
    localStorage.setItem("prolific_id", trimmed);

    // Consent 페이지로 이동
    router.push("/consent");
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-md w-[400px] text-center">
        <h1 className="text-xl font-semibold mb-6">
          Enter Your Prolific ID
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Prolific ID"
            value={prolificId}
            onChange={(e) => setProlificId(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
          />

          <button
            type="submit"
            className="w-full bg-black text-white py-2 rounded-md hover:opacity-90 transition"
          >
            Save and Continue
          </button>
        </form>
      </div>
    </main>
  );
}
