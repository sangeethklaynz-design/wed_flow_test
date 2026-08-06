"use client";

import { useEffect, useRef, useState } from "react";
import { MoreVertical } from "lucide-react";
import { StatusBadge } from "@/components/guests/GuestCard";

function guestCountDisplay(status, invitedCount, rsvpCount) {
  if (status === "declined") return "0";
  if (status === "pending") return invitedCount ?? "—";
  return rsvpCount ?? invitedCount ?? "—";
}

function guestNotesPreview(notes) {
  if (!notes) return "—";
  const words = notes.trim().split(/\s+/);
  if (words.length <= 4) return notes;
  return `${words.slice(0, 4).join(" ")}...`;
}

export default function GuestTable({
  guests,
  onViewGuest,
  onEditGuest,
  onDeleteGuest,
}) {
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!openMenuId) return;

    const onDocDown = (e) => {
      if (!menuRef.current) return;
      if (menuRef.current.contains(e.target)) return;
      setOpenMenuId(null);
    };

    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, [openMenuId]);

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
        <table className="w-full min-w-[980px] text-center">
          <thead>
            <tr className="border-b border-border bg-cream/60">
              <th className="px-6 py-4 text-xs font-medium text-muted uppercase tracking-wide">
                Guest
              </th>
              <th className="px-6 py-4 text-xs font-medium text-muted uppercase tracking-wide">
                Mobile Number
              </th>
              <th className="px-6 py-4 text-xs font-medium text-muted uppercase tracking-wide">
                Status
              </th>
              <th className="px-6 py-4 text-xs font-medium text-muted uppercase tracking-wide">
                Guest Notes
              </th>
              <th className="px-6 py-4 text-xs font-medium text-muted uppercase tracking-wide">
                Number of guests
              </th>
              <th className="px-6 py-4 text-xs font-medium text-muted uppercase tracking-wide">
                Actions
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
                  <span className="font-semibold text-navy truncate block">
                    {guest.name}
                  </span>
                </td>

                <td className="px-6 py-4 text-sm text-muted whitespace-nowrap">
                  {guest.phone}
                </td>

                <td className="px-6 py-4">
                  <div className="flex justify-center">
                    <StatusBadge status={guest.status} />
                  </div>
                </td>

                <td className="px-6 py-4 max-w-[260px]">
                  <span className="block text-sm text-muted truncate">
                    {guestNotesPreview(guest.guestNotes)}
                  </span>
                </td>

                <td className="px-6 py-4 text-sm text-navy">
                  {guestCountDisplay(
                    guest.status,
                    guest.invitedCount ?? guest.guestCount,
                    guest.rsvpCount
                  )}
                </td>

                <td className="px-6 py-4">
                  <div className="relative inline-flex items-center justify-center">
                    <button
                      type="button"
                      aria-label={`Row actions for ${guest.name}`}
                      className="inline-flex w-10 h-10 items-center justify-center text-navy hover:bg-cream rounded-xl transition-colors"
                      onClick={() =>
                        setOpenMenuId((prev) =>
                          prev === guest.id ? null : guest.id
                        )
                      }
                    >
                      <MoreVertical className="w-5 h-5" strokeWidth={2.25} />
                    </button>

                    {openMenuId === guest.id && (
                      <div
                        ref={menuRef}
                        className="absolute right-full mr-2 top-1/2 -translate-y-1/2 z-[80] w-56 bg-white border border-border rounded-2xl p-2 card-shadow"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenuId(null);
                            onViewGuest?.(guest);
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-sm text-navy hover:bg-cream transition-colors"
                        >
                          View details
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenuId(null);
                            onEditGuest?.(guest);
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-sm text-navy hover:bg-cream transition-colors"
                        >
                          Edit details
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenuId(null);
                            onDeleteGuest?.(guest);
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-colors"
                        >
                          Delete guest
                        </button>
                      </div>
                    )}
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
