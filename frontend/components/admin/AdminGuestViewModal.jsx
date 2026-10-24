"use client";

import { X } from "lucide-react";

function TicketStatusBadge({ status }) {
  const s = String(status || "").toLowerCase();
  if (s === "used") {
    return (
      <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA]">
        Used
      </span>
    );
  }
  return (
    <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#DCFCE7] text-[#16A34A] border border-[#86EFAC]">
      Unused
    </span>
  );
}

function Field({ label, children }) {
  return (
    <div className="bg-white rounded-2xl border border-border p-4 sm:p-5">
      <p className="text-sm font-medium text-muted block mb-1">{label}</p>
      <div className="text-navy font-medium text-base break-words">{children}</div>
    </div>
  );
}

export default function AdminGuestViewModal({ open, onClose, guest }) {
  if (!open || !guest) return null;

  const tickets = Array.isArray(guest.tickets) ? guest.tickets : [];
  const showTickets = Boolean(guest.isTicketingEnabled) || guest.ticketCount > 0;

  return (
    <div
      className="fixed inset-0 z-[65] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-guest-view-title"
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
              id="admin-guest-view-title"
              className="font-serif font-bold text-xl text-navy mb-1"
            >
              Guest Details
            </h2>
            <p className="text-sm text-muted capitalize">
              {guest.eventType || "Event"} guest
            </p>
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
          <Field label="Guest Name">{guest.name || "—"}</Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <Field label="Merchant">{guest.organizationName || "—"}</Field>
            <Field label="Event">{guest.eventName || "—"}</Field>
          </div>

          <Field label="Email">{guest.email || "—"}</Field>
          <Field label="Mobile Number">{guest.phone || "—"}</Field>
          <Field label="ID Number">{guest.idNumber || "—"}</Field>

          {showTickets ? (
            <>
              <Field label="Tickets Bought">
                {guest.ticketCount ?? guest.ticketsBought ?? 0}
              </Field>

              <div className="bg-white rounded-2xl border border-border p-4 sm:p-5">
                <p className="text-sm font-medium text-muted block mb-3">
                  Tickets
                </p>
                {tickets.length === 0 ? (
                  <p className="text-muted text-sm">No tickets purchased.</p>
                ) : (
                  <ul className="space-y-3">
                    {tickets.map((ticket, index) => (
                      <li
                        key={ticket.id || index}
                        className="flex items-center justify-between gap-3 rounded-xl border border-border bg-cream/50 px-3.5 py-3"
                      >
                        <div className="min-w-0 text-left">
                          <p className="text-navy font-medium text-sm truncate">
                            {ticket.ticketType || "Ticket"}
                          </p>
                          {ticket.ticketCode ? (
                            <p className="text-xs text-muted mt-0.5 truncate">
                              {ticket.ticketCode}
                            </p>
                          ) : null}
                        </div>
                        <TicketStatusBadge status={ticket.status} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          ) : null}
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
