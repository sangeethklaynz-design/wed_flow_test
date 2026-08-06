"use client";

import { useEffect, useRef, useState } from "react";
import { MoreVertical } from "lucide-react";
import { ScheduleStatusBadge } from "@/components/schedule/ScheduleEventCard";
import clsx from "clsx";

function formatTimeRange(startTime, endTime) {
  if (!startTime) return "—";
  if (!endTime) return startTime;
  return `${startTime} - ${endTime}`;
}

function notesPreview(notes) {
  if (!notes) return "—";
  const words = notes.trim().split(/\s+/);
  if (words.length <= 4) return notes;
  return `${words.slice(0, 4).join(" ")}...`;
}

export default function ScheduleTable({
  events,
  onViewEvent,
  onEditEvent,
  onDeleteEvent,
}) {
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!openMenuId) return;

    const onDocDown = (e) => {
      if (!menuRef.current) return;
      if (menuRef.current.contains(e.target)) return;
      setOpenMenuId(null);
    };

    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, [openMenuId]);

  if (events.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-10 card-shadow border border-border text-center">
        <p className="text-muted text-sm">No events on the schedule.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl card-shadow border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-center">
          <thead>
            <tr className="border-b border-border bg-cream/60">
              <th className="px-6 py-4 text-xs font-medium text-muted uppercase tracking-wide">
                Time
              </th>
              <th className="px-6 py-4 text-xs font-medium text-muted uppercase tracking-wide">
                Event
              </th>
              <th className="px-6 py-4 text-xs font-medium text-muted uppercase tracking-wide">
                Special Notes
              </th>
              <th className="px-6 py-4 text-xs font-medium text-muted uppercase tracking-wide">
                Status
              </th>
              <th className="px-6 py-4 text-xs font-medium text-muted uppercase tracking-wide">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => {
              const isLive = event.status === "live";
              return (
                <tr
                  key={event.id}
                  className={clsx(
                    "border-b border-border last:border-b-0 transition-colors",
                    isLive ? "bg-gold/40" : "hover:bg-cream/40"
                  )}
                >
                  <td className="px-6 py-4 font-semibold text-navy text-sm tabular-nums whitespace-nowrap">
                    {formatTimeRange(event.startTime, event.endTime)}
                  </td>
                  <td className="px-6 py-4 font-semibold text-navy">
                    {event.title}
                  </td>
                  <td className="px-6 py-4 max-w-[260px] text-sm text-muted">
                    {notesPreview(event.specialNotes)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <ScheduleStatusBadge status={event.status} />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="relative inline-flex items-center justify-center">
                      <button
                        type="button"
                        aria-label={`Row actions for ${event.title}`}
                        className="inline-flex w-10 h-10 items-center justify-center text-navy hover:bg-cream rounded-xl transition-colors"
                        onClick={() =>
                          setOpenMenuId((prev) =>
                            prev === event.id ? null : event.id
                          )
                        }
                      >
                        <MoreVertical className="w-5 h-5" strokeWidth={2.25} />
                      </button>

                      {openMenuId === event.id && (
                        <div
                          ref={menuRef}
                          className="absolute right-full mr-2 top-1/2 -translate-y-1/2 z-[80] w-56 bg-white border border-border rounded-2xl p-2 card-shadow"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuId(null);
                              onViewEvent?.(event);
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl text-sm text-navy hover:bg-cream transition-colors"
                          >
                            View details
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuId(null);
                              onEditEvent?.(event);
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl text-sm text-navy hover:bg-cream transition-colors"
                          >
                            Edit details
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuId(null);
                              onDeleteEvent?.(event);
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-colors"
                          >
                            Delete event
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
