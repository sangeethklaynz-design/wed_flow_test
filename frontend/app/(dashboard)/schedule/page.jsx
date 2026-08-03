"use client";

import { Download } from "lucide-react";
import ScheduleEventCard from "@/components/schedule/ScheduleEventCard";
import ScheduleTable from "@/components/schedule/ScheduleTable";

const EVENTS = [
  {
    id: 1,
    time: "09:00",
    title: "Getting Ready",
    location: "Bride suite · Galle Face",
    status: "done",
  },
  {
    id: 2,
    time: "11:30",
    title: "Poruwa Ceremony",
    location: "Main Hall · Galle Face",
    status: "done",
  },
  {
    id: 3,
    time: "13:00",
    title: "Lunch Reception",
    location: "Ballroom · Galle Face",
    status: "live",
  },
  {
    id: 4,
    time: "16:00",
    title: "Photo Session",
    location: "Garden · Galle Face",
    status: "upcoming",
  },
  {
    id: 5,
    time: "19:00",
    title: "Evening Party",
    location: "Rooftop · Galle Face",
    status: "upcoming",
  },
  {
    id: 6,
    time: "22:30",
    title: "Cake Cutting",
    location: "Ballroom · Galle Face",
    status: "upcoming",
  },
];

const WEDDING_DATE = "Saturday, 14 November 2026";

function ProgressBlock({ done, total }) {
  const remaining = total - done;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <p className="text-sm text-muted whitespace-nowrap">
        {done} of {total} events done
      </p>
      <div
        className="h-2 w-28 sm:w-32 rounded-full bg-gold overflow-hidden shrink-0"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${done} of ${total} events done`}
      >
        <div
          className="h-full rounded-full bg-[#c4a574] transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-sm text-muted whitespace-nowrap">{remaining} remaining</p>
    </div>
  );
}

function DownloadButton({ className = "" }) {
  const handleDownload = () => {
    const lines = [
      `Wedding Schedule — ${WEDDING_DATE}`,
      "",
      ...EVENTS.map(
        (e) => `${e.time}  ${e.title}  (${e.location})  [${e.status}]`
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "wedding-schedule.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      className={`inline-flex items-center gap-2 bg-navy text-white font-medium px-4 py-2.5 rounded-xl hover:bg-navy/90 transition-colors whitespace-nowrap ${className}`}
    >
      <Download className="w-4 h-4" strokeWidth={2} />
      Download
    </button>
  );
}

export default function SchedulePage() {
  const doneCount = EVENTS.filter((e) => e.status === "done").length;
  const total = EVENTS.length;

  return (
    <div className="p-6 md:p-8 lg:p-12 w-full">
      {/* Mobile header — Figma */}
      <div className="md:hidden mb-6">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h1 className="font-serif font-bold text-3xl text-navy">Schedule</h1>
          <DownloadButton className="shrink-0" />
        </div>
        <p className="text-muted text-sm mb-5">{WEDDING_DATE}</p>
        <ProgressBlock done={doneCount} total={total} />
      </div>

      {/* Desktop header — page name only */}
      <div className="hidden md:flex items-center mb-8 bg-white p-5 rounded-2xl border border-border">
        <h1 className="font-serif font-bold text-2xl text-navy">Schedule</h1>
      </div>

      {/* Desktop controls: date + progress left, download right */}
      <div className="hidden md:block mb-8 bg-white rounded-2xl border border-border p-5 card-shadow">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-8">
          <div className="flex-1 min-w-0">
            <p className="text-navy font-medium mb-3">{WEDDING_DATE}</p>
            <ProgressBlock done={doneCount} total={total} />
          </div>
          <DownloadButton className="self-start lg:self-center lg:ml-auto shrink-0" />
        </div>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3 mt-6">
        {EVENTS.map((event) => (
          <ScheduleEventCard key={event.id} {...event} />
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block">
        <ScheduleTable events={EVENTS} />
      </div>
    </div>
  );
}
