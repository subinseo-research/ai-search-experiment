"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProgressBar from "../../components/ProgressBar";

export default function CheckPage() {
  const router = useRouter();
  const [prolificId, setProlificId] = useState("");
  const [error, setError] = useState("");

  // 페이지 로드 시 기존에 저장된 ID가 있다면 삭제하여 새로 시작할 수 있게 함
  useEffect(() => {
    localStorage.removeItem("participant_id");
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();

    const pid = prolificId.trim();
    
    // 입력값이 비어있는지만 확인
    if (!pid) {
      setError("Please enter your Prolific ID.");
      return;
    }

    // [핵심] 중복 체크 로직 없이 무조건 로컬 스토리지에 덮어쓰기 저장
    localStorage.setItem("participant_id", pid);
    
    // 다음 단계(동의 페이지)로 이동
    router.push("/consent");
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
            }}
            placeholder="Prolific ID"
            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
          />

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            className="w-full bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition font-medium"
          >
            Save and Continue
          </button>
        </form>
        
        <p className="mt-4 text-xs text-gray-400 text-center">
          Your ID will be recorded for this session.
        </p>
      </div>
    </main>
  );
}