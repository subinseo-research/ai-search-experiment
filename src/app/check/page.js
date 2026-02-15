"use client";
import { useState } from "react";

export default function ProlificOnly() {
  const [pid, setPid] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        localStorage.setItem("prolific_id", pid.trim());
        if (!localStorage.getItem("participant_id")) {
          localStorage.setItem("participant_id", crypto.randomUUID());
        }
        window.location.assign("/consent");
      }}
      className="min-h-screen flex items-center justify-center bg-gray-100"
    >
      <div className="bg-white p-8 rounded-xl shadow w-[420px] space-y-4">
        <h1 className="text-xl font-semibold text-center">Enter Your Prolific ID</h1>
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
