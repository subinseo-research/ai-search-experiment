"use client";

import { useState } from "react";
import ProgressBar from "../../components/ProgressBar";

export default function CheckPage() {
  const [prolificId, setProlificId] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    const pid = prolificId.trim();
    if (!pid) {
      setError("Please enter your Prolific ID.");
      return;
    }
    localStorage.setItem("participant_id", pid);
    setSaved(true);
    setError("");
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
              if (saved) setSaved(false);
            }}
            placeholder="Prolific ID"
            className="w-full border rounded-lg px-4 py-2"
          />

          {error && <p className="text-red-500 text-sm">{error}</p>}

          {saved && (
            <p className="text-green-600 text-sm">
              Saved. You may now proceed to the next page.
            </p>
          )}

          <button
            type="submit"
            className="w-full bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition"
          >
            Save
          </button>
        </form>
      </div>
    </main>
  );
}
