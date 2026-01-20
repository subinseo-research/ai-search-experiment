"use client";

import { useEffect } from "react";
import ProgressBar from "../../components/ProgressBar";

const REDIRECT_DELAY = 3000;

const PROLIFIC_COMPLETION_URL =
  "https://app.prolific.com/submissions/complete?cc=C1P8TZBS";

export default function Decline() {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.href = PROLIFIC_COMPLETION_URL;
    }, REDIRECT_DELAY);

    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="flex flex-col min-h-screen">
      {/* Progress Bar */}
      <div className="w-full fixed top-0 left-0 z-50">
        <ProgressBar progress={100} />
      </div>

      {/* Minimal Content */}
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center space-y-3">
          <h1 className="text-2xl font-bold">
            Thank you for your time.
          </h1>
          <p className="text-gray-600">
            You have chosen not to participate in this study.
          </p>
          <p className="text-sm text-gray-400">
            You will be redirected to the Prolific page in a few seconds.
          </p>
        </div>
      </div>
    </main>
  );
}
