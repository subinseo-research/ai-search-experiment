"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProgressBar from "../../components/ProgressBar";
import { v4 as uuidv4 } from "uuid";

export default function CheckPage() {
  const router = useRouter();

  // 1. participant_id 
  useEffect(() => {
    let participantId = localStorage.getItem("participant_id");
    if (!participantId) {
      participantId = uuidv4();
      localStorage.setItem("participant_id", participantId);
    }
    router.push("/consent");
  }, [router]);

  return (
    <main className="relative flex flex-col items-center justify-center min-h-screen bg-gray-50 text-gray-800">
      {/* Progress bar */}
      <div className="absolute top-0 left-0 w-full">
        <ProgressBar progress={0} />
      </div>

      <h1 className="text-xl font-medium">Checking your participation...</h1>
      <p className="text-sm text-gray-500 mt-2">Please wait...</p>
    </main>
  );
}
