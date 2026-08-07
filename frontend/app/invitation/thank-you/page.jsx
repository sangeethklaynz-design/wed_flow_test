"use client";

import React from "react";
import ThankYouPage from "@/components/invite/ThankYouPage";

export default function ThankYouRoute() {
  return (
    <div className="min-h-screen w-full relative flex flex-col items-center bg-gradient-to-br from-[#F5EFE6] via-[#E8DFD8] to-[#DCD3CB] overflow-x-hidden md:py-10">
      
      {/* Main Container */}
      <main className="w-[390px] relative overflow-hidden flex flex-col card-shadow md:rounded-2xl">
        <ThankYouPage />
      </main>

    </div>
  );
}
