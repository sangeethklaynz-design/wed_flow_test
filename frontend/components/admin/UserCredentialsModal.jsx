"use client";

import { useEffect, useState } from "react";
import { Copy, Eye, EyeOff, RefreshCw } from "lucide-react";
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
  const [copiedKey, setCopiedKey] = useState("");

  useEffect(() => {
    if (!open || !event?.id) return;

    let cancelled = false;
    setError("");
    setCopiedKey("");
    setShowPassword(false);
    setEmail(event.clientEmail || event.createdEmail || "");
    setPassword(event.createdPassword || null);
    setNote("Loading saved credentials…");

    (async () => {
      setLoading(true);
      try {
        const data = await apiRequest(
          `/api/admin/events/${encodeURIComponent(event.id)}/credentials`,
          { token: getAccessToken() }
        );
        if (cancelled) return;
        setEmail(data.email || event.clientEmail || "");
        setPassword(
          data.password || event.createdPassword || null
        );
        setNote(
          data.note ||
            (data.password
              ? "Current client login for this event."
              : "No saved password yet. Generate one to create login access.")
        );
        if (data.password || event.createdPassword) {
          setShowPassword(true);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Failed to load credentials");
          setNote("");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, event]);

  if (!open || !event) return null;

  const flashCopied = (key) => {
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(""), 2000);
  };

  const handleRegenerate = async () => {
    setLoading(true);
    setError("");
    setCopiedKey("");
    try {
      const data = await apiRequest(
        `/api/admin/events/${encodeURIComponent(event.id)}/credentials/regenerate`,
        { method: "POST", token: getAccessToken() }
      );
      setEmail(data.email || email);
      setPassword(data.password || null);
      setNote(data.note || "New password generated. Copy it now.");
      setShowPassword(true);
    } catch (err) {
      setError(err.message || "Failed to regenerate password");
    } finally {
      setLoading(false);
    }
  };

  const copyText = async (text, key) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      flashCopied(key);
    } catch {
      setError("Could not copy to clipboard");
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

        {loading && !email && !password ? (
          <p className="text-sm text-muted text-center py-6">Loading credentials…</p>
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-white p-4 space-y-4">
              <p className="text-[11px] font-medium text-muted uppercase tracking-wide">
                Current login
              </p>

              <div>
                <label className="text-xs font-medium text-muted block mb-1">
                  Email
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 px-3 py-2.5 rounded-xl border border-border bg-cream/40 text-navy text-sm break-all">
                    {email || "—"}
                  </div>
                  <button
                    type="button"
                    disabled={loading || !email}
                    onClick={() => copyText(email, "email")}
                    className="shrink-0 px-3 rounded-xl border border-border bg-white text-navy text-xs font-medium disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {copiedKey === "email" ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted block mb-1">
                  Password
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 px-3 py-2.5 rounded-xl border border-border bg-cream/40 text-navy text-sm font-mono break-all min-h-[42px] flex items-center">
                    {password
                      ? showPassword
                        ? password
                        : "••••••••••••"
                      : "No password saved yet"}
                  </div>
                  <button
                    type="button"
                    disabled={loading || !password}
                    onClick={() => setShowPassword((v) => !v)}
                    className="shrink-0 px-3 rounded-xl border border-border bg-white text-navy text-xs font-medium disabled:opacity-50 inline-flex items-center gap-1.5"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    type="button"
                    disabled={loading || !password}
                    onClick={() => copyText(password, "password")}
                    className="shrink-0 px-3 rounded-xl border border-border bg-white text-navy text-xs font-medium disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {copiedKey === "password" ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>

              {note ? (
                <p className="text-[11px] text-muted">{note}</p>
              ) : null}
            </div>

            <button
              type="button"
              disabled={loading || !email || !password}
              onClick={() =>
                copyText(`Email: ${email}\nPassword: ${password}`, "both")
              }
              className="w-full px-4 py-3 rounded-xl border border-border bg-white text-navy text-sm font-medium disabled:opacity-50"
            >
              {copiedKey === "both" ? "Login details copied" : "Copy email & password"}
            </button>

            <button
              type="button"
              disabled={loading || !email}
              onClick={handleRegenerate}
              className="w-full px-4 py-3 rounded-xl bg-navy text-white text-sm font-medium disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              {password ? "Generate new password" : "Generate password"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
