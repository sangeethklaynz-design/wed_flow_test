import { Share } from "lucide-react";
import clsx from "clsx";

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

export default function GuestCard({ name, phone, status, guestCount, onShare }) {
  return (
    <div className="bg-white rounded-2xl px-5 py-4 card-shadow border border-border flex items-center justify-between gap-4">
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold text-navy text-base truncate">{name}</h3>
        <p className="text-muted text-sm mt-0.5">{phone}</p>
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <StatusBadge status={status} />
          <PartyBadge guestCount={guestCount} />
        </div>
      </div>

      <button
        type="button"
        onClick={onShare}
        aria-label={`Share invite with ${name}`}
        className="shrink-0 w-10 h-10 flex items-center justify-center text-navy hover:bg-cream rounded-xl transition-colors"
      >
        <Share className="w-5 h-5" strokeWidth={1.75} />
      </button>
    </div>
  );
}
