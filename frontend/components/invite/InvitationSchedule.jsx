"use client";

import Image from "next/image";

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

export default function InvitationSchedule({ events = [] }) {
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
          src="/invitation/page3-small-lotus.png"
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

      <div className="relative w-[138px] h-[92px] mt-6">
        <Image
          src="/invitation/page3-small-lotus.png"
          alt="Lotus"
          fill
          className="object-contain"
        />
      </div>
    </div>
  );
}
