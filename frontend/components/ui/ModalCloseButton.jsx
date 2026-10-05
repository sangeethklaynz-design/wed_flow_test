"use client";

import { X } from "lucide-react";

/** Standard top-right close control for admin / dashboard popups. */
export default function ModalCloseButton({ onClick, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`absolute top-5 right-5 sm:top-6 sm:right-6 z-10 w-11 h-11 rounded-xl border border-border bg-white hover:bg-cream transition-colors flex items-center justify-center text-navy ${className}`}
      aria-label="Close"
    >
      <X className="w-5 h-5" strokeWidth={2.25} />
    </button>
  );
}
