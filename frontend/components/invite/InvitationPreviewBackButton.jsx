"use client";

import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

/**
 * Exit control for the couple full-screen invitation preview (/invitation).
 * Fixed above the invite shell so it stays visible during video + scroll.
 * Hidden when viewed as a guest token link (/i/[token]) or if guestToken is provided.
 */
export default function InvitationPreviewBackButton({
  href = "/invite",
  label = "Back to invite",
  guestToken = null,
}) {
  const router = useRouter();
  const pathname = usePathname();

  // Only in the guest templates opened as a token: remove the back button
  if (guestToken || pathname?.startsWith("/i/")) {
    return null;
  }

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(href);
    }
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className="fixed top-4 left-4 z-[120] inline-flex items-center gap-2 bg-white/95 backdrop-blur-sm text-navy font-medium text-sm px-3.5 py-2.5 sm:px-4 rounded-xl border border-border card-shadow hover:bg-cream transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#054380]/60"
      aria-label={label}
    >
      <ArrowLeft className="w-4 h-4 shrink-0 text-gold-text" strokeWidth={2.25} />
      <span className="sm:hidden">Back</span>
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
