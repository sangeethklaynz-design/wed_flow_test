"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, X, UserPlus, UserMinus, RefreshCw, CalendarPlus, CalendarX, Pencil, AlertCircle, CheckCheck } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

const TYPE_CONFIG = {
  guest_added: { icon: UserPlus, bg: "bg-emerald-50", iconColor: "text-emerald-600", border: "border-emerald-200" },
  guest_updated: { icon: Pencil, bg: "bg-blue-50", iconColor: "text-blue-600", border: "border-blue-200" },
  guest_deleted: { icon: UserMinus, bg: "bg-red-50", iconColor: "text-red-600", border: "border-red-200" },
  rsvp_submitted: { icon: UserPlus, bg: "bg-purple-50", iconColor: "text-purple-600", border: "border-purple-200" },
  rsvp_cancelled: { icon: UserMinus, bg: "bg-orange-50", iconColor: "text-orange-600", border: "border-orange-200" },
  invite_resent: { icon: RefreshCw, bg: "bg-sky-50", iconColor: "text-sky-600", border: "border-sky-200" },
  change_request: { icon: AlertCircle, bg: "bg-amber-50", iconColor: "text-amber-600", border: "border-amber-200" },
  schedule_added: { icon: CalendarPlus, bg: "bg-emerald-50", iconColor: "text-emerald-600", border: "border-emerald-200" },
  schedule_updated: { icon: Pencil, bg: "bg-blue-50", iconColor: "text-blue-600", border: "border-blue-200" },
  schedule_deleted: { icon: CalendarX, bg: "bg-red-50", iconColor: "text-red-600", border: "border-red-200" },
};

const DEFAULT_CONFIG = { icon: Bell, bg: "bg-gray-50", iconColor: "text-gray-600", border: "border-gray-200" };

function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationPanel({ open, onClose }) {
  return null;
}

function NotificationDropdown({ open, onClose, onUnreadCountChange }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    try {
      const data = await apiRequest("/api/couple/notifications", { token });
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
      onUnreadCountChange?.(data.unreadCount || 0);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [onUnreadCountChange]);

  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open, fetchNotifications]);

  const handleMarkOneRead = async (id) => {
    const token = getAccessToken();
    if (!token) return;
    try {
      await apiRequest(`/api/couple/notifications/${id}/mark-read`, {
        method: "POST",
        token,
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => {
        const next = Math.max(0, prev - 1);
        onUnreadCountChange?.(next);
        return next;
      });
    } catch {
      // silently fail
    }
  };

  const handleMarkAllRead = async () => {
    const token = getAccessToken();
    if (!token) return;
    try {
      await apiRequest("/api/couple/notifications/mark-read", { method: "POST", token });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      onUnreadCountChange?.(0);
    } catch {
      // silently fail
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[69]" onClick={onClose} />

      {/* Dropdown - right-aligned to bell, below header */}
      <div className="absolute top-full right-0 mt-3 z-[70] w-[500px] bg-cream rounded-2xl card-shadow border border-border max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-serif font-bold text-lg text-navy">Notifications</h2>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs text-[#7732A4] font-medium hover:underline"
              >
                Mark all read
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-navy" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-5 space-y-2">
          {loading && notifications.length === 0 ? (
            <p className="text-sm text-muted text-center py-8">Loading...</p>
          ) : notifications.length === 0 ? (
            <p className="text-sm text-muted text-center py-8">No notifications yet</p>
          ) : (
            notifications.map((notif) => {
              const config = TYPE_CONFIG[notif.type] || DEFAULT_CONFIG;
              const Icon = config.icon;
              return (
                <div
                  key={notif.id}
                  className={`relative flex items-start gap-4 p-4 pb-8 rounded-xl border ${config.border} ${config.bg} ${
                    !notif.isRead ? "ring-1 ring-[#e69e46]/30" : ""
                  }`}
                >
                  <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${config.bg}`}>
                    <Icon className={`w-5 h-5 ${config.iconColor}`} strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0 pr-8">
                    <p className="text-base font-medium text-navy leading-tight">{notif.title}</p>
                    {notif.message && (
                      <p className="text-sm text-muted mt-1 leading-snug">{notif.message}</p>
                    )}
                    <p className="text-xs text-muted/70 mt-1.5">{timeAgo(notif.createdAt)}</p>
                  </div>
                  {!notif.isRead && (
                    <span
                      className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-[#e69e46] unread-blink"
                      aria-label="Unread"
                      title="Unread"
                    />
                  )}
                  {notif.isRead ? (
                    <span
                      className="absolute bottom-2.5 right-3 text-[#53bdeb]"
                      aria-label="Read"
                      title="Read"
                    >
                      <CheckCheck className="w-4 h-4" strokeWidth={2.25} />
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleMarkOneRead(notif.id)}
                      className="absolute bottom-2.5 right-3 text-muted hover:text-[#53bdeb] transition-colors"
                      aria-label="Mark as read"
                      title="Mark as read"
                    >
                      <CheckCheck className="w-4 h-4" strokeWidth={2.25} />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    apiRequest("/api/couple/notifications", { token })
      .then((data) => setUnreadCount(data.unreadCount || 0))
      .catch(() => {});
  }, []);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative text-navy p-2 hover:bg-gray-100 rounded-full transition-colors"
      >
        <Bell className="w-7 h-7" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-[#e69e46] text-white text-[11px] font-bold rounded-full flex items-center justify-center border-2 border-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
      <NotificationDropdown
        open={open}
        onClose={() => setOpen(false)}
        onUnreadCountChange={setUnreadCount}
      />
    </div>
  );
}
