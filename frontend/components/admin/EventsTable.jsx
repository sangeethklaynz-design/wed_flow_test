"use client";

import { useState } from "react";
import RowActionsMenu from "@/components/ui/RowActionsMenu";
import {
  formatEventDate,
  formatEventStatus,
  formatEventType,
  openAdminGuestPreview,
} from "@/lib/adminEvents";

export default function EventsTable({
  events,
  onViewEvent,
  onEditEvent,
  onDeleteEvent,
  onTemplateEvent,
  onGuestPreviewEvent,
  onCredentialsEvent,
  emptyMessage = "No events match your search.",
  showActions = true,
}) {
  const [openId, setOpenId] = useState(null);

  const handleGuestPreview = (event) => {
    if (typeof onGuestPreviewEvent === "function") {
      onGuestPreviewEvent(event);
      return;
    }
    void openAdminGuestPreview(event?.id, event);
  };

  if (!events.length) {
    return (
      <div className="bg-white rounded-2xl p-8 card-shadow border border-border text-center">
        <p className="text-muted text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl card-shadow border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-center">
          <thead>
            <tr className="border-b border-border bg-cream/60">
              <th className="px-6 py-4 text-xs font-medium text-muted uppercase tracking-wide text-center">
                Event name
              </th>
              <th className="px-6 py-4 text-xs font-medium text-muted uppercase tracking-wide text-center">
                Type
              </th>
              <th className="px-6 py-4 text-xs font-medium text-muted uppercase tracking-wide text-center">
                Template
              </th>
              <th className="px-6 py-4 text-xs font-medium text-muted uppercase tracking-wide text-center">
                Date
              </th>
              <th className="px-6 py-4 text-xs font-medium text-muted uppercase tracking-wide text-center">
                Location
              </th>
              <th className="px-6 py-4 text-xs font-medium text-muted uppercase tracking-wide text-center">
                Status
              </th>
              {showActions ? (
                <th className="px-6 py-4 text-xs font-medium text-muted uppercase tracking-wide text-center">
                  Actions
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr
                key={event.id}
                className="border-b border-border last:border-0 hover:bg-cream/40"
              >
                <td className="px-6 py-4 font-semibold text-navy text-center">
                  {event.name}
                </td>
                <td className="px-6 py-4 text-sm text-navy text-center">
                  {formatEventType(event.type)}
                </td>
                <td className="px-6 py-4 text-sm text-muted text-center">
                  {event.templateKey}
                </td>
                <td className="px-6 py-4 text-sm text-navy tabular-nums whitespace-nowrap text-center">
                  {formatEventDate(event.eventDate)}
                </td>
                <td className="px-6 py-4 text-sm text-muted max-w-[200px] text-center">
                  {event.location || "—"}
                </td>
                <td className="px-6 py-4 text-center">
                  <span
                    className={
                      event.status === "ongoing"
                        ? "inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-[#EAF5FF] text-[#054380]"
                        : "inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-[#eef0f3] text-muted"
                    }
                  >
                    {formatEventStatus(event.status)}
                  </span>
                </td>
                {showActions ? (
                  <td className="px-6 py-4 text-center">
                    <div className="inline-flex justify-center">
                      <RowActionsMenu
                        id={event.id}
                        openId={openId}
                        setOpenId={setOpenId}
                        label={`Actions for ${event.name}`}
                        items={[
                          onViewEvent
                            ? {
                                label: "View event",
                                onClick: () => onViewEvent(event),
                              }
                            : null,
                          onEditEvent
                            ? {
                                label: "Edit event",
                                onClick: () => onEditEvent(event),
                              }
                            : null,
                          onTemplateEvent
                            ? {
                                label: "Template",
                                onClick: () => onTemplateEvent(event),
                              }
                            : null,
                          {
                            label: "View guest view",
                            onClick: () => handleGuestPreview(event),
                          },
                          onCredentialsEvent
                            ? {
                                label: "User credentials",
                                onClick: () => onCredentialsEvent(event),
                              }
                            : null,
                          onDeleteEvent
                            ? {
                                label: "Delete event",
                                destructive: true,
                                onClick: () => onDeleteEvent(event),
                              }
                            : null,
                        ].filter(Boolean)}
                      />
                    </div>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
