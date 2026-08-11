"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

/**
 * Exit control for the couple full-screen invitation preview (/invitation).
 * Fixed above the invite shell so it stays visible during video + scroll.
 */
export default function InvitationPreviewBackButton({
  href = "/invite",
  label = "Back to invite",
}) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push(href)}
      className="fixed top-4 left-4 z-[120] inline-flex items-center gap-2 bg-white/95 backdrop-blur-sm text-navy font-medium text-sm px-3.5 py-2.5 sm:px-4 rounded-xl border border-border card-shadow hover:bg-cream transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e69e46]/60"
      aria-label={label}
    >
      <ArrowLeft className="w-4 h-4 shrink-0 text-gold-text" strokeWidth={2.25} />
      <span className="sm:hidden">Back</span>
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
