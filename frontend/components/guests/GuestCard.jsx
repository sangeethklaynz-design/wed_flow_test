"use client";

import { useState } from "react";
import {
  Share,
  Pin,
  Eye,
  Pencil,
  Trash2,
  XCircle,
  RotateCcw,
} from "lucide-react";
import clsx from "clsx";
import RowActionsMenu from "@/components/ui/RowActionsMenu";

export const statusStyles = {
  confirmed: "bg-green-50 text-green-700",
  pending: "bg-orange-50 text-orange-600",
  declined: "bg-red-50 text-red-600",
};

export const statusLabels = {
  confirmed: "Confirmed",
  pending: "Pending",
  declined: "Declined",
};

export function StatusBadge({ status }) {
  return (
    <span
      className={clsx(
        "inline-flex text-[11px] font-medium px-2.5 py-1 rounded-full whitespace-nowrap",
        statusStyles[status]
      )}
    >
      {statusLabels[status]}
    </span>
  );
}

export function PartyBadge({ guestCount }) {
  if (!guestCount || guestCount < 2) return null;
  return (
    <span className="inline-flex text-[11px] font-medium px-2.5 py-1 rounded-full bg-gold text-gold-text whitespace-nowrap">
      {guestCount} Guests
    </span>
  );
}

const SHARED_CARD_BG = "bg-neutral-100";

export default function GuestCard({
  guest,
  name,
  phone,
  status,
  guestCount,
  inviteShared = false,
  onShare,
  onTogglePin,
  onViewGuest,
  onEditGuest,
  onDeleteGuest,
  onCancelRsvp,
  onResendInvite,
}) {
  const [openMenuId, setOpenMenuId] = useState(null);

  return (
    <div
      className={clsx(
        "rounded-2xl py-4 card-shadow border border-border flex items-center justify-between gap-4",
        guest.isPinned ? "pl-4 pr-5" : "px-5",
        inviteShared ? SHARED_CARD_BG : "bg-white"
      )}
    >
      <div className="flex items-start gap-3 min-w-0 flex-1">
        {guest.isPinned ? (
          <Pin
            className="w-4 h-4 shrink-0 mt-0.5 text-navy rotate-45"
            strokeWidth={2.25}
            fill="currentColor"
            aria-label="Pinned guest"
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-navy text-base truncate">{name}</h3>
          <p className="text-muted text-sm mt-0.5">{phone}</p>
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <StatusBadge status={status} />
            <PartyBadge guestCount={guestCount} />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={onShare}
          aria-label={`Share invite with ${name}`}
          className="w-10 h-10 flex items-center justify-center text-navy hover:bg-cream rounded-xl transition-colors"
        >
          <Share className="w-5 h-5" strokeWidth={1.75} />
        </button>
        <RowActionsMenu
          id={guest.id}
          openId={openMenuId}
          setOpenId={setOpenMenuId}
          label={`Actions for ${name}`}
          items={[
            {
              label: guest.isPinned ? "Unpin guest" : "Pin guest",
              icon: Pin,
              onClick: () => onTogglePin?.(guest),
            },
            {
              label: "View details",
              icon: Eye,
              onClick: () => onViewGuest?.(guest),
            },
            {
              label: "Edit details",
              icon: Pencil,
              onClick: () => onEditGuest?.(guest),
            },
            {
              label: "Cancel RSVP",
              icon: XCircle,
              destructive: true,
              onClick: () => onCancelRsvp?.(guest),
            },
            {
              label: "Resend E-Invite",
              icon: RotateCcw,
              onClick: () => onResendInvite?.(guest),
            },
            {
              label: "Delete guest",
              icon: Trash2,
              destructive: true,
              onClick: () => onDeleteGuest?.(guest),
            },
          ]}
        />
      </div>
    </div>
  );
}
