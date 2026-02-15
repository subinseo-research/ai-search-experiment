"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProgressBar from "../../components/ProgressBar";

export default function CheckPage() {
  const router = useRouter();

  const [prolificId, setProlificId] = useState("");
  const [error, setError] = useState("");

  // ✅ /check에 들어오면 항상 새로 입력받도록 기존 ID 삭제
  useEffect(() => {
    localStorage.removeItem("participant_id");
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();

    const pid = prolificId.trim();
    if (!pid) {
      setError("Please enter your Prolific ID.");
      return;
    }

    localStorage.setItem("participant_id", pid);
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
            Save and Continue
          </button>
        </form>
      </div>
    </main>
  );
}
