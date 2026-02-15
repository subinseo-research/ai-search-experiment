"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProgressBar from "../../components/ProgressBar";
import { v4 as uuidv4 } from "uuid";

export default function CheckPage() {
  const router = useRouter();
  const [prolificId, setProlificId] = useState("");
  const [error, setError] = useState("");

  // participant_id는 무조건 생성
  useEffect(() => {
    let participantId = localStorage.getItem("participant_id");
    if (!participantId) {
      participantId = uuidv4();
      localStorage.setItem("participant_id", participantId);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();

    const pid = prolificId.trim();
    if (!pid) {
      setError("Please enter your Prolific ID.");
      return;
    }

    // prolific ID 저장
    localStorage.setItem("prolific_id", pid);

    // 바로 consent로 이동
    router.push("/consent");
  };

  return (
    <main className="relative flex flex-col items-center justify-center min-h-screen bg-gray-50 text-gray-800">
      
      <div className="absolute top-0 left-0 w-full">
        <ProgressBar progress={0} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-xl shadow-sm w-[400px] space-y-4"
      >
        <h1 className="text-xl font-semibold text-center">
          Enter Your Prolific ID
        </h1>

        <input
          type="text"
          value={prolificId}
          onChange={(e) => setProlificId(e.target.value)}
          placeholder="Prolific ID"
          className="w-full border rounded-md px-3 py-2 text-sm"
        />

        {error && (
          <p className="text-red-500 text-sm">{error}</p>
        )}

        <button
          type="submit"
          className="w-full bg-black text-white py-2 rounded-md text-sm"
        >
          Continue
        </button>
      </form>
    </main>
  );
}
