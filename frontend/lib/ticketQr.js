/**
 * Plain-text QR payload shown by phone cameras / QR readers.
 */
export function formatTicketQrText({ guestName, tierName, ticketCode }) {
  return [
    `Guest: ${String(guestName || "Guest").trim() || "Guest"}`,
    `Ticket type: ${String(tierName || "Ticket").trim() || "Ticket"}`,
    `Ticket ID: ${String(ticketCode || "").trim()}`,
  ].join("\n");
}

export function parseTicketIdFromScan(raw) {
  const text = String(raw || "").trim();
  if (!text) return "";
  const idLine = text.match(/Ticket\s*ID\s*:\s*(.+)/i);
  if (idLine?.[1]) return String(idLine[1]).trim();
  return text;
}
