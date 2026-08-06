"use client";

import { AlertTriangle, Trash2 } from "lucide-react";

export default function ConfirmDeleteModal({
  open,
  onClose,
  onConfirm,
  guestName,
  title = "Delete Guest",
  itemName,
  description = "This will permanently delete the guest from your list and remove their RSVP details.",
}) {
  const name = itemName ?? guestName;
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-guest-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-navy/40"
        aria-label="Close dialog"
        onClick={onClose}
      />

      <div className="relative w-full sm:max-w-md bg-cream sm:rounded-[28px] rounded-t-[28px] p-6 sm:p-8 card-shadow max-h-[92vh] overflow-y-auto">
        <div className="flex items-start gap-3 mb-5 sm:mb-6">
          <div className="w-10 h-10 rounded-2xl bg-gold text-gold-text flex items-center justify-center border border-[#f3dcc0]">
            <AlertTriangle className="w-5 h-5" strokeWidth={2.25} />
          </div>
          <div>
            <h2
              id="delete-guest-title"
              className="font-serif font-bold text-xl text-navy mb-1"
            >
              {title}
            </h2>
            <p className="text-muted text-sm">
              This action cannot be undone.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border p-4 sm:p-5">
          <p className="text-navy font-medium mb-1">
            You are deleting: <span className="text-navy">{name}</span>
          </p>
          <p className="text-muted text-sm">{description}</p>
        </div>

        <div className="flex gap-3 pt-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-[#e8e8e8] text-muted font-medium py-3.5 rounded-xl hover:bg-[#dedede] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm?.()}
            className="flex-1 bg-navy text-white font-medium py-3.5 rounded-xl hover:bg-navy/90 transition-colors inline-flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" strokeWidth={2.25} />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

