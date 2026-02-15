"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProgressBar from "../../components/ProgressBar";

export default function ConsentPage() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [participantId, setParticipantId] = useState(null);
  const [prolificId, setProlificId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load participant UUID
  useEffect(() => {
    const id = localStorage.getItem("participant_id");
    if (!id) {
      window.location.href = "/check";
    } else {
      setParticipantId(id);
    }
  }, []);

  const isContinueDisabled =
    !checked || !prolificId.trim() || isSubmitting;

  const handleContinue = async () => {
    if (!participantId || !prolificId.trim() || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/airtable/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participant_id: participantId,
          prolific_id: prolificId.trim(), // ✅ 추가
          consent: "yes",
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error("Save failed");

      router.push("/task");
    } catch (err) {
      console.error("Consent save error:", err);
      alert("Error saving consent. Please try again.");
      setIsSubmitting(false);
    }
  };

  const handleDecline = async () => {
    if (!participantId || isSubmitting) return;

    try {
      await fetch("/api/airtable/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participant_id: participantId,
          prolific_id: prolificId.trim(), // decline도 저장
          consent: "no",
        }),
      });

      router.push("/decline?status=declined");
    } catch (err) {
      console.error("Consent decline error:", err);
    }
  };

  if (!participantId) {
    return (
      <main className="flex items-center justify-center min-h-screen text-gray-700">
        <p>Loading participant information...</p>
      </main>
    );
  }

  return (
    <main className="min-h-[100svh] bg-white text-gray-900">
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <ProgressBar progress={2} />
      </div>

      <div className="mx-auto max-w-3xl px-6 py-12">

        <header className="mb-12 space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">
            Welcome to the Study!
          </h1>
        </header>

        <section className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight">
            Informed Consent
          </h2>
        </section>

        {/* 🔹 Prolific ID 입력 필드 추가 */}
        <section className="mb-8 space-y-3">
          <p className="font-medium">
            Please enter your Prolific ID.
          </p>

          <input
            type="text"
            value={prolificId}
            onChange={(e) => setProlificId(e.target.value)}
            placeholder="Prolific ID"
            className="w-full max-w-md border rounded-md px-3 py-2 text-sm"
            autoComplete="off"
            spellCheck={false}
          />
        </section>

        <section className="space-y-6 text-gray-700">
          <p>
            We are researchers at the University of Maryland, College Park...
          </p>
          <p>
            The study will take approximately 10–12 minutes to complete...
          </p>
        </section>

        <hr className="my-10 border-gray-200" />

        <label
          htmlFor="agree"
          className="mt-6 flex items-start gap-3 rounded-xl border border-gray-200 p-4 cursor-pointer select-none hover:bg-gray-50"
        >
          <input
            id="agree"
            type="checkbox"
            className="mt-1 h-5 w-5 rounded border-gray-300"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
          />
          <span className="text-sm leading-6">
            I confirm that I am at least 18 years of age and voluntarily agree
            to participate.
          </span>
        </label>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleDecline}
            disabled={isSubmitting}
            className="rounded-xl border px-4 py-2 text-sm border-gray-300 hover:bg-gray-50"
          >
            Decline
          </button>

          <button
            type="button"
            onClick={handleContinue}
            disabled={isContinueDisabled}
            className={`rounded-xl px-4 py-2 text-sm font-semibold text-white ${
              isContinueDisabled
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gray-900 hover:bg-black"
            }`}
          >
            {isSubmitting ? "Saving consent…" : "Consent"}
          </button>
        </div>
      </div>
    </main>
  );
}
