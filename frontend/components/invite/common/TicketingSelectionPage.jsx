"use client";

import React, { useState, useMemo } from "react";

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
}) {
  const [mounted, setMounted] = useState(false);
  const [persistedBooking, setPersistedBooking] = useState(purchasedBookingData || null);

  React.useEffect(() => {
    setMounted(true);
    if (purchasedBookingData) {
      setPersistedBooking(purchasedBookingData);
      return;
    }
    try {
      const saved =
        localStorage.getItem("wedflow_purchased_tickets") ||
        sessionStorage.getItem("wedflow_purchased_tickets");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.selectedTickets || parsed.individualTickets)) {
          setPersistedBooking(parsed);
        }
      }
    } catch (e) {
      // ignore
    }
  }, [purchasedBookingData]);
  const normalizedTickets = useMemo(() => {
    if (Array.isArray(ticketTypes) && ticketTypes.length > 0) {
      return ticketTypes.map((t, idx) => {
        let badgeColor = "#94A3B8"; // Standard default silver
        const lowerName = String(t.name || "").toLowerCase();
        if (lowerName.includes("vip") || idx === 1) {
          badgeColor = "#F59E0B"; // Gold
        } else if (lowerName.includes("premium") || idx === 2) {
          badgeColor = "#EF4444"; // Red
        } else if (idx > 2) {
          badgeColor = "#3B82F6";
        }
        return {
          id: String(t.id || idx + 1),
          name: t.name || `Ticket Type ${idx + 1}`,
          price: Number(t.price) || 0,
          description:
            t.description ||
            (idx === 0
              ? "General entry to the event"
              : idx === 1
              ? "Priority seating & refreshments"
              : "Exclusive lounge access"),
          color: badgeColor,
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
      },
      {
        id: "vip",
        name: "VIP",
        price: 2000,
        description: "Priority seating & refreshments",
        color: "#F59E0B",
      },
      {
        id: "premium",
        name: "Premium",
        price: 5000,
        description: "Exclusive lounge access",
        color: "#EF4444",
      },
    ];
  }, [ticketTypes]);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [quantities, setQuantities] = useState(() => {
    const initial = {};
    normalizedTickets.forEach((t, idx) => {
      // In Figma Screenshot 1: Standard has 3 tickets selected, VIP has 0, Premium has 0
      initial[t.id] = idx === 0 ? 3 : 0;
    });
    return initial;
  });

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
    const selectedList = [];

    normalizedTickets.forEach((t) => {
      const qty = quantities[t.id] || 0;
      if (qty > 0) {
        sum += t.price * qty;
        count += qty;
        selectedList.push({
          ticket: t,
          qty,
          subtotal: t.price * qty,
        });
      }
    });

    let text = "0 tickets selected";
    if (selectedList.length === 1) {
      const item = selectedList[0];
      text = `LKR ${item.ticket.price.toLocaleString("en-US")} × ${item.qty} ticket${item.qty > 1 ? "s" : ""}`;
    } else if (selectedList.length > 1) {
      text = `${count} tickets selected`;
    }

    return { totalAmount: sum, totalCount: count, breakdownText: text, selectedList };
  }, [normalizedTickets, quantities]);

  const handleProceed = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setErrorMsg("");

    if (!fullName.trim()) {
      setErrorMsg("Please enter your full name.");
      const el = document.getElementById("ticket-guest-fullname");
      if (el) el.focus();
      return;
    }

    if (!email.trim()) {
      setErrorMsg("Please enter your email.");
      const el = document.getElementById("ticket-guest-email");
      if (el) el.focus();
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMsg("Please enter a valid email address.");
      const el = document.getElementById("ticket-guest-email");
      if (el) el.focus();
      return;
    }

    if (totalCount === 0) {
      setErrorMsg("Please select at least 1 ticket to proceed.");
      return;
    }

    const selectedTickets = normalizedTickets
      .filter((t) => (quantities[t.id] || 0) > 0)
      .map((t) => ({
        ...t,
        quantity: quantities[t.id],
        subtotal: t.price * quantities[t.id],
      }));

    if (onProceedToPayment) {
      onProceedToPayment({
        fullName: fullName.trim(),
        email: email.trim(),
        selectedTickets,
        totalAmount,
        totalCount,
        quantities,
      });
    }
  };

  const isParty = theme === "party";

  return (
    <div
      id="ticketing-selection-page"
      className="relative w-[390px] min-h-[844px] flex flex-col items-center justify-between overflow-hidden select-none"
      style={{
        width: 390,
        minHeight: 844,
        background: isParty
          ? "linear-gradient(180deg, #FFFFFF 0%, #FFFFFF 62%, #E2EDFA 82%, #CADFF8 100%)"
          : "linear-gradient(180deg, #E8F3FD 0%, #FFFFFF 28%, #FFFFFF 72%, #E8F3FD 100%)",
      }}
    >
      {/* Page Top Design Image */}
      <div
        className={`absolute top-0 left-0 w-[390px] ${
          isParty ? "h-[205px]" : "h-[162px]"
        } pointer-events-none z-0 overflow-hidden`}
        aria-hidden="true"
      >
        <img
          src={
            isParty
              ? "/assets/events/parties/templates/template-1/chrome/ticketing-page/top-bg.webp"
              : "/assets/events/corporate-events/templates/template-1/chrome/ticketing-page/top-background.webp"
          }
          alt=""
          className={`w-[390px] ${
            isParty ? "h-[205px] object-top" : "h-[162px]"
          } object-cover block`}
          style={{ transform: isParty ? "none" : "rotate(180deg)" }}
          width={390}
          height={isParty ? 205 : 162}
        />
      </div>

      {/* Corporate only: Page Bottom Design Image (Party removes bottom page design per user specification) */}
      {!isParty && (
        <div
          className="absolute bottom-0 left-0 w-[390px] h-[162px] pointer-events-none z-0 overflow-hidden"
          aria-hidden="true"
        >
          <img
            src="/assets/events/corporate-events/templates/template-1/chrome/ticketing-page/bottom-background.webp"
            alt=""
            className="w-[390px] h-[162px] object-cover block"
            style={{ transform: "rotate(0deg)" }}
            width={390}
            height={162}
          />
        </div>
      )}

      {/* Top Left Back Button */}
      <button
        type="button"
        id="ticketing-selection-back-btn"
        onClick={onBack || onScrollNext}
        aria-label="Back"
        className="absolute top-[20px] left-[20px] w-9 h-9 flex items-center justify-center text-[#0A2569] hover:opacity-75 active:scale-95 transition-all cursor-pointer z-20 p-0"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#0A2569"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
      </button>

      {/* Main Content Area */}
      <div
        className={`relative z-10 w-[364px] ${
          isParty ? "pt-[116px]" : "pt-[65px]"
        } pb-12 flex flex-col items-center`}
      >
        {/* Screenshot 5: Text 'Select Your Tickets' (W: 364, H: 32, X: 13, Y: 65, Font: Petrona Bold 28px, Line height: 32px) */}
        <h1
          id="select-your-tickets-heading"
          className="w-[364px] h-[32px] font-petrona font-bold text-[28px] leading-[32px] text-[#0A2569] text-center m-0 p-0 tracking-[-0.01em]"
        >
          Select Your Tickets
        </h1>

        {/* Subtitle */}
        <p className="w-[364px] text-center font-normal text-[13px] leading-[18px] text-[#425C7F] mt-[6px] m-0">
          Choose your ticket type & quantity to continue
        </p>

        {/* Confirmed Tickets Access Banner - viewable anytime after payment */}
        {mounted && (persistedBooking || hasPurchasedTickets) && (
          <div
            id="purchased-tickets-banner"
            className="w-[364px] mt-[14px] bg-[#EEF5FE] border-[1.5px] border-[#080480] rounded-[13px] px-[14px] py-[10px] flex items-center justify-between shadow-[0_2px_8px_rgba(8,4,128,0.12)] animate-in fade-in"
          >
            <div className="flex items-center gap-[10px]">
              <div className="w-[32px] h-[32px] rounded-full bg-[#080480] text-white flex items-center justify-center shrink-0">
                <svg className="w-[17px] h-[17px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div className="flex flex-col text-left">
                <span className="font-bold text-[13px] leading-tight text-[#080480]">
                  Tickets Confirmed
                </span>
                <span className="text-[11px] leading-tight text-[#556987] mt-[2px]">
                  {persistedBooking?.individualTickets?.length || persistedBooking?.totalCount || 1} Ticket(s) Available Anytime
                </span>
              </div>
            </div>

            <button
              type="button"
              id="view-tickets-anytime-btn"
              onClick={() => {
                if (typeof onViewPurchasedTickets === "function") {
                  onViewPurchasedTickets(persistedBooking);
                } else if (typeof window !== "undefined") {
                  window.location.hash = "#ticket";
                }
              }}
              className="h-[32px] px-[12px] bg-[#080480] hover:bg-[#060368] active:scale-95 text-white rounded-[8px] font-jakarta font-bold text-[12px] flex items-center gap-1 shadow-sm transition-all cursor-pointer"
            >
              <span>View Tickets</span>
              <span className="text-[13px]">&rarr;</span>
            </button>
          </div>
        )}

        {/* Inputs Group */}
        <div className="w-[364px] mt-[24px] space-y-[10px]">
          {/* Full Name */}
          <div className="flex flex-col text-left">
            <label
              htmlFor="ticket-guest-fullname"
              className="text-[13px] font-bold text-[#0A2569] mb-[5px] pl-[1px]"
            >
              Full name
            </label>
            <input
              id="ticket-guest-fullname"
              type="text"
              required
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (errorMsg) setErrorMsg("");
              }}
              placeholder="Kavindu Perera"
              className={`w-full h-[44px] px-[14px] bg-white rounded-xl border-[1.5px] ${
                errorMsg && !fullName.trim() ? "border-[#EF4444]" : "border-[#BFDBFE]"
              } text-[#0F172A] text-[14px] font-medium placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#93C5FD]/40 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.02)]`}
            />
          </div>

          {/* Email */}
          <div className="flex flex-col text-left">
            <label
              htmlFor="ticket-guest-email"
              className="text-[13px] font-bold text-[#0A2569] mb-[5px] pl-[1px]"
            >
              Email
            </label>
            <input
              id="ticket-guest-email"
              type="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errorMsg) setErrorMsg("");
              }}
              placeholder="kavindu@gmail.com"
              className={`w-full h-[44px] px-[14px] bg-white rounded-xl border-[1.5px] ${
                errorMsg && !email.trim() ? "border-[#EF4444]" : "border-[#BFDBFE]"
              } text-[#0F172A] text-[14px] font-medium placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#93C5FD]/40 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.02)]`}
            />
          </div>
        </div>

        {/* Ticket Type Cards (Standard, VIP, Premium) */}
        <div className="w-[364px] mt-[22px] flex flex-col gap-[14px]">
          {normalizedTickets.map((t) => {
            const qty = quantities[t.id] || 0;
            return (
              <div
                key={t.id}
                className="w-[364px] min-h-[66px] bg-[#EEF6FE] border-[1.5px] border-[#93C5FD] rounded-[13px] px-[13px] py-[9px] flex items-center justify-between shadow-[0_1px_4px_rgba(147,197,253,0.18)] transition-all hover:border-[#60A5FA]"
              >
                {/* Left: Ticket Icon & Details */}
                <div className="flex items-center gap-[11px] min-w-0 pr-2">
                  <TicketStubIcon color={t.color} />
                  <div className="flex flex-col text-left min-w-0">
                    <span className="font-bold text-[15px] leading-[19px] text-[#0A2569] tracking-[-0.01em]">
                      LKR {t.price.toLocaleString("en-US")}
                    </span>
                    <span className="font-bold text-[13px] leading-[17px] text-[#0A2569]">
                      {t.name}
                    </span>
                    <span className="text-[11px] leading-[15px] text-[#64748B] truncate max-w-[170px]">
                      {t.description}
                    </span>
                  </div>
                </div>

                {/* Right: Quantity Counter [- 3 +] */}
                <div className="w-[104px] h-[34px] bg-[#DBEAFE] rounded-[8px] flex items-center justify-between px-[5px] shrink-0 border border-[#BFDBFE]/60 shadow-inner">
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(t.id, -1)}
                    disabled={qty <= 0}
                    aria-label={`Decrease quantity of ${t.name}`}
                    className="w-[26px] h-[26px] rounded flex items-center justify-center font-bold text-[#0A2569] text-[18px] leading-none hover:bg-white/50 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                  >
                    –
                  </button>
                  <span className="font-bold text-[14px] text-[#0A2569] min-w-[22px] text-center tabular-nums">
                    {qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(t.id, 1)}
                    disabled={qty >= 20}
                    aria-label={`Increase quantity of ${t.name}`}
                    className="w-[26px] h-[26px] rounded flex items-center justify-center font-bold text-[#0A2569] text-[18px] leading-none hover:bg-white/50 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Total Amount Summary */}
        <div className="w-[364px] h-[48px] bg-[#D7E8FC] rounded-[10px] px-[14px] mt-[22px] flex items-center justify-between border border-[#BFDBFE]/70 shadow-sm">
          <div className="flex flex-col text-left">
            <span className="font-bold text-[13px] leading-[16px] text-[#0A2569]">
              Total Amount
            </span>
            <span className="text-[11px] leading-[14px] text-[#4B6282] mt-[1px]">
              {breakdownText}
            </span>
          </div>
          <span className="font-bold text-[16px] leading-none text-[#0A2569] tabular-nums">
            LKR {totalAmount.toLocaleString("en-US")}
          </span>
        </div>

        {/* Validation Error Message */}
        {errorMsg && (
          <div
            id="ticket-error-msg"
            className="w-[364px] mt-3 py-2 px-3 bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-[12px] font-medium rounded-lg text-center animate-in fade-in duration-200"
          >
            {errorMsg}
          </div>
        )}

        {/* Proceed to Payment Button */}
        <button
          type="button"
          id="proceed-to-payment-btn"
          onClick={handleProceed}
          className={`w-[364px] h-[46px] ${
            isParty
              ? "bg-[#080480] hover:bg-[#060366] shadow-[0_4px_14px_rgba(8,4,128,0.3)]"
              : "bg-[#0B156B] hover:bg-[#071052] shadow-[0_4px_14px_rgba(11,21,107,0.3)]"
          } active:scale-[0.98] text-white rounded-xl ${
            errorMsg ? "mt-[16px]" : "mt-[32px]"
          } flex items-center justify-center gap-[9px] font-bold text-[15px] transition-all cursor-pointer`}
        >
          <span>Proceed to Payment</span>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>

        {/* Scroll to Explore Button (matching RSVP pages) */}
        {onScrollNext !== false && (
          <div
            role="button"
            tabIndex={0}
            onClick={(e) => {
              if (typeof onScrollNext === "function") {
                onScrollNext(e);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                if (typeof onScrollNext === "function") {
                  onScrollNext();
                }
              }
            }}
            className="mt-[18px] mb-[10px] flex flex-col items-center justify-between cursor-pointer group mx-auto z-10 select-none"
            style={{ width: "117px", minHeight: "62px" }}
            aria-label="Scroll down to explore"
          >
            <div
              className="w-[40px] h-[40px] rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:translate-y-[3px]"
              style={{
                border: "1.5px solid rgba(8, 4, 128, 0.4)",
                background: "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                color: isParty ? "var(--party-text-title, #080480)" : "var(--corp-text-primary, #080480)",
                boxShadow: "0 4px 16px rgba(0, 0, 0, 0.12), 0 0 10px rgba(8, 4, 128, 0.08)",
                animation: "floatBounce 2.4s ease-in-out infinite",
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M7 10l5 5 5-5" />
              </svg>
            </div>
            <div className="mt-[6px] px-3.5 py-[3px] rounded-full bg-white/95 backdrop-blur-md border border-white/80 shadow-[0_2px_10px_rgba(0,0,0,0.12)] flex items-center justify-center transition-all group-hover:bg-white group-hover:scale-105">
              <span
                className="font-instrument text-[9px] font-bold uppercase transition-colors duration-300 whitespace-nowrap tracking-[0.22em]"
                style={{
                  color: isParty ? "var(--party-text-title, #080480)" : "var(--corp-text-primary, #080480)",
                }}
              >
                {isParty ? "SCROLL  TO  EXPLORE" : "EXPLORE  INVITATION"}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TicketingSelectionPage;
