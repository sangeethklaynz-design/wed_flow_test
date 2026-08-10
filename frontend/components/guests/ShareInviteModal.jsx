"use client";

import { useEffect, useMemo, useState } from "react";
import { Mail, Share2, X } from "lucide-react";
import {
  buildGuestInviteShare,
  copyInviteText,
  getEmailShareUrl,
  getFacebookShareUrl,
  getMessengerShareUrl,
  getWhatsAppShareUrl,
} from "@/lib/shareInvite";

function WhatsAppIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="currentColor"
        d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.881 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
      />
    </svg>
  );
}

function MessengerIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="currentColor"
        d="M12 2C6.477 2 2 6.145 2 11.243c0 2.906 1.446 5.502 3.709 7.173V22l3.405-1.87c.909.252 1.871.388 2.886.388 5.523 0 10-4.145 10-9.243C22 6.145 17.523 2 12 2zm1.017 12.443-2.565-2.737-5.012 2.737 5.519-5.875 2.627 2.737 4.957-2.737-5.526 5.875z"
      />
    </svg>
  );
}

function FacebookIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="currentColor"
        d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
      />
    </svg>
  );
}

function ShareChannel({ label, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-2.5 min-w-0 w-full group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e69e46]/50 rounded-xl py-0.5"
    >
      <span className="w-12 h-12 rounded-2xl bg-cream border border-border flex items-center justify-center transition-colors group-hover:bg-gold group-hover:border-[#f3dcc0]">
        {children}
      </span>
      <span className="text-xs font-medium text-muted text-center leading-normal w-full">
        {label}
      </span>
    </button>
  );
}

export default function ShareInviteModal({ open, guest, onClose }) {
  const [copied, setCopied] = useState(false);

  const share = useMemo(
    () => (guest ? buildGuestInviteShare(guest) : null),
    [guest]
  );

  useEffect(() => {
    if (!open) setCopied(false);
  }, [open]);

  if (!open || !guest || !share) return null;

  const handleCopy = async () => {
    const value = share.inviteUrl || share.text;
    const ok = await copyInviteText(value);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  };

  const openShareWindow = (url) => {
    window.open(url, "_blank", "noopener,noreferrer,width=600,height=640");
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-invite-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-navy/40"
        aria-label="Close dialog"
        onClick={onClose}
      />

      <div className="relative w-full sm:max-w-md bg-cream sm:rounded-[28px] rounded-t-[28px] p-6 sm:p-8 card-shadow max-h-[92vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-5 right-5 sm:top-6 sm:right-6 w-9 h-9 rounded-xl text-muted hover:bg-white hover:text-navy transition-colors flex items-center justify-center"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-3 mb-5 sm:mb-6 pr-10">
          <div className="w-10 h-10 rounded-2xl bg-gold text-gold-text flex items-center justify-center border border-[#f3dcc0] shrink-0">
            <Share2 className="w-5 h-5" strokeWidth={2.25} />
          </div>
          <div>
            <h2
              id="share-invite-title"
              className="font-serif font-bold text-xl text-navy mb-1"
            >
              Share invitation
            </h2>
            <p className="text-muted text-sm">
              Send the invite link to{" "}
              <span className="text-navy font-medium">{guest.name}</span>
            </p>
          </div>
        </div>

        {!share.inviteUrl ? (
          <div className="bg-white rounded-2xl border border-border p-4 sm:p-5 text-sm text-muted">
            This guest does not have an invitation link yet. Save the guest
            first, then try sharing again.
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl border border-border p-4 sm:p-5 mb-4">
              <p className="text-sm font-medium text-muted mb-4">
                Share via
              </p>
              <div className="grid grid-cols-4 gap-2 sm:gap-3 place-items-center">
                <ShareChannel
                  label="WhatsApp"
                  onClick={() =>
                    openShareWindow(getWhatsAppShareUrl(share.text))
                  }
                >
                  <WhatsAppIcon className="w-6 h-6 text-[#25D366]" />
                </ShareChannel>

                <ShareChannel
                  label="Messenger"
                  onClick={() =>
                    openShareWindow(getMessengerShareUrl(share.inviteUrl))
                  }
                >
                  <MessengerIcon className="w-6 h-6 text-[#0084FF]" />
                </ShareChannel>

                <ShareChannel
                  label="Facebook"
                  onClick={() =>
                    openShareWindow(getFacebookShareUrl(share.inviteUrl))
                  }
                >
                  <FacebookIcon className="w-6 h-6 text-[#1877F2]" />
                </ShareChannel>

                <ShareChannel
                  label="Email"
                  onClick={() => {
                    window.location.href = getEmailShareUrl(
                      share.subject,
                      share.text
                    );
                  }}
                >
                  <Mail className="w-5 h-5 text-navy" strokeWidth={2} />
                </ShareChannel>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-border p-4 sm:p-5">
              <label
                htmlFor="share-invite-url"
                className="text-sm font-medium text-muted block mb-2"
              >
                Invitation link
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-cream pl-3 pr-1.5 py-1.5">
                <p
                  id="share-invite-url"
                  className="flex-1 min-w-0 text-sm text-navy truncate"
                >
                  {share.inviteUrl}
                </p>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="shrink-0 bg-navy text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-navy/90 transition-colors"
                >
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
