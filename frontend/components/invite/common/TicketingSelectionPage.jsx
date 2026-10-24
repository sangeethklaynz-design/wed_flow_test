"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Clock, ArrowRight, Check, ArrowLeft, Download } from "lucide-react";
import { jsPDF } from "jspdf";

function generateIndividualTicketPdf(ticket, index = 0, eventInfo = {}) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [105, 175],
  });

  const isParty = eventInfo.theme === "party";
  const eventName = eventInfo.eventName || (isParty ? "ANNUAL GALA NIGHT 2026" : "ANNUAL BUSINESS SUMMIT 2026");
  const eventSubtitle = eventInfo.eventSubtitle || (isParty ? "CELEBRATION. ELEGANCE. MEMORIES" : "IDEAS TODAY. OPPORTUNITIES TOMORROW");
  const eventDate = eventInfo.eventDate || "Thursday, 12 November 2026";
  const eventTime = eventInfo.eventTime || "6:00 PM Onwards";
  const venue = eventInfo.venue || "Cinnamon Lakeside Colombo";
  const attendeeName = ticket.attendeeName || eventInfo.attendeeName || "Kavindu Perera";
  const ticketId = ticket.id || `TKT-2026-${String(index + 1).padStart(3, "0")}`;
  const category = (ticket.typeName || ticket.name || "STANDARD").toUpperCase().replace(/\s*TICKET\s*/i, "").trim();
  const price = Number(ticket.price || 1000).toLocaleString("en-US");

  // 1. Top Header Banner (Deep Blue #021235)
  doc.setFillColor(2, 18, 53);
  doc.rect(0, 0, 105, 34, "F");

  // Wed Flow Branding
  doc.setTextColor(56, 189, 248);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Wed Flow", 52.5, 9, { align: "center" });

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.text("Events. People. Possibilities", 52.5, 13, { align: "center" });

  // Event Name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(eventName.toUpperCase(), 52.5, 22, { align: "center" });

  // Subtitle
  doc.setTextColor(203, 213, 225);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.text(eventSubtitle.toUpperCase(), 52.5, 28, { align: "center" });

  // 2. Body Background & Ticket Container
  doc.setFillColor(248, 250, 252);
  doc.rect(0, 34, 105, 141, "F");

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.roundedRect(8, 38, 89, 106, 3, 3, "FD");

  // Category Badge
  doc.setFillColor(234, 243, 254);
  doc.roundedRect(12, 42, 81, 10, 2, 2, "F");
  doc.setTextColor(8, 4, 128);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text(`${category} TICKET`, 52.5, 48.5, { align: "center" });

  // Attendee & Ticket ID
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(attendeeName, 52.5, 59, { align: "center" });

  doc.setTextColor(8, 4, 128);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text(`TICKET NO: ${ticketId}`, 52.5, 65, { align: "center" });

  // Dashed Cut Line
  doc.setDrawColor(203, 213, 225);
  doc.setLineDashPattern([2, 1.5], 0);
  doc.line(12, 70, 93, 70);
  doc.setLineDashPattern([], 0);

  // Event Details Grid
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text("DATE & TIME", 14, 76);
  doc.text("VENUE", 14, 88);
  doc.text("PRICE", 14, 100);
  doc.text("SEAT", 56, 100);

  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text(`${eventDate}`, 14, 81);
  doc.text(`${eventTime}`, 14, 85);
  doc.text(venue, 14, 93);
  doc.text(`LKR ${price}`, 14, 105);
  doc.text(ticket.seatNo || "GENERAL ADMISSION", 56, 105);

  // QR Code Area
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, 110, 77, 28, 2, 2, "F");
  doc.setTextColor(8, 4, 128);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("SCAN FOR EVENT ENTRY", 52.5, 117, { align: "center" });
  doc.setTextColor(100, 116, 139);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.text("Valid for one admission • Present at entrance gate", 52.5, 123, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(8, 4, 128);
  doc.text(`[ QR CODE: ${ticketId} ]`, 52.5, 131, { align: "center" });

  // 3. Bottom Terms & Footer
  doc.setFillColor(2, 18, 53);
  doc.rect(0, 148, 105, 27, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.text("IMPORTANT EVENT GUIDELINES", 52.5, 153, { align: "center" });

  doc.setTextColor(203, 213, 225);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.5);
  doc.text("• Please present this e-ticket on your mobile device or printed at check-in.", 52.5, 158, { align: "center" });
  doc.text("• Non-transferable & non-refundable. Organizers reserve right of admission.", 52.5, 162, { align: "center" });

  doc.setTextColor(148, 163, 184);
  doc.setFontSize(5);
  doc.text("Wed Flow © 2026 • Events. People. Possibilities", 52.5, 168, { align: "center" });

  return doc;
}

function TicketStubIcon({ color = "#94A3B8" }) {
  return (
    <svg
      width="34"
      height="24"
      viewBox="0 0 36 26"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3 2C1.34315 2 0 3.34315 0 5V9.5C2.20914 9.5 4 11.067 4 13C4 14.933 2.20914 16.5 0 16.5V21C0 22.6569 1.34315 24 3 24H33C34.6569 24 36 22.6569 36 21V16.5C33.7909 16.5 32 14.933 32 13C32 11.067 33.7909 9.5 36 9.5V5C36 3.34315 34.6569 2 33 2H3ZM16 7C15.4477 7 15 7.44772 15 8V10C15 10.5523 15.4477 11 16 11H20C20.5523 11 21 10.5523 21 10V8C21 7.44772 20.5523 7 20 7H16ZM15 15C15 14.4477 15.4477 14 16 14H20C20.5523 14 21 14.4477 21 15V17C21 17.5523 20.5523 18 20 18H16C15.4477 18 15 17.5523 15 17V15Z"
        fill={color}
      />
    </svg>
  );
}

export function TicketingSelectionPage({
  ticketTypes = [],
  onProceedToPayment,
  defaultName = "Kavindu Perera",
  defaultEmail = "kavindu@gmail.com",
  eventData = null,
  onScrollNext,
  onBack,
  theme = "corporate",
  purchasedBookingData = null,
  onViewPurchasedTickets = null,
  hasPurchasedTickets = false,
  initialReservedCount = 1,
}) {
  const normalizedTickets = useMemo(() => {
    if (Array.isArray(ticketTypes) && ticketTypes.length > 0) {
      return ticketTypes.map((t, idx) => {
        let badgeColor = "#94A3B8";
        let defaultStock = "850 left";
        const lowerName = String(t.name || "").toLowerCase();
        if (lowerName.includes("vip") || idx === 1) {
          badgeColor = "#F59E0B";
          defaultStock = "120 left";
        } else if (lowerName.includes("premium") || idx === 2) {
          badgeColor = "#EF4444";
          defaultStock = "50 left";
        } else if (idx > 2) {
          badgeColor = "#3B82F6";
          defaultStock = "100 left";
        }
        return {
          id: String(t.id || idx + 1),
          name: t.name || `Ticket Type ${idx + 1}`,
          price: Number(t.price) || (idx === 0 ? 1000 : idx === 1 ? 2000 : 5000),
          description:
            t.description ||
            (idx === 0
              ? "General entry to the event"
              : idx === 1
              ? "Priority seating & refreshments"
              : "Exclusive lounge access"),
          color: badgeColor,
          stockLeft: t.stockLeft || defaultStock,
        };
      });
    }
    return [
      {
        id: "standard",
        name: "Standard",
        price: 1000,
        description: "General entry to the event",
        color: "#94A3B8",
        stockLeft: "850 left",
      },
      {
        id: "vip",
        name: "VIP",
        price: 2000,
        description: "Priority seating & refreshments",
        color: "#F59E0B",
        stockLeft: "120 left",
      },
      {
        id: "premium",
        name: "Premium",
        price: 5000,
        description: "Exclusive lounge access",
        color: "#EF4444",
        stockLeft: "50 left",
      },
    ];
  }, [ticketTypes]);

  // Initial quantities: matching Screenshot 1 where 3 Standard tickets are selected, VIP has 0, Premium has 0
  const [quantities, setQuantities] = useState(() => {
    const initial = {};
    normalizedTickets.forEach((t, idx) => {
      initial[t.id] = idx === 0 ? 3 : 0;
    });
    return initial;
  });

  // 1-Hour Real Countdown Timer
  const [timeLeft, setTimeLeft] = useState(() => {
    return {
      hours: 1,
      minutes: 0,
      seconds: 0,
    };
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 0, minutes: 0, seconds: 0 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleQuantityChange = (id, delta) => {
    setQuantities((prev) => {
      const current = prev[id] || 0;
      const next = Math.max(0, Math.min(20, current + delta));
      return { ...prev, [id]: next };
    });
  };

  const { totalAmount, totalCount, breakdownText } = useMemo(() => {
    let sum = 0;
    let count = 0;
    normalizedTickets.forEach((t) => {
      const qty = quantities[t.id] || 0;
      if (qty > 0) {
        sum += t.price * qty;
        count += qty;
      }
    });

    const standardTicket = normalizedTickets[0];
    const unitPrice = standardTicket ? standardTicket.price : 1000;
    const text = `LKR ${unitPrice.toLocaleString("en-US")} × ${count} ticket${count === 1 ? "" : "s"}`;

    return { totalAmount: sum, totalCount: count, breakdownText: text };
  }, [normalizedTickets, quantities]);

  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const getTicketsToDownload = () => {
    if (purchasedBookingData?.individualTickets && purchasedBookingData.individualTickets.length > 0) {
      return purchasedBookingData.individualTickets;
    }

    const selected = [];
    let counter = 1;
    const bookingRef = purchasedBookingData?.bookingRef || "LN2026-0001";

    normalizedTickets.forEach((t) => {
      const qty = quantities[t.id] || 0;
      for (let i = 0; i < qty; i++) {
        selected.push({
          id: `${bookingRef}-${counter++}`,
          name: t.name,
          typeName: t.name.toUpperCase(),
          price: t.price,
          quantity: 1,
          seatNo: "GENERAL ADMISSION",
          attendeeName: defaultName || "Kavindu Perera",
        });
      }
    });

    if (selected.length === 0) {
      const first = normalizedTickets[0] || { name: "Standard", price: 1000 };
      selected.push({
        id: `${bookingRef}-1`,
        name: first.name,
        typeName: first.name.toUpperCase(),
        price: first.price,
        quantity: 1,
        seatNo: "GENERAL ADMISSION",
        attendeeName: defaultName || "Kavindu Perera",
      });
    }

    return selected;
  };

  const handleDownloadAllTickets = async () => {
    if (isDownloadingAll) return;
    setIsDownloadingAll(true);
    setToastMessage("Generating separate PDFs for each ticket...");

    try {
      const tickets = getTicketsToDownload();
      for (let i = 0; i < tickets.length; i++) {
        const ticket = tickets[i];
        const doc = generateIndividualTicketPdf(ticket, i, {
          theme,
          eventName:
            eventData?.eventName ||
            (theme === "party"
              ? "Annual Gala Night 2026"
              : "Annual Business Summit 2026"),
          eventSubtitle:
            eventData?.eventSubtitle ||
            (theme === "party"
              ? "CELEBRATION. ELEGANCE. MEMORIES"
              : "IDEAS TODAY. OPPORTUNITIES TOMORROW"),
          eventDate: eventData?.eventDate || "Thursday, 12 November 2026",
          eventTime: eventData?.eventTime || "6:00 PM Onwards",
          venue: eventData?.venue || "Cinnamon Lakeside Colombo",
          attendeeName:
            ticket.attendeeName ||
            defaultName ||
            purchasedBookingData?.fullName ||
            "Kavindu Perera",
        });

        const safeId = String(ticket.id || `TKT-${i + 1}`).replace(/\s+/g, "_");
        doc.save(`Ticket-${safeId}.pdf`);

        if (i < tickets.length - 1) {
          await new Promise((r) => setTimeout(r, 450));
        }
      }
      setToastMessage(`Downloaded ${tickets.length} ticket${tickets.length > 1 ? "s" : ""} as separate PDFs!`);
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error("Error downloading tickets:", err);
      setToastMessage("Failed to download tickets. Please try again.");
      setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setIsDownloadingAll(false);
    }
  };

  const handleProceed = (e) => {
    if (e && e.preventDefault) e.preventDefault();

    const selectedTickets = normalizedTickets
      .filter((t) => (quantities[t.id] || 0) > 0)
      .map((t) => ({
        ...t,
        quantity: quantities[t.id],
        subtotal: t.price * quantities[t.id],
      }));

    if (onProceedToPayment) {
      onProceedToPayment({
        fullName: defaultName,
        email: defaultEmail,
        selectedTickets: selectedTickets.length
          ? selectedTickets
          : [
              {
                ...normalizedTickets[0],
                quantity: 1,
                subtotal: normalizedTickets[0].price,
              },
            ],
        totalAmount: totalAmount || (normalizedTickets[0]?.price ?? 1000),
        totalCount: totalCount || 1,
        quantities,
      });
    }
  };

  return (
    <div
      id="ticketing-selection-page"
      className="relative w-[390px] min-h-[844px] flex flex-col items-center overflow-x-hidden overflow-y-auto select-none px-4 pt-3.5 pb-8"
      style={{
        width: 390,
        minHeight: 844,
        background:
          "linear-gradient(180deg, #FFFFFF 0%, #FFFFFF 30%, #F0F6FE 70%, #DCEAFC 100%)",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Top Back Navigation to return to previous page (RSVP) */}
      <div className="w-full flex items-center justify-between mb-2.5 px-0.5">
        <button
          type="button"
          id="ticketing-back-btn"
          onClick={() => {
            if (typeof onBack === "function") {
              onBack();
            } else if (typeof onScrollNext === "function") {
              onScrollNext();
            }
          }}
          aria-label="Back to previous page"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-[#F1F6FE] border border-[#CBD5E1] text-[#080480] text-[12px] font-bold shadow-xs transition-all cursor-pointer active:scale-95"
        >
          <ArrowLeft className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Back</span>
        </button>
        <span className="text-[11px] font-medium text-[#64748B]">
          Ticketing Selection
        </span>
      </div>
      {/* 1. Header Card (Matching Screenshot 1) */}
      <div className="relative w-full rounded-[18px] border-2 border-[#0070F3] bg-[#EAF3FE] overflow-hidden pt-7 pb-8 px-4 flex flex-col items-center text-center shadow-sm">
        {/* Soft Wave Decor in Background */}
        <div
          className="absolute inset-0 pointer-events-none opacity-85"
          style={{
            backgroundImage:
              "radial-gradient(circle at 50% -20%, #BFE0FD 0%, transparent 70%), linear-gradient(180deg, #EAF3FE 0%, #D5EAFD 100%)",
          }}
        />

        <div className="relative z-10 flex flex-col items-center">
          <h1
            className="font-serif font-bold text-[24px] leading-[30px] text-[#080480] tracking-[-0.01em] m-0"
            style={{ fontFamily: "'Playfair Display', 'Petrona', 'Georgia', serif" }}
          >
            Select Your Tickets
          </h1>
          <p className="font-sans font-medium text-[11.5px] leading-[16px] text-[#334155] mt-1.5 m-0">
            Choose your ticket type &amp; quantity to continue
          </p>
        </div>
      </div>

      {/* 2. Overlapping Center Checkmark & RSVP Confirmed Text */}
      <div className="relative z-20 flex flex-col items-center -mt-5 mb-3">
        <div className="w-[42px] h-[42px] rounded-full bg-[#0070F3] border-[3px] border-white shadow-md flex items-center justify-center text-white">
          <Check className="w-5 h-5 stroke-[3]" />
        </div>
        <h2 className="font-sans font-bold text-[18px] leading-tight text-[#16A34A] mt-2 tracking-normal m-0">
          Your RSVP is confirmed!
        </h2>
      </div>

      {/* 3. 24-Hour Reservation & Timer Card (Matching Screenshot 1) */}
      <div className="w-full rounded-[18px] bg-[#E8F2FD] border border-[#CDE3FD] p-4 flex flex-col items-center text-center shadow-[0_2px_8px_rgba(11,114,231,0.06)] mb-4">
        {/* Clock Icon Badge */}
        <div className="w-[44px] h-[44px] rounded-full bg-[#D4E8FC] flex items-center justify-center mb-2.5 text-[#0070F3]">
          <Clock className="w-6 h-6 stroke-[2.2]" />
        </div>

        {/* Heading */}
        <h3 className="font-sans font-bold text-[15.5px] leading-[20px] text-[#080480] m-0 tracking-[-0.01em]">
          Complete Your Payment
          <br />
          Within 1 Hour
        </h3>

        {/* Description */}
        <p className="font-sans text-[11px] leading-[15px] text-[#475569] mt-2 mb-3 max-w-[270px]">
          1 ticket has been reserved for you for 1 hour. You can purchase it below or add more tickets.
        </p>

        {/* Live Countdown Timer Blocks: [ 23 Hours ] : [ 59 Minutes ] : [ 45 Seconds ] */}
        <div className="flex items-center justify-center gap-2">
          {/* Hours */}
          <div className="w-[58px] py-1.5 bg-[#DEEDFD] rounded-[10px] border border-[#BEDCFD] flex flex-col items-center">
            <span className="font-sans font-extrabold text-[19px] leading-none text-[#080480] tabular-nums">
              {String(timeLeft.hours).padStart(2, "0")}
            </span>
            <span className="font-sans text-[9px] font-medium text-[#64748B] mt-1">
              Hours
            </span>
          </div>

          <span className="font-sans font-bold text-[18px] text-[#080480] pb-2">:</span>

          {/* Minutes */}
          <div className="w-[58px] py-1.5 bg-[#DEEDFD] rounded-[10px] border border-[#BEDCFD] flex flex-col items-center">
            <span className="font-sans font-extrabold text-[19px] leading-none text-[#080480] tabular-nums">
              {String(timeLeft.minutes).padStart(2, "0")}
            </span>
            <span className="font-sans text-[9px] font-medium text-[#64748B] mt-1">
              Minutes
            </span>
          </div>

          <span className="font-sans font-bold text-[18px] text-[#080480] pb-2">:</span>

          {/* Seconds */}
          <div className="w-[58px] py-1.5 bg-[#DEEDFD] rounded-[10px] border border-[#BEDCFD] flex flex-col items-center">
            <span className="font-sans font-extrabold text-[19px] leading-none text-[#080480] tabular-nums">
              {String(timeLeft.seconds).padStart(2, "0")}
            </span>
            <span className="font-sans text-[9px] font-medium text-[#64748B] mt-1">
              Seconds
            </span>
          </div>
        </div>
      </div>

      {/* 4. Available Tickets Section (Matching Screenshot 1) */}
      <div className="w-full flex flex-col mb-4">
        <h4 className="font-sans font-bold text-[13px] leading-tight text-[#080480] mb-2 pl-0.5">
          Available Tickets
        </h4>

        <div className="flex flex-col gap-2.5">
          {normalizedTickets.map((t) => {
            const qty = quantities[t.id] || 0;
            return (
              <div
                key={t.id}
                className="w-full bg-[#F4F9FF] border border-[#A5CDFA] rounded-[12px] p-3 flex flex-col gap-1 shadow-sm transition-all hover:border-[#60A5FA]"
              >
                <div className="flex items-center justify-between">
                  {/* Left: Icon & Details */}
                  <div className="flex items-center gap-2.5 min-w-0 pr-1">
                    <TicketStubIcon color={t.color} />
                    <div className="flex flex-col text-left min-w-0">
                      <span className="font-sans font-extrabold text-[14px] leading-tight text-[#080480]">
                        LKR {t.price.toLocaleString("en-US")}
                      </span>
                      <span className="font-sans font-bold text-[12px] leading-tight text-[#1E293B]">
                        {t.name}
                      </span>
                      <span className="font-sans text-[10px] leading-tight text-[#94A3B8] truncate max-w-[155px]">
                        {t.description}
                      </span>
                    </div>
                  </div>

                  {/* Right: Quantity Counter [- 3 +] */}
                  <div className="flex flex-col items-end">
                    <div className="w-[96px] h-[32px] bg-[#D7E8FD] rounded-[8px] flex items-center justify-between px-1.5 border border-[#BFDBFE]">
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(t.id, -1)}
                        disabled={qty <= 0}
                        aria-label={`Decrease ${t.name}`}
                        className="w-[24px] h-[24px] rounded flex items-center justify-center font-bold text-[#080480] text-[16px] leading-none hover:bg-white/40 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                      >
                        –
                      </button>
                      <span className="font-sans font-bold text-[13px] text-[#080480] min-w-[20px] text-center tabular-nums">
                        {qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(t.id, 1)}
                        disabled={qty >= 20}
                        aria-label={`Increase ${t.name}`}
                        className="w-[24px] h-[24px] rounded flex items-center justify-center font-bold text-[#080480] text-[16px] leading-none hover:bg-white/40 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                      >
                        +
                      </button>
                    </div>

                    {/* Stock Remaining */}
                    <span className="font-sans text-[10px] font-semibold text-[#DC2626] mt-1 mr-0.5">
                      {t.stockLeft}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Order Summary Section (Matching Screenshot 1) */}
      <div className="w-full flex flex-col mb-4">
        <h4 className="font-sans font-bold text-[13px] leading-tight text-[#080480] mb-2 pl-0.5">
          Order Summary
        </h4>

        {/* List of each ticket type summary card */}
        <div className="flex flex-col gap-2">
          {normalizedTickets.map((t) => {
            const qty = quantities[t.id] || 0;
            const subtotal = t.price * qty;
            return (
              <div
                key={t.id}
                className="w-full bg-white border border-[#E2E8F0] rounded-[10px] px-3.5 py-2.5 flex items-center justify-between shadow-[0_1px_3px_rgba(0,0,0,0.03)]"
              >
                <span className="font-sans font-bold text-[12.5px] text-[#080480]">
                  {t.name} x {qty}
                </span>
                <span className="font-sans font-bold text-[13px] text-[#080480]">
                  LKR {subtotal.toLocaleString("en-US")}
                </span>
              </div>
            );
          })}

          {/* Total Amount Card */}
          <div className="w-full bg-[#CCE2FD] border border-[#B5D5FA] rounded-[10px] px-3.5 py-2.5 flex items-center justify-between shadow-sm mt-0.5">
            <div className="flex flex-col text-left">
              <span className="font-sans font-bold text-[12.5px] text-[#080480] leading-tight">
                Total Amount
              </span>
              <span className="font-sans text-[10.5px] text-[#64748B] mt-0.5 leading-tight">
                {breakdownText}
              </span>
            </div>
            <span className="font-sans font-extrabold text-[15px] text-[#080480]">
              LKR {totalAmount.toLocaleString("en-US")}
            </span>
          </div>
        </div>
      </div>

      {/* 6. Proceed to Payment Button (Matching Screenshot 1) */}
      <button
        type="button"
        id="proceed-to-payment-btn"
        onClick={handleProceed}
        className="w-full h-[46px] rounded-[12px] bg-[#080480] hover:bg-[#060368] active:scale-[0.99] font-sans font-bold text-[14.5px] text-white flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_14px_rgba(8,4,128,0.25)] transition-all duration-150 mt-1"
      >
        <span>Proceed to Payment</span>
        <ArrowRight className="w-4 h-4 stroke-[2.5]" />
      </button>

      {/* Download All Tickets Button (Separate PDFs) */}
      <button
        type="button"
        id="download-all-tickets-btn"
        disabled={isDownloadingAll}
        onClick={handleDownloadAllTickets}
        className="w-full h-[46px] rounded-[12px] bg-white hover:bg-[#F8FAFC] active:scale-[0.99] border-2 border-[#080480] font-sans font-bold text-[14.5px] text-[#080480] flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all duration-150 mt-2.5 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <Download className="w-4 h-4 stroke-[2.2]" />
        <span>
          {isDownloadingAll ? "Downloading Separate PDFs..." : "Download All Tickets"}
        </span>
      </button>

      {/* Optional Confirmed Tickets quick access */}
      {hasPurchasedTickets && (
        <button
          type="button"
          onClick={() => {
            if (typeof onViewPurchasedTickets === "function") {
              onViewPurchasedTickets(purchasedBookingData);
            }
          }}
          className="mt-3 text-[11px] font-bold text-[#080480] underline cursor-pointer"
        >
          View Already Purchased Tickets
        </button>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#080480] text-white text-xs font-semibold py-2 px-4 rounded-full shadow-lg z-50 animate-in fade-in slide-in-from-bottom-2 whitespace-nowrap"
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}

export default TicketingSelectionPage;
