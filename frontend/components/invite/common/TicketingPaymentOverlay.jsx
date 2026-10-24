"use client";

import React, { useState } from "react";

export function TicketingPaymentOverlay({
  isOpen,
  onClose,
  onBack,
  onEditAttendee,
  onPaySuccess,
  onUpdateBookingData,
  bookingData = {},
  eventMeta = {},
  theme = "corporate",
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const isParty = theme === "party";

  const {
    fullName: rawFullName = "Kavindu Perera",
    selectedTickets = [],
    totalAmount = 3000,
    totalCount = 3,
  } = bookingData;

  const initialFirstName =
    bookingData?.firstName ||
    (rawFullName ? rawFullName.trim().split(/\s+/)[0] : "Kavindu") ||
    "Kavindu";
  const initialLastName =
    bookingData?.lastName ||
    (rawFullName && rawFullName.trim().split(/\s+/).length > 1
      ? rawFullName.trim().split(/\s+/).slice(1).join(" ")
      : "Perera") ||
    "Perera";
  const initialEmail =
    bookingData?.email ||
    bookingData?.emailAddress ||
    "kavindu@gmail.com";
  const initialMobile =
    bookingData?.mobileNumber ||
    bookingData?.phone ||
    bookingData?.whatsappNumber ||
    "+94 77 123 4567";
  const initialNic =
    bookingData?.nic ||
    bookingData?.nicNumber ||
    "199012345678";

  const [attendee, setAttendee] = useState({
    firstName: initialFirstName,
    lastName: initialLastName,
    email: initialEmail,
    mobileNumber: initialMobile,
    nic: initialNic,
  });

  const [draftAttendee, setDraftAttendee] = useState({
    firstName: initialFirstName,
    lastName: initialLastName,
    email: initialEmail,
    mobileNumber: initialMobile,
    nic: initialNic,
  });

  React.useEffect(() => {
    if (bookingData) {
      const bRawName = bookingData.fullName || "";
      const bFirst =
        bookingData.firstName ||
        (bRawName ? bRawName.trim().split(/\s+/)[0] : "") ||
        "Kavindu";
      const bLast =
        bookingData.lastName ||
        (bRawName && bRawName.trim().split(/\s+/).length > 1
          ? bRawName.trim().split(/\s+/).slice(1).join(" ")
          : "") ||
        "Perera";
      const bEmail =
        bookingData.email ||
        bookingData.emailAddress ||
        "kavindu@gmail.com";
      const bPhone =
        bookingData.mobileNumber ||
        bookingData.phone ||
        bookingData.whatsappNumber ||
        "+94 77 123 4567";
      const bNic =
        bookingData.nic ||
        bookingData.nicNumber ||
        "199012345678";

      setAttendee((prev) => ({
        firstName: bookingData.firstName || prev.firstName || bFirst,
        lastName: bookingData.lastName || prev.lastName || bLast,
        email: bookingData.email || bookingData.emailAddress || prev.email || bEmail,
        mobileNumber: bookingData.mobileNumber || bookingData.phone || bookingData.whatsappNumber || prev.mobileNumber || bPhone,
        nic: bookingData.nic || bookingData.nicNumber || prev.nic || bNic,
      }));
    }
  }, [
    bookingData?.firstName,
    bookingData?.lastName,
    bookingData?.fullName,
    bookingData?.email,
    bookingData?.emailAddress,
    bookingData?.mobileNumber,
    bookingData?.phone,
    bookingData?.whatsappNumber,
    bookingData?.nic,
    bookingData?.nicNumber,
  ]);

  const handleOpenEditModal = () => {
    setDraftAttendee({ ...attendee });
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
  };

  const handleDraftChange = (field, value) => {
    setDraftAttendee((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveAttendee = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const updated = {
      firstName: (draftAttendee.firstName ?? "").trim() || attendee.firstName,
      lastName: (draftAttendee.lastName ?? "").trim() || attendee.lastName,
      email: (draftAttendee.email ?? "").trim() || attendee.email,
      mobileNumber: (draftAttendee.mobileNumber ?? "").trim() || attendee.mobileNumber,
      nic: (draftAttendee.nic ?? "").trim() || attendee.nic,
    };
    const fullName = `${updated.firstName} ${updated.lastName}`.trim();
    setAttendee(updated);
    setIsEditModalOpen(false);

    const updatedBooking = {
      ...bookingData,
      ...updated,
      fullName,
      emailAddress: updated.email,
      phone: updated.mobileNumber,
      nicNumber: updated.nic,
    };

    if (typeof onUpdateBookingData === "function") {
      onUpdateBookingData(updatedBooking);
    }
  };

  const eventName =
    eventMeta.eventName ||
    (isParty ? "Annual Gala Night 2026" : "Annual Business Summit 2026");
  const eventDateTime =
    eventMeta.eventDateTime && !eventMeta.eventDateTime.includes("undefined")
      ? eventMeta.eventDateTime
      : "Thu, 12 Nov 2026 | 6:00 PM";
  const eventVenue = eventMeta.eventVenue || "Cinnamon Lakeside Colombo";

  const ticketsToDisplay =
    Array.isArray(selectedTickets) && selectedTickets.length > 0
      ? selectedTickets.filter((t) => Number(t.quantity) > 0)
      : [
          {
            name: "Standard",
            price: 1000,
            quantity: totalCount || 3,
          },
        ];

  const handlePay = () => {
    setIsProcessing(true);
    const fullName = `${attendee.firstName} ${attendee.lastName}`.trim();
    const updatedBooking = {
      ...bookingData,
      ...attendee,
      fullName,
      emailAddress: attendee.email,
      phone: attendee.mobileNumber,
      nicNumber: attendee.nic,
    };
    if (typeof onUpdateBookingData === "function") {
      onUpdateBookingData(updatedBooking);
    }
    setTimeout(() => {
      setIsProcessing(false);
      if (onPaySuccess) {
        onPaySuccess(updatedBooking);
      }
    }, 600);
  };

  if (!isOpen) return null;

  return (
    <div
      id="ticketing-payment-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Ticketing Payment"
      className="absolute top-0 left-0 w-[390px] h-[844px] overflow-hidden z-[105] shadow-card select-none animate-in fade-in zoom-in-95 duration-200"
      style={{
        width: 390,
        height: 844,
        background:
          "linear-gradient(180deg, #F0F7FE 0%, #FFFFFF 35%, #FFFFFF 65%, #F0F7FE 100%)",
      }}
    >
      {/* Top Header & Content Area */}
      <div className="relative z-20 w-[390px] h-[844px] flex flex-col px-5 pt-7 pb-6 overflow-y-auto no-scrollbar">
        <div>
          {/* Back Arrow Button */}
          <button
            type="button"
            id="payment-back-btn"
            onClick={onBack || onClose}
            aria-label="Back to ticket selection"
            className="w-8 h-8 flex items-center justify-center text-[#0A2569] hover:opacity-70 active:scale-90 transition-all cursor-pointer p-0"
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

          {/* Heading & Subtitle */}
          <div className="text-center mt-1">
            <h1 className="font-petrona font-bold text-[28px] leading-[32px] text-[#0A2569] m-0 tracking-[-0.01em]">
              Payment
            </h1>
            <p className="font-sans text-[12.5px] leading-[17px] text-[#425C7F] mt-1.5 m-0 px-4 max-w-[280px] mx-auto">
              Choose the payment method to complete your ticket booking.
            </p>
          </div>

          {/* Attendee Details Card */}
          <div className="w-full bg-[#EFF6FE] border-[1.5px] border-[#D0E2FB] rounded-[14px] p-4 mt-4 shadow-[0_1px_4px_rgba(191,219,254,0.25)]">
            <div className="flex items-center justify-between pb-2.5 border-b border-[#D0E2FB]/70">
              <span className="font-bold text-[14px] text-[#0A2569]">
                Attendee Details
              </span>
              <button
                type="button"
                id="edit-attendee-btn"
                onClick={handleOpenEditModal}
                className="text-[12.5px] font-semibold text-[#2563EB] underline hover:text-[#1D4ED8] cursor-pointer"
              >
                Edit
              </button>
            </div>

            <div className="space-y-2 pt-3 text-[12px]">
              <div className="flex justify-between items-center">
                <span className="text-[#64748B]">First Name</span>
                <span className="font-semibold text-[#0A2569] text-right" id="display-attendee-firstname">
                  {attendee.firstName}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#64748B]">Last Name</span>
                <span className="font-semibold text-[#0A2569] text-right" id="display-attendee-lastname">
                  {attendee.lastName}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#64748B]">Email Address</span>
                <span className="font-semibold text-[#0A2569] text-right" id="display-attendee-email">
                  {attendee.email}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#64748B]">Mobile Number</span>
                <span className="font-semibold text-[#0A2569] text-right" id="display-attendee-mobile">
                  {attendee.mobileNumber}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#64748B]">NIC</span>
                <span className="font-semibold text-[#0A2569] text-right" id="display-attendee-nic">
                  {attendee.nic}
                </span>
              </div>
            </div>
          </div>

          {/* Order Summary Card (Matching Screenshot 1) */}
          <div className="w-full bg-[#EFF6FE] border-[1.5px] border-[#D0E2FB] rounded-[14px] p-4 mt-3 shadow-[0_1px_4px_rgba(191,219,254,0.25)]">
            <div className="flex items-center justify-between pb-2.5 border-b border-[#D0E2FB]/70">
              <span className="font-bold text-[14px] text-[#0A2569]">
                Order Summary
              </span>
              <button
                type="button"
                id="edit-order-btn"
                onClick={onBack || onClose}
                className="text-[12.5px] font-semibold text-[#2563EB] underline hover:text-[#1D4ED8] cursor-pointer"
              >
                Edit
              </button>
            </div>

            <div className="space-y-2 pt-3 text-[12px]">
              <div className="flex justify-between items-start">
                <span className="text-[#64748B]">Event</span>
                <span className="font-semibold text-[#0A2569] text-right max-w-[200px] truncate">
                  {eventName}
                </span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-[#64748B]">Date &amp; Time</span>
                <span className="font-medium text-[#0A2569] text-right">
                  {eventDateTime}
                </span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-[#64748B]">Venue</span>
                <span className="font-medium text-[#0A2569] text-right max-w-[200px] break-words text-[11.5px] leading-tight">
                  {eventVenue}
                </span>
              </div>

              {/* Each Selected Ticket Type & Quantity */}
              {ticketsToDisplay.map((t, idx) => (
                <React.Fragment key={t.id || t.name || idx}>
                  <div className="flex justify-between items-start">
                    <span className="text-[#64748B]">Ticket Type</span>
                    <span className="font-medium text-[#0A2569] text-right max-w-[190px]">
                      {t.name} (LKR {Number(t.price).toLocaleString("en-US")})
                    </span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-[#64748B]">Number of Tickets</span>
                    <span className="font-semibold text-[#0A2569]">
                      {t.quantity}
                    </span>
                  </div>
                </React.Fragment>
              ))}
            </div>

            <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#D0E2FB]/80">
              <span className="font-bold text-[13.5px] text-[#0A2569]">
                Total Amount
              </span>
              <span className="font-bold text-[15px] text-[#0A2569] tabular-nums">
                LKR {Number(totalAmount).toLocaleString("en-US")}
              </span>
            </div>
          </div>
        </div>

        {/* Middle/Bottom Payment Action */}
        <div className="w-full flex flex-col items-center mt-5">
          {/* Google Pay Button */}
          <button
            type="button"
            id="gpay-pay-btn"
            onClick={handlePay}
            disabled={isProcessing}
            className="w-full h-[52px] bg-[#EEF6FE] border border-[#BFDBFE] rounded-[14px] flex items-center px-4 shadow-sm hover:border-[#60A5FA] active:scale-[0.99] transition-all cursor-pointer"
          >
            {/* G Pay Logo */}
            <div className="flex items-center shrink-0">
              <svg width="42" height="20" viewBox="0 0 42 20" fill="none">
                <path
                  d="M19.38 9.99c0-.44-.04-.87-.11-1.28H10.15v2.42h5.18c-.22 1.2-1.07 2.22-2.3 2.87v2.38h3.72c2.18-2 3.44-4.96 3.44-6.39z"
                  fill="#4285F4"
                />
                <path
                  d="M10.15 19.38c2.61 0 4.81-.86 6.42-2.34l-3.72-2.38c-.87.58-1.98.93-3.23.93-2.48 0-4.59-1.68-5.34-3.93H.44v2.46c1.6 3.17 4.88 5.26 8.71 5.26z"
                  fill="#34A853"
                />
                <path
                  d="M4.81 11.66c-.19-.58-.3-1.2-.3-1.84 0-.64.11-1.26.3-1.84V5.52H.44A9.684 9.684 0 000 9.82c0 1.57.38 3.06 1.05 4.39l3.76-2.55z"
                  fill="#FBBC05"
                />
                <path
                  d="M10.15 4.4c1.42 0 2.7.49 3.7 1.45l2.77-2.77C14.95 1.55 12.75.7 10.15.7 6.32.7 3.04 2.79 1.44 5.96l3.76 2.55c.75-2.25 2.86-3.93 5.34-3.93z"
                  fill="#EA4335"
                />
                <text
                  x="22"
                  y="14"
                  fill="#5F6368"
                  fontSize="12"
                  fontWeight="600"
                  fontFamily="sans-serif"
                >
                  Pay
                </text>
              </svg>
            </div>

            {/* Vertical Divider */}
            <div className="h-[28px] w-[1px] bg-[#BFDBFE] ml-3.5 mr-4 shrink-0" />

            {/* Right: Pay Amount + Arrow */}
            <div className="flex items-center justify-between flex-1 text-[#0A2569] font-bold text-[14.5px]">
              <span>
                {isProcessing
                  ? "Processing..."
                  : `Pay LKR ${Number(totalAmount).toLocaleString("en-US")}`}
              </span>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#0A2569"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </div>
          </button>

          {/* Powered by Google Pay */}
          <div className="flex items-center justify-center gap-2.5 w-full mt-3">
            <div className="h-[1px] w-[50px] bg-[#CBD5E1]" />
            <span className="text-[11.5px] text-[#64748B] font-medium">
              Powered by Google Pay
            </span>
            <div className="h-[1px] w-[50px] bg-[#CBD5E1]" />
          </div>

          {/* Secure Encryption Note */}
          <div className="flex items-center gap-2 text-[11.5px] text-[#64748B] mt-2">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#64748B"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>Your payment information is secure and encrypted.</span>
          </div>
        </div>
      </div>

      {/* BOTTOM PAGE DESIGN */}
      {isParty ? (
        /* Screenshot 2: Party Template Bottom Foliage Image (Rotated 180°) */
        <div
          className="absolute bottom-0 left-0 w-[390px] h-[205px] pointer-events-none z-10 overflow-hidden"
          aria-hidden="true"
        >
          <img
            src="/assets/events/parties/templates/template-1/chrome/ticketing-page/bottom-bg.webp"
            alt=""
            className="w-[390px] h-[205px] object-cover object-top block"
            style={{ transform: "rotate(180deg)" }}
            width={390}
            height={205}
          />
        </div>
      ) : (
        /* Screenshot 1: Corporate Template Bottom Waves + Green Plant */
        <div
          className="absolute bottom-0 left-0 w-[390px] h-[260px] pointer-events-none z-10 overflow-hidden"
          aria-hidden="true"
        >
          {/* Blue Wave at bottom */}
          <img
            src="/assets/events/corporate-events/templates/template-1/chrome/ticketing-page/bottom-background.webp"
            alt=""
            className="absolute bottom-0 left-0 w-[390px] h-[162px] object-cover block z-[1]"
            width={390}
            height={162}
          />
          {/* Green Plant on right side */}
          <img
            src="/assets/events/corporate-events/templates/template-1/chrome/ticketing-page/bottom-leaves.webp"
            alt=""
            className="absolute bottom-0 right-0 w-[185px] h-[255px] object-contain object-bottom-right block z-[2]"
            width={185}
            height={255}
          />
        </div>
      )}

      {/* Edit Attendee Details Modal Popup */}
      {isEditModalOpen && (
        <div
          id="edit-attendee-modal-backdrop"
          className="absolute inset-0 bg-[#020A24]/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-attendee-modal-title"
        >
          <div
            id="edit-attendee-modal"
            className="w-full max-w-[340px] bg-white rounded-[20px] shadow-[0_20px_50px_rgba(2,18,43,0.35)] border border-[#CBD5E1] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[#E2E8F0]">
              <h2
                id="edit-attendee-modal-title"
                className="font-petrona font-bold text-[18px] leading-tight text-[#0A2569] m-0"
              >
                Edit Attendee Details
              </h2>
              <button
                type="button"
                id="close-attendee-modal-btn"
                onClick={handleCloseEditModal}
                aria-label="Close"
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-100 text-[#64748B] hover:text-[#0A2569] transition-colors cursor-pointer"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveAttendee} className="px-5 py-4 space-y-3">
              {/* 1. First Name */}
              <div>
                <label
                  htmlFor="attendee-first-name-input"
                  className="block text-[11.5px] font-semibold text-[#475569] mb-1"
                >
                  First Name
                </label>
                <input
                  type="text"
                  id="attendee-first-name-input"
                  value={draftAttendee.firstName}
                  onChange={(e) => handleDraftChange("firstName", e.target.value)}
                  placeholder="First Name"
                  className="w-full h-[38px] px-3 rounded-[10px] bg-[#F8FAFC] border border-[#CBD5E1] text-[13px] text-[#0A2569] placeholder-[#94A3B8] focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition-all font-medium"
                />
              </div>

              {/* 2. Last Name */}
              <div>
                <label
                  htmlFor="attendee-last-name-input"
                  className="block text-[11.5px] font-semibold text-[#475569] mb-1"
                >
                  Last Name
                </label>
                <input
                  type="text"
                  id="attendee-last-name-input"
                  value={draftAttendee.lastName}
                  onChange={(e) => handleDraftChange("lastName", e.target.value)}
                  placeholder="Last Name"
                  className="w-full h-[38px] px-3 rounded-[10px] bg-[#F8FAFC] border border-[#CBD5E1] text-[13px] text-[#0A2569] placeholder-[#94A3B8] focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition-all font-medium"
                />
              </div>

              {/* 3. Email Address */}
              <div>
                <label
                  htmlFor="attendee-email-input"
                  className="block text-[11.5px] font-semibold text-[#475569] mb-1"
                >
                  Email Address
                </label>
                <input
                  type="email"
                  id="attendee-email-input"
                  value={draftAttendee.email}
                  onChange={(e) => handleDraftChange("email", e.target.value)}
                  placeholder="Email Address"
                  className="w-full h-[38px] px-3 rounded-[10px] bg-[#F8FAFC] border border-[#CBD5E1] text-[13px] text-[#0A2569] placeholder-[#94A3B8] focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition-all font-medium"
                />
              </div>

              {/* 4. Mobile Number */}
              <div>
                <label
                  htmlFor="attendee-mobile-input"
                  className="block text-[11.5px] font-semibold text-[#475569] mb-1"
                >
                  Mobile Number
                </label>
                <input
                  type="tel"
                  id="attendee-mobile-input"
                  value={draftAttendee.mobileNumber}
                  onChange={(e) => handleDraftChange("mobileNumber", e.target.value)}
                  placeholder="+94 77 123 4567"
                  className="w-full h-[38px] px-3 rounded-[10px] bg-[#F8FAFC] border border-[#CBD5E1] text-[13px] text-[#0A2569] placeholder-[#94A3B8] focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition-all font-medium"
                />
              </div>

              {/* 5. NIC */}
              <div>
                <label
                  htmlFor="attendee-nic-input"
                  className="block text-[11.5px] font-semibold text-[#475569] mb-1"
                >
                  NIC
                </label>
                <input
                  type="text"
                  id="attendee-nic-input"
                  value={draftAttendee.nic}
                  onChange={(e) => handleDraftChange("nic", e.target.value)}
                  placeholder="NIC Number"
                  className="w-full h-[38px] px-3 rounded-[10px] bg-[#F8FAFC] border border-[#CBD5E1] text-[13px] text-[#0A2569] placeholder-[#94A3B8] focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition-all font-medium"
                />
              </div>

              {/* Actions: Cancel & Save / OK */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E2E8F0] mt-2">
                <button
                  type="button"
                  id="cancel-attendee-details-modal-btn"
                  onClick={handleCloseEditModal}
                  className="px-3.5 py-2 text-[12.5px] font-semibold text-[#64748B] hover:text-[#334155] rounded-[9px] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="save-attendee-details-modal-btn"
                  className="px-5 py-2 text-[12.5px] font-bold text-white bg-[#0A2569] hover:bg-[#081E54] active:scale-95 rounded-[9px] shadow-sm transition-all cursor-pointer"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TicketingPaymentOverlay;
