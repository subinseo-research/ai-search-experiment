"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProgressBar from "../../components/ProgressBar";

export default function CheckPage() {
  const router = useRouter();

  const [prolificId, setProlificId] = useState("");
  const [alreadyParticipated, setAlreadyParticipated] = useState(false);
  const [error, setError] = useState("");

  // ✅ 중복 참여 여부 확인
  useEffect(() => {
    const hasParticipated = localStorage.getItem("hasParticipated");
    if (hasParticipated === "true") {
      setAlreadyParticipated(true);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!prolificId.trim()) {
      setError("Please enter your Prolific ID.");
      return;
    }

    // Prolific ID 저장
    localStorage.setItem("participant_id", prolificId.trim());
    localStorage.setItem("hasParticipated", "true");

    router.push("/consent");
  };

  // 이미 참여한 경우
  if (alreadyParticipated) {
    return (
      <main className="relative flex flex-col items-center justify-center min-h-screen bg-gray-100 text-gray-800">
        <div className="absolute top-0 left-0 w-full">
          <ProgressBar progress={0} />
        </div>

        <h1 className="text-2xl font-semibold mb-4">
          You have already participated.
        </h1>
        <p className="text-sm text-gray-600">
          Duplicate participation is not allowed.
        </p>
      </main>
    );
  }

  // Prolific ID 입력 화면
  return (
    <main className="relative flex flex-col items-center justify-center min-h-screen bg-gray-50 text-gray-800">
      <div className="absolute top-0 left-0 w-full">
        <ProgressBar progress={0} />
      </div>

      <div className="bg-white p-8 rounded-xl shadow-md w-[400px]">
        <h1 className="text-xl font-semibold mb-4 text-center">
          Enter Your Prolific ID
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={prolificId}
            onChange={(e) => setProlificId(e.target.value)}
            placeholder="Prolific ID"
            className="w-full border rounded-lg px-4 py-2"
          />

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

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
