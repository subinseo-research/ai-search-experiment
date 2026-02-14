"use client";

import { useRouter } from "next/navigation";
import { WelcomePage } from "../app/check";

export default function HomePage() {
  const router = useRouter();

  return (
    <WelcomePage
      onNext={() => router.push("/consent")}
    />
  );
}
