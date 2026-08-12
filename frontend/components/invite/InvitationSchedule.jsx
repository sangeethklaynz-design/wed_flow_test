"use client";

import { useState } from "react";
import Image from "next/image";
import { getAccessToken } from "@/lib/auth";

function formatTime12(time24) {
  if (!time24) return "";
  const [hStr, mStr] = time24.split(":");
  let hours = Number(hStr);
  const minutes = mStr || "00";
  const period = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  if (hours === 0) hours = 12;
  return `${hours}:${minutes} ${period}`;
}

export default function InvitationSchedule({ events = [], guestToken }) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  const handleDownload = async () => {
    setDownloading(true);
    setError("");
    try {
      let url = "";
      let headers = {};

      if (guestToken) {
        url = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/public/invite/${encodeURIComponent(guestToken)}/schedule/download`;
      } else {
        const token = getAccessToken();
        if (!token) throw new Error("Unable to authenticate.");
        url = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/couple/schedule/download`;
        headers = { Authorization: `Bearer ${token}` };
      }

      const res = await fetch(url, { headers });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to download schedule");
      }

      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = "wedding-schedule.pdf";
      a.click();
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      setError(err.message || "Failed to download schedule");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="w-[390px] min-h-[844px] mx-auto bg-[#FAF6F0] flex flex-col items-center px-6 py-10 select-none">
      {/* Header */}
      <div className="relative w-[175px] h-[34px] mb-4">
        <Image
          src="/invitation/page3-lotus-divider.png"
          alt="Lotus divider"
          fill
          className="object-contain"
        />
      </div>

      <h1 className="font-cormorant-custom font-semibold text-[34px] text-[#7732A4] tracking-wider uppercase text-center leading-none mb-2">
        WEDDING SCHEDULE
      </h1>

      <div className="relative w-[53px] h-[48px] my-3">
        <Image
          src="/invitation/0.2.png"
          alt="Small lotus"
          fill
          className="object-contain"
        />
      </div>

      <p className="font-quattrocento-custom font-bold text-[14px] text-[#1B3601] text-center leading-relaxed mb-8">
        Here is what we have planned<br />for our special day
      </p>

      {/* Timeline */}
      <div className="relative w-full max-w-[320px] flex flex-col gap-0">
        {events.map((event, idx) => (
          <div key={event.id} className="relative flex gap-4 pb-6">
            {/* Vertical line */}
            {idx < events.length - 1 && (
              <div className="absolute top-[28px] left-[13px] w-[2px] h-[calc(100%-14px)] bg-[#B54AB6]/30" />
            )}

            {/* Dot */}
            <div className="relative shrink-0 w-[28px] h-[28px] rounded-full bg-[#473284] border-2 border-[#C6A15B] flex items-center justify-center z-10">
              <div className="w-[8px] h-[8px] rounded-full bg-[#C6A15B]" />
            </div>

            {/* Content */}
            <div className="flex-1 pt-0.5">
              <h3 className="font-cormorant-custom font-bold text-[16px] text-[#B54AB6] uppercase tracking-wide leading-tight mb-0.5">
                {event.title}
              </h3>
              <p className="font-quattrocento-custom font-bold text-[13px] text-[#1B3601] leading-tight">
                {formatTime12(event.startTime)}
                {event.endTime ? ` - ${formatTime12(event.endTime)}` : ""}
              </p>
              {event.location && (
                <p className="font-quattrocento-custom text-[12px] text-[#1B3601]/70 leading-tight mt-0.5">
                  {event.location}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* "Keep the day's events close at hand" and Button */}
      <div className="w-full flex items-center justify-center z-10 mt-6">
        <p className="font-greatvibes-custom text-[28px] text-[#7732A4] text-center">
          Keep the day's events close at hand
        </p>
      </div>

      <div className="w-full flex flex-col items-center justify-center z-20 gap-3 mt-3">
        <button 
          onClick={handleDownload}
          disabled={downloading}
          className="bg-[#4C2D88] hover:bg-[#623bab] disabled:opacity-70 transition-colors text-white font-sans text-[15px] font-medium w-[220px] h-[48px] rounded-[24px] flex items-center justify-center cursor-pointer shadow-md active:scale-95"
        >
          {downloading ? "Downloading..." : "Save the Schedule"}
        </button>
        {error && (
          <p className="text-red-500 text-xs text-center w-full">{error}</p>
        )}
      </div>

      <div className="relative w-[138px] h-[92px] mt-12">
        <Image
          src="/invitation/0.1.png"
          alt="Lotus"
          fill
          className="object-contain"
        />
      </div>
    </div>
  );
}
