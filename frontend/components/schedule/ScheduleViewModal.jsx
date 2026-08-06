"use client";

import { X } from "lucide-react";
import { ScheduleStatusBadge } from "@/components/schedule/ScheduleEventCard";

function formatTimeRange(startTime, endTime) {
  if (!startTime) return "—";
  if (!endTime) return startTime;
  return `${startTime} - ${endTime}`;
}

export default function ScheduleViewModal({ open, onClose, event }) {
  if (!open || !event) return null;

  return (
    <div
      className="fixed inset-0 z-[65] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="schedule-view-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-navy/40"
        aria-label="Close dialog"
        onClick={onClose}
      />

      <div className="relative w-full sm:max-w-lg bg-cream sm:rounded-[28px] rounded-t-[28px] p-6 sm:p-8 card-shadow max-h-[92vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4 mb-6 sm:mb-7">
          <div className="min-w-0">
            <h2
              id="schedule-view-title"
              className="font-serif font-bold text-xl text-navy mb-2"
            >
              Event Details
            </h2>
            <ScheduleStatusBadge status={event.status} />
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 w-11 h-11 rounded-xl border border-border bg-white hover:bg-cream transition-colors flex items-center justify-center text-navy"
            aria-label="Close"
          >
            <X className="w-5 h-5" strokeWidth={2.25} />
          </button>
        </div>

        <div className="space-y-4 sm:space-y-5">
          <div className="bg-white rounded-2xl border border-border p-4 sm:p-5">
            <p className="text-sm font-medium text-muted block mb-1">Event name</p>
            <p className="text-navy font-medium text-base">{event.title}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <div className="bg-white rounded-2xl border border-border p-4 sm:p-5">
              <p className="text-sm font-medium text-muted block mb-1">
                Starting time
              </p>
              <p className="text-navy font-medium text-base tabular-nums">
                {event.startTime || "—"}
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-border p-4 sm:p-5">
              <p className="text-sm font-medium text-muted block mb-1">
                Ending time
              </p>
              <p className="text-navy font-medium text-base tabular-nums">
                {event.endTime || "—"}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-border p-4 sm:p-5">
            <p className="text-sm font-medium text-muted block mb-1">Time</p>
            <p className="text-navy font-medium text-base tabular-nums">
              {formatTimeRange(event.startTime, event.endTime)}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-border p-4 sm:p-5">
            <p className="text-sm font-medium text-muted block mb-1">
              Special notes
            </p>
            <p className="text-muted text-base leading-relaxed whitespace-pre-wrap break-words">
              {event.specialNotes ? event.specialNotes : "—"}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-border p-4 sm:p-5">
            <p className="text-sm font-medium text-muted block mb-1">
              Notification
            </p>
            <p className="text-navy font-medium text-base">
              {event.notificationEnabled ? "Enabled at start time" : "Disabled"}
            </p>
          </div>
        </div>

        <div className="pt-6">
          <button
            type="button"
            onClick={onClose}
            className="w-full bg-navy text-white font-medium py-3.5 rounded-xl hover:bg-navy/90 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
