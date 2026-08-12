"use client";

import { Info, X } from "lucide-react";

export default function ViewNotificationModal({ open, onClose, notification }) {
  if (!open || !notification) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        className="absolute inset-0 bg-navy/40"
        aria-label="Close dialog"
        onClick={onClose}
      />

      <div className="relative w-full sm:max-w-md bg-cream sm:rounded-[28px] rounded-t-[28px] p-6 sm:p-8 card-shadow max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white text-navy flex items-center justify-center border border-border">
              <Info className="w-5 h-5" strokeWidth={2.25} />
            </div>
            <div>
              <h2 className="font-serif font-bold text-xl text-navy mb-1">
                Notification Details
              </h2>
            </div>
          </div>
          <button
            type="button"
            className="w-8 h-8 rounded-full border border-border bg-white text-muted hover:text-navy flex items-center justify-center transition-colors"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-border p-4 sm:p-5">
            <p className="text-[12px] font-bold text-muted uppercase tracking-wider mb-3">
              Notification Info
            </p>
            <div className="space-y-4">
              <div>
                <p className="text-[13px] font-medium text-muted mb-1">Title</p>
                <p className="text-navy font-medium">{notification.title}</p>
              </div>
              <div>
                <p className="text-[13px] font-medium text-muted mb-1">Message</p>
                <p className="text-navy">{notification.message}</p>
              </div>
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-[13px] font-medium text-muted mb-1">Type</p>
                  <p className="text-navy text-sm">{notification.type}</p>
                </div>
                <div>
                  <p className="text-[13px] font-medium text-muted mb-1">Date</p>
                  <p className="text-navy text-sm">
                    {new Intl.DateTimeFormat('en-US', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    }).format(new Date(notification.createdAt))}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {notification.guest && (
            <div className="bg-white rounded-2xl border border-border p-4 sm:p-5">
              <p className="text-[12px] font-bold text-muted uppercase tracking-wider mb-3">
                Associated Guest
              </p>
              <div className="space-y-4">
                <div>
                  <p className="text-[13px] font-medium text-muted mb-1">Guest Name</p>
                  <p className="text-navy font-medium">{notification.guest.name}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-[13px] font-medium text-muted mb-1">Phone</p>
                    <p className="text-navy text-sm">{notification.guest.phone || "-"}</p>
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-muted mb-1">Status</p>
                    <p className="text-navy text-sm capitalize">{notification.guest.status || "-"}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
