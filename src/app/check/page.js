"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProgressBar from "../../components/ProgressBar";

export default function CheckPage() {
  const router = useRouter();
  const [prolificId, setProlificId] = useState("");
  const [error, setError] = useState("");

  // ✅ Always start a fresh flow when landing on /check
  useEffect(() => {
    // remove the "passed check" token so user cannot skip steps by back/refresh
    localStorage.removeItem("check_ok");

    // optional: clear previous ids so every visit forces re-entry (matches your intention)
    localStorage.removeItem("prolific_id");
    localStorage.removeItem("participant_id");
  }, []);

  const generateUUID = () => {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
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

    // ✅ Save prolific id (always)
    localStorage.setItem("prolific_id", pid);

    // ✅ Create a new participant id (always)
    const participantId = generateUUID();
    localStorage.setItem("participant_id", participantId);

    // ✅ Mark that /check step is completed in this flow
    localStorage.setItem("check_ok", "1");

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
              inputMode="text"
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
