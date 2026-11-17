import { Suspense } from "react";

import { ApiStatus } from "@/components/api-status";

export default function Home() {
  return (
    <div className="h-screen w-screen flex flex-col gap-4 justify-center items-center">
      <h1 className="text-6xl italic">REUSABLE REPO FOR FULL STACK DEV.</h1>
      <Suspense fallback={<p className="text-sm text-gray-500">Checking API…</p>}>
        <ApiStatus />
      </Suspense>
    </div>
  );
}
