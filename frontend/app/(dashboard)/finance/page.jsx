"use client";

import { CreditCard } from "lucide-react";
import { NotificationBell } from "@/components/ui/NotificationPanel";

export default function FinancePage() {
  return (
    <div className="p-6 md:p-8 lg:p-12 w-full min-w-0">
      <div className="hidden md:flex justify-between items-center mb-8 bg-white p-5 md:px-8 rounded-2xl border border-border shadow-sm min-h-[78px] w-full">
        <h1 className="font-serif font-bold text-2xl text-[#054380]">Finance</h1>
        <NotificationBell />
      </div>

      <div className="md:hidden flex justify-between items-center mb-6 bg-white p-4 rounded-2xl border border-border shadow-sm">
        <h1 className="font-serif font-bold text-2xl text-[#054380]">Finance</h1>
        <NotificationBell />
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm p-8 text-center flex flex-col items-center justify-center min-h-[300px] w-full">
        <div className="w-14 h-14 rounded-2xl bg-[#EEF5FF] flex items-center justify-center mb-4">
          <CreditCard className="w-7 h-7 text-[#054380]" />
        </div>
        <h2 className="text-[#054380] font-bold text-xl mb-2">Finance Overview</h2>
        <p className="text-muted text-sm max-w-md">
          Track ticket payments, receipts, and revenue summaries. Full reporting and analytics features are being prepared.
        </p>
      </div>
    </div>
  );
}
