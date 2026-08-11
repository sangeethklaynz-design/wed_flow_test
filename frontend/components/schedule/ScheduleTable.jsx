"use client";

import { useState } from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { ScheduleStatusBadge } from "@/components/schedule/ScheduleEventCard";
import RowActionsMenu from "@/components/ui/RowActionsMenu";
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
                      <RowActionsMenu
                        id={event.id}
                        openId={openMenuId}
                        setOpenId={setOpenMenuId}
                        label={`Row actions for ${event.title}`}
                        items={[
                          {
                            label: "View details",
                            icon: Eye,
                            onClick: () => onViewEvent?.(event),
                          },
                          {
                            label: "Edit details",
                            icon: Pencil,
                            onClick: () => onEditEvent?.(event),
                          },
                          {
                            label: "Delete event",
                            icon: Trash2,
                            destructive: true,
                            onClick: () => onDeleteEvent?.(event),
                          },
                        ]}
                      />
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
