"use client";

import { X } from "lucide-react";
import { StatusBadge } from "@/components/guests/GuestCard";

function guestCountDisplay(status, invitedCount, rsvpCount) {
  if (status === "pending") return "N/A";
  if (status === "declined") return "0";
  return rsvpCount ?? invitedCount ?? "—";
}

export default function GuestViewModal({ open, onClose, guest }) {
  if (!open || !guest) return null;

  return (
    <div
      className="fixed inset-0 z-[65] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guest-view-title"
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
              id="guest-view-title"
              className="font-serif font-bold text-xl text-navy mb-2"
            >
              Guest Details
            </h2>
            <div className="flex items-center gap-2.5">
              <StatusBadge status={guest.status} />
            </div>
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
            <p className="text-sm font-medium text-muted block mb-1">
              Guest Name
            </p>
            <p className="text-navy font-medium text-base">{guest.name}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <div className="bg-white rounded-2xl border border-border p-4 sm:p-5">
              <p className="text-sm font-medium text-muted block mb-1">
                No. of Invited Guests
              </p>
              <p className="text-navy font-medium text-base">
                {guest.invitedCount ?? guest.guestCount ?? "—"}
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-border p-4 sm:p-5">
              <p className="text-sm font-medium text-muted block mb-1">
                No. of Rsvp guests
              </p>
              <p className="text-navy font-medium text-base">
                {guestCountDisplay(
                  guest.status,
                  guest.invitedCount ?? guest.guestCount,
                  guest.rsvpCount
                )}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-border p-4 sm:p-5">
            <p className="text-sm font-medium text-muted block mb-1">
              Mobile Number
            </p>
            <p className="text-navy font-medium text-lg">{guest.phone}</p>
          </div>

          <div className="bg-white rounded-2xl border border-border p-4 sm:p-5">
            <p className="text-sm font-medium text-muted block mb-1">
              Table no
            </p>
            <p className="text-navy font-medium text-base">
              {guest.tableNumber ? guest.tableNumber : "—"}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-border p-4 sm:p-5">
            <p className="text-sm font-medium text-muted block mb-1">
              Invitation Note
            </p>
            <p className="text-muted text-base leading-relaxed whitespace-pre-wrap break-words">
              {guest.note ? guest.note : "—"}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-border p-4 sm:p-5">
            <p className="text-sm font-medium text-muted block mb-1">
              Guest Notes
            </p>
            <p className="text-muted text-base leading-relaxed whitespace-pre-wrap break-words">
              {guest.guestNotes ? guest.guestNotes : "—"}
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

