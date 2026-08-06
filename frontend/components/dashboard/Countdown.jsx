"use client";

import { useEffect, useState } from "react";

function pad(n) {
  return String(Math.max(0, n)).padStart(2, "0");
}

function getRemaining(targetDate) {
  if (!targetDate) {
    return { days: "00", hours: "00", minutes: "00", seconds: "00" };
  }

  const target = new Date(targetDate);
  if (Number.isNaN(target.getTime())) {
    return { days: "00", hours: "00", minutes: "00", seconds: "00" };
  }

  // Treat date-only as start of that local day if needed
  const now = Date.now();
  let end = target.getTime();
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(targetDate))) {
    end = new Date(`${targetDate}T00:00:00`).getTime();
  }

  const diff = Math.max(0, end - now);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return {
    days: pad(days),
    hours: pad(hours),
    minutes: pad(minutes),
    seconds: pad(seconds),
  };
}

export default function Countdown({
  targetDate,
  days: daysProp,
  hours: hoursProp,
  minutes: minutesProp,
  seconds: secondsProp,
}) {
  const [tick, setTick] = useState(() =>
    targetDate
      ? getRemaining(targetDate)
      : {
          days: daysProp ?? "00",
          hours: hoursProp ?? "00",
          minutes: minutesProp ?? "00",
          seconds: secondsProp ?? "00",
        }
  );

  useEffect(() => {
    if (!targetDate) {
      setTick({
        days: daysProp ?? "00",
        hours: hoursProp ?? "00",
        minutes: minutesProp ?? "00",
        seconds: secondsProp ?? "00",
      });
      return;
    }

    setTick(getRemaining(targetDate));
    const id = setInterval(() => setTick(getRemaining(targetDate)), 1000);
    return () => clearInterval(id);
  }, [targetDate, daysProp, hoursProp, minutesProp, secondsProp]);

  const units = [
    { value: tick.days, label: "Days" },
    { value: tick.hours, label: "Hours" },
    { value: tick.minutes, label: "Minutes" },
    { value: tick.seconds, label: "Seconds" },
  ];

  return (
    <div className="bg-white rounded-2xl p-6 md:p-8 card-shadow border border-border">
      <h2 className="font-serif font-bold text-xl text-navy mb-6">The Big Day</h2>

      <div className="flex justify-between md:justify-center md:space-x-4 lg:justify-start lg:space-x-8">
        {units.map((unit, idx) => (
          <div key={idx} className="flex flex-col items-center">
            <div className="bg-white w-14 h-14 sm:w-16 sm:h-16 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-xl md:rounded-2xl flex items-center justify-center card-shadow border border-border mb-3">
              <span className="font-serif font-bold text-2xl sm:text-3xl md:text-3xl lg:text-4xl text-navy">
                {unit.value}
              </span>
            </div>
            <span className="text-muted text-xs md:text-sm">{unit.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
