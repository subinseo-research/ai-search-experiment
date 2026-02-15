"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProgressBar from "../../components/ProgressBar";

export default function ConsentPage() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [participantId, setParticipantId] = useState(null);
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

  const isContinueDisabled = !checked || isSubmitting;

  const handleContinue = async () => {
    if (!participantId || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/airtable/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participant_id: participantId,
          prolific_id: prolificId.trim(),
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
          prolific_id: prolificId.trim(),
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
      {/* Progress Bar */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <ProgressBar progress={2} />
      </div>

      <div className="mx-auto max-w-3xl px-6 py-12">
        {/* ===== Welcome Section ===== */}
        <header className="mb-12 space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">
            Welcome to the Study!
          </h1>

          <div className="text-base text-gray-700 space-y-2 leading-relaxed">
            <p>
              Hello, my name is Subin Seo. I am a master’s student at the University of Maryland, College Park. 
              Please read the following information carefully before deciding whether to participate.
            </p>
          </div>
        </header>

        {/* ===== Informed Consent Title ===== */}
        <section className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight">Informed Consent</h2>
        </section>

        {/* ===== Consent Content ===== */}
        <section className="space-y-6">
          <div>
            <p className="mt-1">
              We are researchers at the University of Maryland, College Park. In this study, we are interested in understanding people's online search behavior using a search tool. In this survey, you will be asked about what you found interesting and valuable during the search session.
            </p>
          </div>

          <div>
            <p className="mt-1">
              This research is being conducted by Subin Seo, Dr. Yiwei Xu at the University of Maryland, College Park. We are inviting you to participate in this research project because you are an adult who regularly uses search systems to search information online. We seek to learn more about how people use different types of search systems, specifically conversational AI and traditional web search. This study aims to understand how different search systems shape users’ search behaviors and how this leads to varying search outcomes and user experiences. Please be assure that your responses will be kept confidential and anonymous.
            </p>
          </div>

          <div>
            <p className="mt-1">
              The study will take approximately 10–12 minutes to complete, and you will receive monetary compensation for your participation.Your participation in this research is voluntary. This means you can choose not to continue and you can click the do not consent button below. You also have the right to withdraw at any point during the study, for any reason, and without any prejudice by simply exiting the survey. If you would like to discuss this research and your participation, please contact the Principal Investigator through the Prolific messaging system (which ensures the anonymity of your personal identity). 
            </p>        
          </div>
        </section>

        <hr className="my-10 border-gray-200" />

          <p className="mt-1">
            By clicking the button below, you acknowledge that your participation in the study is voluntary, that you are 18 years of age, and that you are aware that you may choose to terminate your participation in the study at any time and for any reason. You agree to proceed and participate in the study. 
          </p>

          {/* ===== Consent Checkbox ===== */}
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
              I confirm that I am at least 18 years of age, have read this consent form, and I voluntarily agree to participate in this research study.
            </span>
          </label>

        <section className="mb-8 space-y-3">
          <p className="font-medium">Please enter your prolific ID.</p>
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
        
        {/* ===== Action Buttons ===== */}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleDecline}
            disabled={isSubmitting}
            className={`rounded-xl border px-4 py-2 text-sm ${
              isSubmitting
                ? "border-gray-200 text-gray-400 cursor-not-allowed"
                : "border-gray-300 hover:bg-gray-50"
            }`}
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
