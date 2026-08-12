"use client";

import { useEffect, useState } from "react";
import { Edit2, X, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

export default function EditNotificationModal({ open, onClose, notification, onSuccess }) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && notification) {
      setTitle(notification.title || "");
      setMessage(notification.message || "");
      setError("");
    }
  }, [open, notification]);

  if (!open || !notification) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = getAccessToken();
      await apiRequest(`/api/couple/notifications/${notification.id}`, {
        method: "PUT",
        token,
        body: { title: title.trim(), message: message.trim() },
      });

      onSuccess?.();
    } catch (err) {
      setError(err.message || "Failed to update notification");
    } finally {
      setLoading(false);
    }
  };

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
              <Edit2 className="w-5 h-5" strokeWidth={2.25} />
            </div>
            <div>
              <h2 className="font-serif font-bold text-xl text-navy mb-1">
                Edit Notification
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm font-medium border border-red-100">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[13px] font-medium text-navy ml-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white border border-[#eef0f3] rounded-xl px-4 py-3 text-sm text-navy font-medium focus:outline-none focus:border-[#7732A4] transition-colors placeholder:text-muted/50"
              placeholder="e.g. New RSVP received"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[13px] font-medium text-navy ml-1">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-white border border-[#eef0f3] rounded-xl px-4 py-3 text-sm text-navy font-medium focus:outline-none focus:border-[#7732A4] transition-colors placeholder:text-muted/50 resize-none h-28"
              placeholder="Enter notification details..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-[#e8e8e8] text-muted font-medium py-3.5 rounded-xl hover:bg-[#dedede] transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-navy text-white font-medium py-3.5 rounded-xl hover:bg-navy/90 transition-colors inline-flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
