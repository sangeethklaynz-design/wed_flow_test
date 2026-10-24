"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import {
  formatEventDate,
  formatEventStatus,
  formatEventType,
} from "@/lib/adminEvents";
import ModalCloseButton from "@/components/ui/ModalCloseButton";

export default function ViewEventModal({ open, onClose, event }) {
  const [copied, setCopied] = useState(false);

  if (!open || !event) return null;

  const publicUrl = event.publicInviteUrl || null;
  const rows = [
    { label: "Event name", value: event.name },
    { label: "Type", value: formatEventType(event.type) },
    { label: "Template", value: event.templateKey || "—" },
    { label: "Resource pack", value: event.resourcePackId || "—" },
    { label: "Date", value: formatEventDate(event.eventDate) },
    { label: "Location", value: event.location || "—" },
    {
      label: "Google Maps",
      value: event.googleMapsLink || "—",
      isLink: Boolean(event.googleMapsLink),
    },
    {
      label: "Ticketing",
      value: event.ticketingEnabled || event.isTicketingEnabled ? "Enabled" : "Off",
    },
    {
      label: "Public invite",
      value: event.publicInviteEnabled ? "Enabled" : "Off",
    },
    { label: "Status", value: formatEventStatus(event.status) },
  ];

  const handleCopyPublicLink = async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="view-event-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-navy/40"
        aria-label="Close dialog"
        onClick={onClose}
      />

      <div className="relative w-full sm:max-w-md bg-cream sm:rounded-[28px] rounded-t-[28px] p-6 sm:p-8 card-shadow max-h-[92vh] overflow-y-auto">
        <ModalCloseButton onClick={onClose} />
        <div className="text-center mb-6 pr-12">
          <h2
            id="view-event-title"
            className="font-serif font-bold text-xl text-navy mb-2"
          >
            View Event
          </h2>
          <p className="text-muted text-sm">Catalogue details for this event.</p>
        </div>

        <div className="bg-white rounded-2xl border border-border divide-y divide-border">
          {rows.map((row) => (
            <div key={row.label} className="px-4 py-3">
              <p className="text-[12px] font-medium text-muted uppercase tracking-wide mb-1">
                {row.label}
              </p>
              {row.isLink ? (
                <a
                  href={row.value}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-[#054380] font-medium break-all hover:underline"
                >
                  {row.value}
                </a>
              ) : (
                <p className="text-sm text-navy font-medium break-words">
                  {row.value}
                </p>
              )}
            </div>
          ))}

          {event.publicInviteEnabled && publicUrl ? (
            <div className="px-4 py-3">
              <p className="text-[12px] font-medium text-muted uppercase tracking-wide mb-1">
                Public invite link
              </p>
              <div className="flex items-start gap-2">
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-[#054380] font-medium break-all hover:underline flex-1"
                >
                  {publicUrl}
                </a>
                <button
                  type="button"
                  onClick={handleCopyPublicLink}
                  className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border text-xs font-medium text-navy hover:bg-[#EAF5FF]"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full mt-6 bg-navy text-white font-medium py-3.5 rounded-xl hover:bg-navy/90 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
