"use client";

import ModalCloseButton from "@/components/ui/ModalCloseButton";

function formatCurrency(amount, currency = "LKR") {
  return `${currency} ${Number(amount || 0).toLocaleString("en-US")}`;
}

function formatDateTime(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return String(value);
  }
}

function DetailRow({ label, value }) {
  return (
    <div className="bg-white rounded-2xl border border-border p-4 sm:p-5">
      <p className="text-sm font-medium text-muted block mb-1">{label}</p>
      <p className="text-navy font-medium text-base break-all">{value ?? "—"}</p>
    </div>
  );
}

export default function AdminFinanceDetailModal({ open, onClose, ticket }) {
  if (!open || !ticket) return null;

  return (
    <div
      className="fixed inset-0 z-[65] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="finance-detail-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-navy/40"
        aria-label="Close dialog"
        onClick={onClose}
      />

      <div className="relative w-full sm:max-w-lg bg-cream sm:rounded-[28px] rounded-t-[28px] p-6 sm:p-8 card-shadow max-h-[92vh] overflow-y-auto">
        <ModalCloseButton onClick={onClose} />
        <div className="mb-6 sm:mb-7 pr-12">
          <h2
            id="finance-detail-title"
            className="font-serif font-bold text-xl text-navy mb-2"
          >
            Transaction Details
          </h2>
          <p className="text-muted text-sm">
            Payment and ticket information for this sale
          </p>
        </div>

        <div className="space-y-4 sm:space-y-5">
          <DetailRow label="Guest / Buyer" value={ticket.buyerName} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <DetailRow label="Merchant" value={ticket.organizationName} />
            <DetailRow label="Event" value={ticket.eventName} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <DetailRow label="Ticket type" value={ticket.tierName} />
            <DetailRow
              label="Amount"
              value={formatCurrency(ticket.price, ticket.currency)}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <DetailRow
              label="Payment status"
              value={String(ticket.paymentStatus || "—").toUpperCase()}
            />
            <DetailRow
              label="Ticket status"
              value={
                String(ticket.ticketStatus || "").toLowerCase() === "invalid"
                  ? "Used"
                  : String(ticket.ticketStatus || "—")
              }
            />
          </div>
          <DetailRow label="Ticket code" value={ticket.ticketCode} />
          <DetailRow label="Order ID" value={ticket.orderId} />
          <DetailRow label="Payment reference" value={ticket.paymentRef} />
          <DetailRow
            label="Stripe session ID"
            value={ticket.stripeCheckoutSessionId}
          />
          <DetailRow label="Payment provider" value={ticket.paymentProvider} />
          <DetailRow label="Buyer contact" value={ticket.buyerContact} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <DetailRow
              label="Order created"
              value={formatDateTime(ticket.orderCreatedAt)}
            />
            <DetailRow
              label="Ticket issued"
              value={formatDateTime(ticket.issuedAt)}
            />
          </div>
          {ticket.invalidatedAt ? (
            <DetailRow
              label="Scanned / invalidated at"
              value={formatDateTime(ticket.invalidatedAt)}
            />
          ) : null}
        </div>

        <div className="pt-6">
          <button
            type="button"
            onClick={onClose}
            className="w-full bg-navy text-white font-medium py-3.5 rounded-xl hover:bg-navy/90 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
