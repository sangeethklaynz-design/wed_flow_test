"use client";

import React from "react";
import QrCheckInView from "@/components/checkin/QrCheckInView";

export default function ClientQrCheckInPage() {
  return (
    <div className="w-full min-w-0 p-4 sm:p-5 md:p-6 lg:p-7 xl:p-8">
      <QrCheckInView role="client" />
    </div>
  );
}
