"use client";

import React from "react";
import QrCheckInView from "@/components/checkin/QrCheckInView";

export default function AdminQrCheckInPage() {
  return (
    <div className="w-full min-w-0 p-4 sm:p-6 md:p-8 lg:p-10 max-w-[1440px] mx-auto">
      <QrCheckInView role="admin" />
    </div>
  );
}
