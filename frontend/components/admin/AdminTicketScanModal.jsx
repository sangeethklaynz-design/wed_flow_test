"use client";

import { useEffect, useState } from "react";
import ModalCloseButton from "@/components/ui/ModalCloseButton";
import { apiRequest } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

export default function AdminTicketScanModal({
  open,
  onClose,
  eventId: initialEventId = "",
  initialScan = "",
  events = [],
  onScanned,
}) {
  const [eventId, setEventId] = useState(initialEventId || "");
  const [scanInput, setScanInput] = useState(initialScan || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (open) {
      setEventId(initialEventId || "");
      setScanInput(initialScan || "");
      setError("");
      setResult(null);
    }
  }, [open, initialEventId, initialScan]);

  if (!open) return null;

  const handleClose = () => {
    setScanInput("");
    setError("");
    setResult(null);
    setLoading(false);
    onClose?.();
  };

  const handleScan = async (e) => {
    e?.preventDefault?.();
    setError("");
    setResult(null);
    const token = getAccessToken();
    const eid = String(eventId || initialEventId || "").trim();
    const payload = String(scanInput || "").trim();
    if (!token) {
      setError("Not signed in");
      return;
    }
    if (!eid) {
      setError("Select an event to scan against");
      return;
    }
    if (!payload) {
      setError("Paste the QR text or Ticket ID");
      return;
    }

    setLoading(true);
    try {
      const data = await apiRequest(
        `/api/admin/events/${encodeURIComponent(eid)}/tickets/scan`,
        {
          method: "POST",
          token,
          body: { scan: payload, qrText: payload, ticketCode: payload },
        }
      );
      setResult({
        ok: true,
        guestName: data.guestName,
        ticketType: data.ticketType,
        ticketId: data.ticketId || data.ticketCode,
        message: "Ticket validated and invalidated for entry",
      });
      setScanInput("");
      onScanned?.(data);
    } catch (err) {
      const d = err?.data || {};
      const already =
        err?.status === 409 ||
        String(err?.message || "").toLowerCase().includes("already invalid");
      if (already && (d.guestName || d.ticketId || d.ticketCode)) {
        setResult({
          ok: false,
          guestName: d.guestName,
          ticketType: d.ticketType,
          ticketId: d.ticketId || d.ticketCode,
          message: err.message || "Ticket already used",
        });
      } else {
        setError(err?.message || "Scan failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ticket-scan-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-navy/40"
        aria-label="Close dialog"
        onClick={handleClose}
      />

      <div className="relative w-full sm:max-w-md bg-cream sm:rounded-[28px] rounded-t-[28px] p-6 sm:p-8 card-shadow max-h-[92vh] overflow-y-auto">
        <ModalCloseButton onClick={handleClose} />
        <div className="mb-6 pr-12">
          <h2
            id="ticket-scan-title"
            className="font-serif font-bold text-xl text-navy mb-2"
          >
            Scan ticket
          </h2>
          <p className="text-muted text-sm">
            Paste plain-text QR content or a Ticket ID. Matching tickets are
            invalidated on success.
          </p>
        </div>

        <form onSubmit={handleScan} className="space-y-4">
          {events.length > 0 ? (
            <div>
              <label className="block text-sm font-medium text-muted mb-1.5">
                Event
              </label>
              <select
                value={eventId || initialEventId}
                onChange={(e) => setEventId(e.target.value)}
                className="w-full h-[42px] px-3 rounded-xl border border-border bg-white text-sm text-navy"
              >
                <option value="">Select event…</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.name}
                    {ev.organizationName ? ` · ${ev.organizationName}` : ""}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div>
            <label className="block text-sm font-medium text-muted mb-1.5">
              QR text / Ticket ID
            </label>
            <textarea
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              rows={4}
              placeholder={"Guest: Jane Doe\nTicket type: VIP\nTicket ID: tkt_…"}
              className="w-full px-3.5 py-3 rounded-xl border border-border bg-white text-sm text-navy font-mono resize-y min-h-[100px] focus:outline-none focus:ring-2 focus:ring-[#054380]/50"
            />
          </div>

          {error ? (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-3.5 py-2.5">
              {error}
            </div>
          ) : null}

          {result ? (
            <div
              className={`rounded-xl border px-3.5 py-3 text-sm ${
                result.ok
                  ? "bg-green-50 border-green-100 text-green-800"
                  : "bg-amber-50 border-amber-100 text-amber-900"
              }`}
            >
              <p className="font-semibold mb-2">{result.message}</p>
              <dl className="space-y-1 text-[13px]">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Guest</dt>
                  <dd className="font-medium text-navy">{result.guestName || "—"}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Ticket type</dt>
                  <dd className="font-medium text-navy">
                    {result.ticketType || "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Ticket ID</dt>
                  <dd className="font-medium text-navy break-all text-right">
                    {result.ticketId || "—"}
                  </dd>
                </div>
              </dl>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-navy text-white font-medium py-3.5 rounded-xl hover:bg-navy/90 transition-colors disabled:opacity-60"
          >
            {loading ? "Scanning…" : "Validate & invalidate"}
          </button>
        </form>
      </div>
    </div>
  );
}
