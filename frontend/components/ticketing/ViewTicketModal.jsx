"use client";

import { useEffect } from "react";
import { Ticket, DollarSign, AlignLeft, Layers, Calendar, Pencil } from "lucide-react";
import ModalCloseButton from "@/components/ui/ModalCloseButton";

export default function ViewTicketModal({
  open,
  onClose,
  onEdit,
  ticket = null,
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || !ticket) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity w-full h-full cursor-default"
        onClick={onClose}
        aria-label="Close modal backdrop"
      />

      <div className="relative bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6 sm:p-8 card-shadow border border-border z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EEF5FF] flex items-center justify-center text-[#054380]">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-2xl text-[#054380]">
                {ticket.name}
              </h2>
              <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#EAF5FF] text-[#054380] mt-0.5">
                Ticket Details
              </span>
            </div>
          </div>
          <ModalCloseButton onClick={onClose} />
        </div>

        <div className="space-y-4 py-2 border-y border-border">
          <div className="flex items-start gap-3">
            <DollarSign className="w-4 h-4 text-muted mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-muted uppercase">Price</p>
              <p className="text-lg font-bold text-navy">
                LKR {Number(ticket.price).toLocaleString("en-US")}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <AlignLeft className="w-4 h-4 text-muted mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-muted uppercase">Description</p>
              <p className="text-sm text-navy mt-0.5">
                {ticket.description || "No description provided."}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Layers className="w-4 h-4 text-muted mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-muted uppercase">Available Quantity</p>
              <p className="text-sm font-medium text-navy mt-0.5">
                {ticket.quantity != null ? `${ticket.quantity} tickets` : "Unlimited"}
              </p>
            </div>
          </div>

          {ticket.createdAt ? (
            <div className="flex items-start gap-3">
              <Calendar className="w-4 h-4 text-muted mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-muted uppercase">Created At</p>
                <p className="text-xs text-muted mt-0.5">
                  {new Date(ticket.createdAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex gap-3 pt-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl border border-border text-navy font-medium text-sm hover:bg-cream transition-colors"
          >
            Close
          </button>
          {onEdit ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(ticket);
              }}
              className="flex-1 py-2.5 px-4 rounded-xl bg-[#0B72E7] hover:bg-[#0961C5] text-white font-medium text-sm transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              <Pencil className="w-4 h-4" /> Edit Ticket
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
