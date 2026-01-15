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
          consent: "no",
        }),
      });

      router.push("/thankyou?status=declined");
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
        <ProgressBar progress={5} />
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
            </p>
            <p>
              Please read the following information carefully before deciding whether to participate.
            </p>
          </div>
        </header>

        {/* ===== Informed Consent Title ===== */}
        <section className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight">Informed Consent</h2>
        </section>

        {/* ===== Consent Cont6ent ===== */}
        <section className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold">Study Title</h3>
            <p className="mt-1">
              Search Behavior in Search Engines and Generative AI 
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold">Purpose of the Study</h3>
            <p className="mt-1">
              This research is being conducted by Subin Seo, Dr. Yiwei Xu at the University of Maryland, College Park. We are inviting you to participate in this research project because you are an adult who regularly uses search systems to search information online. We seek to learn more about how people use different types of search systems, specifically conversational AI and traditional web search. This study aims to understand how different search systems shape users’ search behaviors and how this leads to varying search outcomes and user experiences.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold">Procedures</h3>
            <p className="mt-1">
              The procedures involve participating in an online research study consisting of three parts: pre-survey, search session, and post-survey. The entire study will take approximately 10-12 minutes to complete.
            </p>
            <p className="mt-1">
              In the pre-survey, you will be asked about your familiarity, goal clarity, and the clarity of their search plans related to the assigned search task. 
            </p>
            <p className="mt-1">
              You will then be asked to complete a search task using either a search engine or generative AI. During the search session, you may enter multiple queries (search engine) or prompt (generative AI) to explore the given topic. It should take at least four minutes to complete, and you should submit several queries or prompts during the session.
            </p>
            <p className="mt-1">  
              In the post-survey, you will be asked about your search experience, including any unexpected or interesting information you encountered, your emotional responses, your confidence in understanding the topic, and what you learned from the search.
            </p>
            <p className="mt-1">  
              When you have completed the study, you will be automatically redirected to the linked Prolific page to receive your compensation.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold">Risks and Discomforts</h3>
            <p className="mt-1">
              Risks are minimal and no greater than those encountered during
              typical online browsing. You may skip any question you prefer not
              to answer.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold">Benefits</h3>
            <p className="mt-1">
              While there may be no direct personal benefit, your participation
              will help researchers better understand human–AI interaction and
              information-seeking behaviors.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold">Confidentiality & Data</h3>
            <p className="mt-1">
              We will not collect personally identifying information unless
              explicitly stated. Responses will be stored securely and analyzed
              anonymously.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold">Voluntary Participation</h3>
            <p className="mt-1">
              Participation is entirely voluntary. You may withdraw at any time
              without penalty by closing this browser window.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold">Contact Information</h3>
            <p className="mt-1">
              If you have questions about this research, please contact the
              research team at{" "}
              <span className="font-mono">example@university.edu</span>. For
              questions about your rights as a participant, you may contact the
              IRB at <span className="font-mono">irb@university.edu</span>.
            </p>
          </div>
        </section>

        <hr className="my-10 border-gray-200" />

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
              I have read and understood the information above. I am at least 18 years old
              and voluntarily agree to participate in this study.
            </span>
          </label>

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
            {isSubmitting ? "Saving consent…" : "Continue"}
          </button>
        </div>

        <p className="mt-4 text-xs text-gray-500">
          By selecting “Continue,” you indicate your electronic consent and
          agree to participate in this study.
        </p>

      </div>
    </main>
  );
}
