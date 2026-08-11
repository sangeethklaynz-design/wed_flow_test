"use client";

import { useState } from "react";
import { Share, XCircle, RotateCcw, Eye, Pencil, Trash2 } from "lucide-react";
import { StatusBadge } from "@/components/guests/GuestCard";
import RowActionsMenu from "@/components/ui/RowActionsMenu";

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
  onShareGuest,
  onCancelRsvp,
  onResendInvite,
}) {
  const [openMenuId, setOpenMenuId] = useState(null);

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
                Request for Change
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

                <td className="px-6 py-4">
                  <div className="flex justify-center">
                    {guest.hasChangeRequest ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                        Yes
                      </span>
                    ) : (
                      <span className="text-sm text-muted">No</span>
                    )}
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
                    <RowActionsMenu
                      id={guest.id}
                      openId={openMenuId}
                      setOpenId={setOpenMenuId}
                      label={`Row actions for ${guest.name}`}
                      items={[
                        {
                          label: "Share",
                          icon: Share,
                          onClick: () => onShareGuest?.(guest),
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
