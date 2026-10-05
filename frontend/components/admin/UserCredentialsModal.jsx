"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import ModalCloseButton from "@/components/ui/ModalCloseButton";

export default function UserCredentialsModal({ open, onClose, event }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(null);
  const [note, setNote] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open || !event?.id) return;
    setError("");
    setShowPassword(Boolean(event.createdPassword));
    setCopied(false);
    setPassword(event.createdPassword || null);
    setEmail(event.clientEmail || "");
    setNote(
      event.createdPassword
        ? "Copy this password now if needed."
        : "Loading current credentials…"
    );

    if (event.createdPassword && event.clientEmail) return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await apiRequest(
          `/api/admin/events/${encodeURIComponent(event.id)}/credentials`,
          { token: getAccessToken() }
        );
        if (cancelled) return;
        setEmail(data.email || "");
        setPassword(data.password || null);
        setNote(data.note || "");
        setShowPassword(false);
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load credentials");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, event]);

  if (!open || !event) return null;

  const handleRegenerate = async () => {
    setLoading(true);
    setError("");
    setCopied(false);
    try {
      const data = await apiRequest(
        `/api/admin/events/${encodeURIComponent(event.id)}/credentials/regenerate`,
        { method: "POST", token: getAccessToken() }
      );
      setEmail(data.email || email);
      setPassword(data.password || null);
      setNote(data.note || "New password generated.");
      setShowPassword(true);
    } catch (err) {
      setError(err.message || "Failed to regenerate password");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPassword = async () => {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy password to clipboard");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="credentials-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-navy/40"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div className="relative w-full sm:max-w-md bg-cream sm:rounded-[28px] rounded-t-[28px] p-6 sm:p-8 card-shadow">
        <ModalCloseButton onClick={onClose} />

        <h2
          id="credentials-title"
          className="font-serif font-bold text-xl text-navy mb-2 text-center pr-12"
        >
          User credentials
        </h2>
        <p className="text-sm text-muted text-center mb-6">
          {event.name} · {event.type}
        </p>

        {error ? (
          <div className="mb-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-3 py-2">
            {error}
          </div>
        ) : null}

        {loading && !email ? (
          <p className="text-sm text-muted text-center">Loading…</p>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted block mb-1">
                Email
              </label>
              <div className="px-4 py-3 rounded-xl border border-border bg-white text-navy text-sm break-all">
                {email || "—"}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted block mb-1">
                Password
              </label>
              <div className="px-4 py-3 rounded-xl border border-border bg-white text-navy text-sm font-mono break-all min-h-[48px] flex items-center">
                {password
                  ? showPassword
                    ? password
                    : "••••••••••••"
                  : "No password stored"}
              </div>
              {note ? (
                <p className="text-[11px] text-muted mt-2">{note}</p>
              ) : null}
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              disabled={loading || !password}
              onClick={() => setShowPassword((v) => !v)}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-border bg-white text-navy text-sm font-medium disabled:opacity-50"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" strokeWidth={2.25} />
              ) : (
                <Eye className="w-4 h-4" strokeWidth={2.25} />
              )}
              {showPassword ? "Hide password" : "View password"}
            </button>
            <button
              type="button"
              disabled={loading || !password}
              onClick={handleCopyPassword}
              className="flex-1 px-4 py-3 rounded-xl border border-border bg-white text-navy text-sm font-medium disabled:opacity-50"
            >
              {copied ? "Copied" : "Copy password"}
            </button>
          </div>
          <button
            type="button"
            disabled={loading || !email}
            onClick={handleRegenerate}
            className="w-full px-4 py-3 rounded-xl bg-navy text-white text-sm font-medium disabled:opacity-50"
          >
            Generate new password
          </button>
        </div>
      </div>
    </div>
  );
}
