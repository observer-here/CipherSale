import { Suspense } from "react";
import { Dashboard } from "@/components/home/dashboard";

export default function HomePage() {
  return (
    <Suspense fallback={<p className="hint">Loading</p>}>
      <Dashboard />
    </Suspense>
  );
}
