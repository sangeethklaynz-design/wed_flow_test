"use client";

import React, { Suspense } from "react";
import ThankYouPage from "@/components/invite/ThankYouPage";

function ThankYouLoading() {
  return (
    <div
      className="w-full min-h-[640px] bg-[#FAF6F0] flex items-center justify-center text-muted text-sm"
      aria-busy="true"
    >
      Loading…
    </div>
  );
}

export default function ThankYouRoute() {
  return (
    <div className="min-h-screen w-full relative flex flex-col items-center bg-gradient-to-br from-[#F5EFE6] via-[#E8DFD8] to-[#DCD3CB] overflow-x-hidden md:py-10">
      <main className="w-[390px] relative overflow-hidden flex flex-col card-shadow md:rounded-2xl">
        <Suspense fallback={<ThankYouLoading />}>
          <ThankYouPage />
        </Suspense>
      </main>
    </div>
  );
}
