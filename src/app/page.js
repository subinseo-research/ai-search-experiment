"use client";

import { useRouter } from "next/navigation";
import { WelcomePage } from "../components/welcome";

export default function HomePage() {
  const router = useRouter();

  return (
    <WelcomePage
      onNext={() => router.push("/consent")}
    />
  );
}
