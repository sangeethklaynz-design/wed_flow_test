import { Share } from "lucide-react";
import { StatusBadge } from "@/components/guests/GuestCard";

function guestCountDisplay(status, guestCount) {
  if (status === "pending") return "N/A";
  if (status === "declined") return "0";
  return guestCount ?? "—";
}

export default function GuestTable({ guests, onShare }) {
  if (guests.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-10 card-shadow border border-border text-center">
        <p className="text-muted text-sm">No guests match your search.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl card-shadow border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-center">
          <thead>
            <tr className="border-b border-border bg-cream/60">
              <th className="px-6 py-4 text-xs font-medium text-muted uppercase tracking-wide">
                Guest
              </th>
              <th className="px-6 py-4 text-xs font-medium text-muted uppercase tracking-wide">
                WhatsApp
              </th>
              <th className="px-6 py-4 text-xs font-medium text-muted uppercase tracking-wide">
                Status
              </th>
              <th className="px-6 py-4 text-xs font-medium text-muted uppercase tracking-wide">
                Number of guests
              </th>
              <th className="px-6 py-4 text-xs font-medium text-muted uppercase tracking-wide">
                Share
              </th>
            </tr>
          </thead>
          <tbody>
            {guests.map((guest) => (
              <tr
                key={guest.id}
                className="border-b border-border last:border-b-0 hover:bg-cream/40 transition-colors"
              >
                <td className="px-6 py-4">
                  <span className="font-semibold text-navy">{guest.name}</span>
                </td>
                <td className="px-6 py-4 text-sm text-muted whitespace-nowrap">
                  {guest.phone}
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-center">
                    <StatusBadge status={guest.status} />
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-navy">
                  {guestCountDisplay(guest.status, guest.guestCount)}
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => onShare(guest)}
                      aria-label={`Share invite with ${guest.name}`}
                      className="inline-flex w-10 h-10 items-center justify-center text-navy hover:bg-cream rounded-xl transition-colors"
                    >
                      <Share className="w-5 h-5" strokeWidth={1.75} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
