"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProgressBar from "../../components/ProgressBar";

export default function ConsentPage() {
  const router = useRouter();

  const [checked, setChecked] = useState(false);
  const [prolificId, setProlificId] = useState("");
  const [participantId, setParticipantId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // ✅ participant_id는 여기서 보장(없으면 생성)
  useEffect(() => {
    let id = localStorage.getItem("participant_id");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("participant_id", id);
    }
    setParticipantId(id);

    // 혹시 이전에 prolific_id 저장된 게 있으면 불러오기
    const savedPid = localStorage.getItem("prolific_id") || "";
    setProlificId(savedPid);
  }, []);

  const canContinue =
    checked && prolificId.trim().length > 0 && !isSubmitting;

  const handleContinue = async () => {
    if (!participantId || !canContinue) return;

    setIsSubmitting(true);
    setError("");

    const pid = prolificId.trim();

    // ✅ 무조건 저장 (설문 응답처럼)
    localStorage.setItem("prolific_id", pid);

    try {
      // ✅ (선택) Airtable에 consent + prolific_id 같이 저장하고 싶으면 아래처럼
      const res = await fetch("/api/airtable/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participant_id: participantId,
          consent: "yes",
          prolific_id: pid,
        }),
      });

      if (!res.ok) throw new Error("Failed to save consent.");

      router.push("/pre-survey"); // 너의 다음 페이지로 바꿔줘
    } catch (e) {
      setError("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-40 bg-white border-b">
        <ProgressBar progress={10} />
      </div>

      <div className="max-w-[900px] mx-auto bg-white px-8 py-12">
        <h1 className="text-3xl font-semibold mb-8 text-center">Consent</h1>

        {/* ✅ Prolific ID (항상 수집) */}
        <div className="max-w-[520px] mx-auto mb-8">
          <label className="block text-sm font-medium mb-2">
            Prolific ID <span className="text-red-600">*</span>
          </label>
          <input
            value={prolificId}
            onChange={(e) => setProlificId(e.target.value)}
            placeholder="Enter your Prolific ID"
            className="w-full border border-gray-300 rounded-md px-4 py-2
                       focus:outline-none focus:ring-2 focus:ring-black"
          />
          <p className="text-xs text-gray-500 mt-2">
            This is required for payment processing.
          </p>
        </div>

        {/* ✅ 동의 체크 */}
        <div className="max-w-[720px] mx-auto space-y-4">
          <div className="border rounded-lg p-5 bg-gray-50">
            <p className="text-sm text-gray-700 leading-6">
              {/* 너의 consent 텍스트 */}
              By checking the box below, you indicate that you have read and
              understood the information above and agree to participate.
            </p>
          </div>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className="h-5 w-5"
            />
            <span className="text-sm">
              I agree to participate in this study.
            </span>
          </label>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <button
            onClick={handleContinue}
            disabled={!canContinue}
            className={`w-full py-3 rounded-md text-white transition
              ${canContinue ? "bg-black hover:opacity-90" : "bg-gray-300 cursor-not-allowed"}`}
          >
            {isSubmitting ? "Saving..." : "Save and Continue"}
          </button>
        </div>
      </div>
    </main>
  );
}
