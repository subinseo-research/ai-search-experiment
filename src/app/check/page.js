"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ProlificOnly() {
  const r = useRouter();
  const [pid, setPid] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();

        // 1️⃣ Prolific ID 항상 저장
        localStorage.setItem("prolific_id", pid.trim());

        // 2️⃣ participant_id 없으면 생성
        let id = localStorage.getItem("participant_id");
        if (!id) {
          id = crypto.randomUUID();
          localStorage.setItem("participant_id", id);
        }

        // 3️⃣ Consent 페이지로 이동
        r.push("/consent");
      }}
      className="min-h-screen flex items-center justify-center bg-gray-100"
    >
      <div className="bg-white p-8 rounded-xl shadow w-[420px] space-y-4">
        <h1 className="text-xl font-semibold text-center">
          Enter Your Prolific ID
        </h1>

        <input
          className="w-full border rounded-md px-4 py-2"
          value={pid}
          onChange={(e) => setPid(e.target.value)}
          placeholder="Prolific ID"
        />

        <button className="w-full bg-black text-white py-2 rounded-md">
          Save and Continue
        </button>
      </div>
    </form>
  );
}
