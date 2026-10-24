import { jsPDF } from 'jspdf';

/**
 * Generates and downloads a clean, beautifully formatted vector PDF for a single ticket.
 */
export const downloadVectorTicketPdf = async (ticket, meta = {}) => {
  const isParty = meta.isParty ?? false;
  const eventName =
    meta.eventName ||
    (isParty ? 'ANNUAL GALA NIGHT 2026' : 'ANNUAL BUSINESS SUMMIT 2026');
  const eventSubtitle =
    meta.eventSubtitle ||
    (isParty
      ? 'CELEBRATION. ELEGANCE. MEMORIES'
      : 'IDEAS TODAY. OPPORTUNITIES TOMORROW');
  const formattedDate = meta.formattedDate || '12 November 2026';
  const formattedTime = meta.formattedTime || '6.00 PM Onwards';
  const venueName = meta.venueName || 'Cinnamon Lakeside';
  const venueCity = meta.venueCity || 'Colombo';
  const attendeeName = ticket.attendeeName || meta.attendeeName || 'Kavindu Perera';
  const paymentReference = meta.paymentReference || ticket.id || 'LN2026-0001';
  const bookingDateTime = meta.bookingDateTime || '21 Oct 2026, 03:14 PM';
  const paymentMethod = meta.paymentMethod || 'Google Pay';
  const ticketId = ticket.id || 'TICKET-001';
  const typeName = ticket.typeName || ticket.name || 'STANDARD';
  const price = Number(ticket.price || 1000).toLocaleString('en-US');
  const seatNo = ticket.seatNo || 'GENERAL ADMISSION';

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [105, 148],
  });

  // Top Header Banner
  doc.setFillColor(3, 18, 53);
  doc.rect(0, 0, 105, 26, 'F');

  // Gold / Cyan Accent Strip
  if (isParty) {
    doc.setFillColor(212, 175, 55); // gold
  } else {
    doc.setFillColor(30, 96, 212); // blue
  }
  doc.rect(0, 26, 105, 1.2, 'F');

  // Branding: Wed Flow
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Wed Flow', 14, 8);
  doc.setFontSize(6);
  doc.setTextColor(190, 215, 250);
  doc.setFont('helvetica', 'normal');
  doc.text('Events. People. Possibilities', 14, 12);

  // Event Name
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(String(eventName).toUpperCase(), 52.5, 18, { align: 'center' });
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(210, 230, 255);
  doc.text(String(eventSubtitle).toUpperCase(), 52.5, 23, { align: 'center' });

  // Ticket ID Badge
  doc.setFillColor(238, 246, 254);
  doc.roundedRect(12, 31, 81, 14, 2, 2, 'F');
  doc.setTextColor(10, 37, 105);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text(`TICKET ID: ${ticketId}`, 52.5, 37.5, { align: 'center' });
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`ATTENDEE: ${attendeeName}`, 52.5, 42, { align: 'center' });

  // Main Ticket Info
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Date & Time: ${formattedDate} | ${formattedTime}`, 14, 52);
  doc.text(`Venue: ${venueName}, ${venueCity}`, 14, 58);
  doc.text(`Category: ${typeName}   |   Qty: 1`, 14, 64);
  doc.text(`Price: LKR ${price}`, 14, 70);
  doc.text(`Seat: ${seatNo}`, 14, 76);

  // Payment Details Box
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(12, 82, 81, 24, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Payment Reference:', 16, 88);
  doc.setTextColor(15, 23, 42);
  doc.text(String(paymentReference), 89, 88, { align: 'right' });

  doc.setTextColor(100, 116, 139);
  doc.text('Booking Date:', 16, 94);
  doc.setTextColor(15, 23, 42);
  doc.text(String(bookingDateTime), 89, 94, { align: 'right' });

  doc.setTextColor(100, 116, 139);
  doc.text('Payment Method:', 16, 100);
  doc.setTextColor(15, 23, 42);
  doc.text(String(paymentMethod), 89, 100, { align: 'right' });

  // Bottom Footer Notice
  doc.setFillColor(153, 27, 27);
  doc.rect(0, 137, 105, 11, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.text(
    'THIS IS AN E-TICKET – Present this ticket at event check-in.',
    52.5,
    143.5,
    { align: 'center' }
  );

  const fileName = `Ticket-${String(ticketId).replace(/\s+/g, '_')}.pdf`;
  doc.save(fileName);
  return true;
};
