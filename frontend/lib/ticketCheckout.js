import { apiRequest } from "@/lib/api";
import { formatTicketQrText } from "@/lib/ticketQr";

/**
 * Reserve selected tickets for 1 hour (pending order).
 */
export async function reserveTicketOrder({
  guestToken,
  selectedTickets = [],
  buyerName,
  buyerContact,
}) {
  const token = String(guestToken || "").trim();
  if (!token) {
    throw new Error("Missing guest invitation token");
  }

  const items = (selectedTickets || [])
    .filter((t) => Number(t.quantity) > 0)
    .map((t) => ({
      tierId: t.id || t.tierId || t.ticketTypeId,
      quantity: Number(t.quantity) || 1,
    }));

  if (!items.length) {
    throw new Error("Select at least one ticket");
  }

  const checkout = await apiRequest(
    `/api/public/invite/${encodeURIComponent(token)}/ticket-checkout`,
    {
      method: "POST",
      body: {
        items,
        buyerName: buyerName || undefined,
        buyerContact: buyerContact || undefined,
      },
    }
  );

  return {
    orderId: checkout?.orderId || checkout?.order?.orderId || null,
    expiresAt: checkout?.expiresAt || checkout?.order?.expiresAt || null,
    amountTotal: checkout?.amountTotal,
    currency: checkout?.currency || "LKR",
    items: checkout?.items || [],
    order: checkout?.order || null,
  };
}

export function mapIssuedTicketsToUi(tickets = [], guestName = "Guest") {
  return (tickets || []).map((t, idx) => {
    const ticketCode = t.ticketCode || t.ticket_code || t.id;
    const tierName = t.tierName || t.typeName || t.name || "Ticket";
    const name = t.guestName || guestName;
    return {
      id: ticketCode || `ticket-${idx + 1}`,
      ticketId: t.ticketId || t.id,
      ticketCode,
      name: tierName,
      typeName: tierName,
      price: t.price,
      currency: t.currency || "LKR",
      guestName: name,
      attendeeName: name,
      qrText:
        t.qrText ||
        formatTicketQrText({
          guestName: name,
          tierName,
          ticketCode,
        }),
      status: t.status || "valid",
    };
  });
}

export function isAttendingRsvp(answers) {
  const status = String(
    answers?.attendingStatus || answers?.status || ""
  ).toLowerCase();
  return (
    status === "attending" ||
    status === "confirmed" ||
    status === "registered" ||
    answers?.attending === true
  );
}
