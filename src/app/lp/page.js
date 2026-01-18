import { Suspense } from "react";
import LandingContent from "./LandingContent";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6">Loading article...</div>}>
      <LandingContent />
    </Suspense>
  );
}
