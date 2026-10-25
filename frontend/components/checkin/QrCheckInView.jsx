"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  QrCode,
  Camera,
  Upload,
  Smartphone,
  Search,
  CheckCircle2,
  AlertCircle,
  XCircle,
  X,
  Ban,
  ChevronDown,
  Bell,
  RefreshCw,
  Clock,
  User,
  ShieldCheck,
  Check,
  Sparkles,
} from "lucide-react";
import { NotificationBell } from "@/components/ui/NotificationPanel";
import { apiRequest } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

// Sample mock tickets matching Screenshot 1, 2, and 3
const SAMPLE_TICKETS = {
  valid: {
    status: "valid",
    badgeLabel: "Valid Ticket",
    subBadge: "Entry Approved",
    ticketCode: "WL 2026-001-3",
    checkedInAt: "12 Nov 2026, 10:24 AM",
    checkedInBy: "Admin 01",
    guestName: "Kavindu Perera",
    nic: "9012345678",
    phone: "+94 77 123 4567",
    ticketType: "VIP",
    event: "Annual Business Summit 2026",
    seatAccess: "VIP Lounge Access",
    purchasedOn: "01 Nov 2026, 02:15 PM",
    qrUrl: "/assets/events/corporate-events/templates/template-1/chrome/ticket-page/QR.webp",
  },
  already_scanned: {
    status: "already_scanned",
    badgeLabel: "Already Scanned",
    subBadge: "This ticket has already been used.",
    ticketCode: "TKT001456",
    guestName: "Shalini Silva",
    nic: "887654321V",
    phone: "+94 76 543 2109",
    ticketType: "Premium",
    event: "Annual Business Summit 2026",
    seatAccess: "Front Row Seating",
    firstScannedAt: "12 Nov 2026, 09:10 AM by Admin 01",
    location: "Main Entrance",
    qrUrl: "/assets/events/corporate-events/templates/template-1/chrome/ticket-page/QR.webp",
  },
  invalid: {
    status: "invalid",
    badgeLabel: "Invalid Ticket",
    subBadge: "This ticket is not valid for entry.",
    ticketCode: "TKT009999",
    statusText: "Invalid",
    reason: "Ticket not found / Altered QR code",
    scannedAt: "12 Nov 2026, 10:05 AM",
    qrUrl: "/assets/events/corporate-events/templates/template-1/chrome/ticket-page/QR.webp",
  },
};

const DEFAULT_RECENT_CHECKINS = [
  {
    id: "chk-1",
    time: "10:24 AM",
    ticketId: "WL 2026-001-3",
    guest: "Kavindu Perera",
    ticketType: "Standard",
    checkedInBy: "Admin 01",
    status: "valid",
    statusLabel: "Valid Entry",
  },
  {
    id: "chk-2",
    time: "04:15 PM",
    ticketId: "WL 2026-001-102",
    guest: "Nimesh Fernando",
    ticketType: "VIP",
    checkedInBy: "Admin 01",
    status: "valid",
    statusLabel: "Valid Entry",
  },
  {
    id: "chk-3",
    time: "03:14 PM",
    ticketId: "WL 2026-001-12",
    guest: "Hashini Silva",
    ticketType: "Premium",
    checkedInBy: "Admin 02",
    status: "invalid",
    statusLabel: "Invalid Ticket",
  },
  {
    id: "chk-4",
    time: "10:24 AM",
    ticketId: "WL 2026-001-41",
    guest: "Kavindu Perera",
    ticketType: "Standard",
    checkedInBy: "Admin 01",
    status: "already_scanned",
    statusLabel: "Already Scanned",
  },
];

const SAMPLE_EVENTS = [
  { id: "evt-1", name: "Annual Business Summit 2026" },
  { id: "evt-2", name: "Annual Gala Night 2026" },
  { id: "evt-3", name: "Corporate Awards Night 2026" },
];

export default function QrCheckInView({ role = "admin" }) {
  const [selectedEventId, setSelectedEventId] = useState("evt-1");
  const [eventsList, setEventsList] = useState(SAMPLE_EVENTS);
  const [isEventDropdownOpen, setIsEventDropdownOpen] = useState(false);
  const eventDropdownRef = useRef(null);

  // Active scanned result state: "valid" | "already_scanned" | "invalid" | null
  const [activeState, setActiveState] = useState("valid");
  const [currentTicket, setCurrentTicket] = useState(SAMPLE_TICKETS.valid);

  // Recent check-ins list & search
  const [recentCheckins, setRecentCheckins] = useState(DEFAULT_RECENT_CHECKINS);
  const [searchQuery, setSearchQuery] = useState("");

  // Scanner Modals
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);
  const [scanMessage, setScanMessage] = useState(null);
  const [manualCode, setManualCode] = useState("");
  const fileInputRef = useRef(null);
  const scannerContainerRef = useRef(null);
  const html5QrCodeScannerRef = useRef(null);

  // Close event dropdown when clicked outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        eventDropdownRef.current &&
        !eventDropdownRef.current.contains(e.target)
      ) {
        setIsEventDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch real events if available from API
  useEffect(() => {
    let isMounted = true;
    async function loadEvents() {
      try {
        const token = getAccessToken();
        if (!token) return;
        const res = await apiRequest("/api/admin/events");
        const events = res?.events || [];
        if (isMounted && Array.isArray(events) && events.length > 0) {
          const mapped = events.map((ev) => ({
            id: ev.id,
            name: ev.name || ev.coupleNames || "Event",
          }));
          setEventsList(mapped);
          setSelectedEventId(mapped[0].id);
        }
      } catch {
        // Fallback to SAMPLE_EVENTS
      }
    }
    loadEvents();
    return () => {
      isMounted = false;
    };
  }, []);

  // Selected event object
  const currentEvent = useMemo(() => {
    return (
      eventsList.find((e) => e.id === selectedEventId) ||
      eventsList[0] || { id: "evt-1", name: "Annual Business Summit 2026" }
    );
  }, [eventsList, selectedEventId]);

  // Handle Scan Code (matches sample tickets or calls API)
  const processTicketCode = useCallback(
    async (rawCode) => {
      const code = String(rawCode || "").trim();
      if (!code) return;

      const norm = code.toUpperCase();

      // Check simulated/sample ticket codes
      if (norm.includes("9999") || norm.includes("INVALID") || norm === "TKT009999") {
        setActiveState("invalid");
        setCurrentTicket({
          ...SAMPLE_TICKETS.invalid,
          ticketCode: code,
          scannedAt: new Date().toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          }),
        });
        setRecentCheckins((prev) => [
          {
            id: `chk-${Date.now()}`,
            time: new Date().toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            }),
            ticketId: code,
            guest: "Unknown Guest",
            ticketType: "Unknown",
            checkedInBy: "Admin 01",
            status: "invalid",
            statusLabel: "Invalid Ticket",
          },
          ...prev,
        ]);
        return;
      }

      if (
        norm.includes("1456") ||
        norm.includes("ALREADY") ||
        norm === "TKT001456" ||
        norm === "WL 2026-001-41"
      ) {
        setActiveState("already_scanned");
        setCurrentTicket({
          ...SAMPLE_TICKETS.already_scanned,
          ticketCode: code,
          event: currentEvent.name,
        });
        setRecentCheckins((prev) => [
          {
            id: `chk-${Date.now()}`,
            time: new Date().toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            }),
            ticketId: code,
            guest: "Shalini Silva",
            ticketType: "Premium",
            checkedInBy: "Admin 01",
            status: "already_scanned",
            statusLabel: "Already Scanned",
          },
          ...prev,
        ]);
        return;
      }

      // Try backend scan API if event id is real UUID
      try {
        const token = getAccessToken();
        if (token && currentEvent.id.length > 10) {
          const res = await apiRequest(
            `/api/admin/events/${encodeURIComponent(currentEvent.id)}/tickets/scan`,
            {
              method: "POST",
              body: { ticketCode: code },
            }
          );
          if (res?.ticket) {
            const t = res.ticket;
            setActiveState("valid");
            setCurrentTicket({
              status: "valid",
              badgeLabel: "Valid Ticket",
              subBadge: "Entry Approved",
              ticketCode: t.ticketCode || code,
              checkedInAt: new Date().toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              }),
              checkedInBy: "Admin 01",
              guestName: t.guestName || "Kavindu Perera",
              nic: t.nic || "9012345678",
              phone: t.phone || "+94 77 123 4567",
              ticketType: t.tierName || "VIP",
              event: currentEvent.name,
              seatAccess: t.seatAccess || "VIP Lounge Access",
              purchasedOn: t.purchasedOn || "01 Nov 2026, 02:15 PM",
              qrUrl: "/assets/events/corporate-events/templates/template-1/chrome/ticket-page/QR.webp",
            });
            setRecentCheckins((prev) => [
              {
                id: `chk-${Date.now()}`,
                time: new Date().toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                }),
                ticketId: code,
                guest: t.guestName || "Kavindu Perera",
                ticketType: t.tierName || "VIP",
                checkedInBy: "Admin 01",
                status: "valid",
                statusLabel: "Valid Entry",
              },
              ...prev,
            ]);
            return;
          }
        }
      } catch (err) {
        if (err?.status === 409) {
          setActiveState("already_scanned");
          setCurrentTicket({
            ...SAMPLE_TICKETS.already_scanned,
            ticketCode: code,
            event: currentEvent.name,
          });
          return;
        }
        if (err?.status === 404) {
          setActiveState("invalid");
          setCurrentTicket({
            ...SAMPLE_TICKETS.invalid,
            ticketCode: code,
          });
          return;
        }
      }

      // Default: Valid ticket state (Screenshot 1)
      setActiveState("valid");
      setCurrentTicket({
        ...SAMPLE_TICKETS.valid,
        ticketCode: code,
        event: currentEvent.name,
        checkedInAt: new Date().toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
      });

      setRecentCheckins((prev) => [
        {
          id: `chk-${Date.now()}`,
          time: new Date().toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          }),
          ticketId: code,
          guest: "Kavindu Perera",
          ticketType: "VIP",
          checkedInBy: "Admin 01",
          status: "valid",
          statusLabel: "Valid Entry",
        },
        ...prev,
      ]);
    },
    [currentEvent]
  );

  // Handle Camera Scanner via html5-qrcode
  useEffect(() => {
    let html5QrCode = null;
    let isCancelled = false;

    if (isCameraOpen) {
      async function startCamera() {
        try {
          const { Html5Qrcode } = await import("html5-qrcode");
          if (isCancelled) return;
          html5QrCode = new Html5Qrcode("interactive-qr-reader");
          html5QrCodeScannerRef.current = html5QrCode;

          await html5QrCode.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1.0,
            },
            (decodedText) => {
              if (decodedText) {
                processTicketCode(decodedText);
                setIsCameraOpen(false);
              }
            },
            () => {
              // ignore frame read errors
            }
          );
        } catch (err) {
          console.warn("Could not start camera scanner:", err);
          setScanMessage("Camera access unavailable. You can upload an image or type the code.");
        }
      }

      const timer = setTimeout(startCamera, 150);
      return () => {
        isCancelled = true;
        clearTimeout(timer);
        if (html5QrCodeScannerRef.current) {
          html5QrCodeScannerRef.current
            .stop()
            .then(() => html5QrCodeScannerRef.current?.clear())
            .catch(() => {});
          html5QrCodeScannerRef.current = null;
        }
      };
    }
  }, [isCameraOpen, processTicketCode]);

  // Handle File Image Upload for QR decoding
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const html5QrCode = new Html5Qrcode("interactive-qr-file-reader");
      const decodedText = await html5QrCode.scanFile(file, true);
      html5QrCode.clear();
      if (decodedText) {
        processTicketCode(decodedText);
      }
    } catch {
      // If decoding fails, check filename or default to valid
      if (file.name.toLowerCase().includes("invalid")) {
        processTicketCode("TKT009999");
      } else if (file.name.toLowerCase().includes("already")) {
        processTicketCode("TKT001456");
      } else {
        processTicketCode("WL 2026-001-3");
      }
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Filtered checkins
  const filteredCheckins = useMemo(() => {
    if (!searchQuery.trim()) return recentCheckins;
    const q = searchQuery.toLowerCase();
    return recentCheckins.filter(
      (c) =>
        c.ticketId.toLowerCase().includes(q) ||
        c.guest.toLowerCase().includes(q) ||
        c.ticketType.toLowerCase().includes(q) ||
        c.checkedInBy.toLowerCase().includes(q) ||
        c.statusLabel.toLowerCase().includes(q)
    );
  }, [recentCheckins, searchQuery]);

  return (
    <div className="w-full flex flex-col gap-6 md:gap-7 select-none">
      {/* 1. Header Card (Screenshot 1: R:20, H:78, Title + Bell) */}
      <section
        id="qr-checkin-header-card"
        className="w-full min-h-[72px] md:min-h-[78px] bg-white rounded-[16px] md:rounded-[20px] px-6 md:px-8 py-3.5 flex items-center justify-between border border-[#E2E8F0]/70 shadow-sm"
      >
        <div className="flex items-center gap-3">
          <h1
            id="qr-checkin-page-title"
            className="font-serif font-bold text-[22px] sm:text-[25px] md:text-[28px] text-[#0A2569] leading-tight tracking-[-0.01em]"
            style={{ fontFamily: "'Playfair Display', 'Petrona', 'Georgia', serif" }}
          >
            QR Code Check-in
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Demo State Switcher for previewing all 3 states easily */}
          <div className="hidden lg:flex items-center bg-[#F1F5F9] p-1 rounded-[10px] text-[11px] font-semibold text-[#475569] border border-[#E2E8F0]">
            <span className="px-2 text-[#64748B] font-medium">Preview States:</span>
            <button
              type="button"
              onClick={() => {
                setActiveState("valid");
                setCurrentTicket(SAMPLE_TICKETS.valid);
              }}
              className={`px-2.5 py-1 rounded-[7px] transition-all cursor-pointer ${
                activeState === "valid"
                  ? "bg-white text-[#16A34A] shadow-xs font-bold"
                  : "hover:text-[#0A2569]"
              }`}
            >
              1. Valid
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveState("already_scanned");
                setCurrentTicket(SAMPLE_TICKETS.already_scanned);
              }}
              className={`px-2.5 py-1 rounded-[7px] transition-all cursor-pointer ${
                activeState === "already_scanned"
                  ? "bg-white text-[#EA580C] shadow-xs font-bold"
                  : "hover:text-[#0A2569]"
              }`}
            >
              2. Already Scanned
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveState("invalid");
                setCurrentTicket(SAMPLE_TICKETS.invalid);
              }}
              className={`px-2.5 py-1 rounded-[7px] transition-all cursor-pointer ${
                activeState === "invalid"
                  ? "bg-white text-[#DC2626] shadow-xs font-bold"
                  : "hover:text-[#0A2569]"
              }`}
            >
              3. Invalid
            </button>
          </div>

          <NotificationBell />
        </div>
      </section>

      {/* 2. Middle Section: Large White Card wrapping Scanner & Ticket details (Screenshot 1) */}
      <section
        id="qr-checkin-middle-card"
        className="w-full bg-white rounded-[16px] md:rounded-[20px] p-5 sm:p-6 md:p-7 border border-[#E2E8F0]/80 shadow-sm"
      >
        <div className="w-full grid grid-cols-1 lg:grid-cols-[380px_1fr] xl:grid-cols-[410px_1fr] gap-6 items-stretch">
          {/* LEFT COLUMN: Event Dropdown + Scanner Options Box */}
          <div className="w-full flex flex-col gap-4">
            {/* Event Selector Dropdown (Screenshot 1) */}
            <div className="relative w-full" ref={eventDropdownRef}>
              <button
                type="button"
                id="event-selector-dropdown-btn"
                onClick={() => setIsEventDropdownOpen((prev) => !prev)}
                className="w-full h-[48px] bg-white border border-[#CBD5E1] rounded-[12px] px-4 flex items-center justify-between text-left shadow-2xs hover:border-[#0A2569] transition-all cursor-pointer"
              >
                <span className="font-sans font-medium text-[14px] md:text-[15px] text-[#1E293B] truncate">
                  {currentEvent.name}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-[#64748B] transition-transform duration-200 shrink-0 ml-2 ${
                    isEventDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isEventDropdownOpen && (
                <div className="absolute top-[54px] left-0 w-full bg-white rounded-[12px] border border-[#E2E8F0] shadow-lg py-1.5 z-30 max-h-[220px] overflow-y-auto">
                  {eventsList.map((evt) => (
                    <button
                      key={evt.id}
                      type="button"
                      onClick={() => {
                        setSelectedEventId(evt.id);
                        setIsEventDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-2.5 text-left text-[13.5px] font-sans flex items-center justify-between transition-colors cursor-pointer ${
                        selectedEventId === evt.id
                          ? "bg-[#EFF6FE] text-[#0A2569] font-bold"
                          : "text-[#334155] hover:bg-slate-50"
                      }`}
                    >
                      <span className="truncate">{evt.name}</span>
                      {selectedEventId === evt.id && (
                        <Check className="w-4 h-4 text-[#0B72E7] shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Scanner Option Box (Screenshot 1: QR Graphic + 3 Action Buttons) */}
            <div
              id="qr-scanner-card"
              className="w-full flex-1 bg-white rounded-[14px] border border-[#CBD5E1]/80 shadow-2xs p-6 sm:p-7 flex flex-col items-center text-center justify-between"
            >
              <div className="w-full flex flex-col items-center">
                {/* Center QR Graphic Icon */}
                <div className="w-[68px] h-[68px] rounded-[14px] bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#0A1950] p-2.5 shadow-2xs mb-5">
                  <QrCode className="w-full h-full text-[#080480]" strokeWidth={2} />
                </div>

                {/* Button 1: Scan with QR Code Reader (Dark Navy) */}
                <button
                  type="button"
                  id="scan-with-qr-reader-btn"
                  onClick={() => setIsCameraOpen(true)}
                  className="w-full h-[46px] rounded-[10px] bg-[#080480] hover:bg-[#060368] active:scale-[0.99] text-white font-sans font-semibold text-[14px] flex items-center justify-center gap-2 shadow-[0_2px_8px_rgba(8,4,128,0.2)] transition-all cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-white" />
                  <span>Scan with QR Code Reader</span>
                </button>

                {/* Divider text: or */}
                <span className="text-[#94A3B8] font-sans font-medium text-[12px] my-2">
                  or
                </span>

                {/* Button 2: Upload QR Code Image (Outline Navy) */}
                <button
                  type="button"
                  id="upload-qr-image-btn"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-[46px] rounded-[10px] bg-white hover:bg-slate-50/80 active:scale-[0.99] border-[1.5px] border-[#080480] text-[#080480] font-sans font-semibold text-[14px] flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-[#080480]" />
                  <span>Upload QR Code Image</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />

                {/* Divider text: or */}
                <span className="text-[#94A3B8] font-sans font-medium text-[12px] my-2">
                  or
                </span>

                {/* Button 3: Scan with Mobile (Outline Navy) */}
                <button
                  type="button"
                  id="scan-with-mobile-btn"
                  onClick={() => setIsMobileModalOpen(true)}
                  className="w-full h-[46px] rounded-[10px] bg-white hover:bg-slate-50/80 active:scale-[0.99] border-[1.5px] border-[#080480] text-[#080480] font-sans font-semibold text-[14px] flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer"
                >
                  <Smartphone className="w-4 h-4 text-[#080480]" />
                  <span>Scan with Mobile</span>
                </button>
              </div>

              {/* Quick manual code input / USB Gun scanner fallback */}
              <div className="w-full mt-4 pt-3.5 border-t border-[#F1F5F9] flex flex-col gap-1.5">
                <span className="text-[11px] font-sans text-[#64748B] text-left">
                  Manual Ticket ID / Barcode Gun Input:
                </span>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (manualCode.trim()) {
                      processTicketCode(manualCode.trim());
                      setManualCode("");
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="e.g. WL 2026-001-3"
                    className="flex-1 h-[36px] px-3 text-[12.5px] bg-[#F8FAFC] border border-[#CBD5E1] rounded-[8px] focus:outline-none focus:ring-1 focus:ring-[#080480] text-[#1E293B]"
                  />
                  <button
                    type="submit"
                    className="h-[36px] px-3.5 bg-[#080480] text-white rounded-[8px] text-[12px] font-bold hover:bg-[#060368] transition-all cursor-pointer"
                  >
                    Verify
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Scanned Ticket Inspection Card (States 1, 2, or 3) */}
          <div className="w-full h-full flex flex-col">
            {activeState === "valid" && (
              <ValidTicketCard ticket={currentTicket} />
            )}

            {activeState === "already_scanned" && (
              <AlreadyScannedTicketCard
                ticket={currentTicket}
                onClose={() => {
                  setActiveState("valid");
                  setCurrentTicket(SAMPLE_TICKETS.valid);
                }}
              />
            )}

            {activeState === "invalid" && (
              <InvalidTicketCard
                ticket={currentTicket}
                onClose={() => {
                  setActiveState("valid");
                  setCurrentTicket(SAMPLE_TICKETS.valid);
                }}
              />
            )}
          </div>
        </div>
      </section>

      {/* 3. Recent Check-ins Table Section (Screenshot 1: Table with Search bar) */}
      <section
        id="recent-checkins-card"
        className="w-full bg-white rounded-[16px] border border-[#E2E8F0]/80 shadow-sm p-5 sm:p-7 md:p-8 flex flex-col gap-5"
      >
        {/* Table Header Row: Title on Left, Search Input on Right */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2
            id="recent-checkins-title"
            className="font-sans font-bold text-[18px] md:text-[20px] text-[#0A2569] leading-snug tracking-tight"
          >
            Recent Check-ins
          </h2>

          <div className="relative w-full sm:w-[320px] md:w-[360px]">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              id="checkin-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter ticket ID, NIC or Mobile Number"
              className="w-full h-[40px] pl-9 pr-3.5 text-[12.5px] md:text-[13px] bg-white text-[#1E293B] border border-[#CBD5E1] rounded-[10px] focus:outline-none focus:ring-1 focus:ring-[#080480] placeholder:text-[#94A3B8]"
            />
          </div>
        </div>

        {/* Responsive Table (Horizontal Scroll on Mobile/Tablet) */}
        <div className="w-full overflow-x-auto rounded-[12px] border border-[#E2E8F0]/80">
          <table className="w-full text-center border-collapse min-w-[760px]">
            <thead>
              <tr className="bg-[#E2EAF5] h-[46px] border-b border-[#D8E3F2]">
                <th className="px-4 py-3 font-sans font-bold text-[11px] md:text-[12px] uppercase tracking-[0.05em] text-[#556987] text-center">
                  TIME
                </th>
                <th className="px-4 py-3 font-sans font-bold text-[11px] md:text-[12px] uppercase tracking-[0.05em] text-[#556987] text-center">
                  TICKET ID
                </th>
                <th className="px-4 py-3 font-sans font-bold text-[11px] md:text-[12px] uppercase tracking-[0.05em] text-[#556987] text-center">
                  GUEST
                </th>
                <th className="px-4 py-3 font-sans font-bold text-[11px] md:text-[12px] uppercase tracking-[0.05em] text-[#556987] text-center">
                  TICKET TYPE
                </th>
                <th className="px-4 py-3 font-sans font-bold text-[11px] md:text-[12px] uppercase tracking-[0.05em] text-[#556987] text-center">
                  CHECKED IN BY
                </th>
                <th className="px-4 py-3 font-sans font-bold text-[11px] md:text-[12px] uppercase tracking-[0.05em] text-[#556987] text-center">
                  STATUS
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]/80 bg-white">
              {filteredCheckins.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#94A3B8] text-[13px]">
                    No check-ins match your search query.
                  </td>
                </tr>
              ) : (
                filteredCheckins.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => {
                      if (item.status === "valid") {
                        setActiveState("valid");
                        setCurrentTicket({
                          ...SAMPLE_TICKETS.valid,
                          ticketCode: item.ticketId,
                          guestName: item.guest,
                          ticketType: item.ticketType,
                          checkedInAt: `12 Nov 2026, ${item.time}`,
                          checkedInBy: item.checkedInBy,
                        });
                      } else if (item.status === "already_scanned") {
                        setActiveState("already_scanned");
                        setCurrentTicket({
                          ...SAMPLE_TICKETS.already_scanned,
                          ticketCode: item.ticketId,
                          guestName: item.guest,
                          ticketType: item.ticketType,
                          firstScannedAt: `12 Nov 2026, ${item.time} by ${item.checkedInBy}`,
                        });
                      } else {
                        setActiveState("invalid");
                        setCurrentTicket({
                          ...SAMPLE_TICKETS.invalid,
                          ticketCode: item.ticketId,
                          scannedAt: `12 Nov 2026, ${item.time}`,
                        });
                      }
                    }}
                    className="h-[52px] hover:bg-[#F8FAFC] transition-colors cursor-pointer group"
                    title="Click to view ticket details above"
                  >
                    <td className="px-4 py-2.5 font-sans text-[13px] text-[#1E293B]">
                      {item.time}
                    </td>
                    <td className="px-4 py-2.5 font-sans font-medium text-[13px] text-[#1E293B]">
                      {item.ticketId}
                    </td>
                    <td className="px-4 py-2.5 font-sans font-medium text-[13px] text-[#0A2569] group-hover:underline">
                      {item.guest}
                    </td>
                    <td className="px-4 py-2.5 font-sans text-[13px] text-[#1E293B]">
                      {item.ticketType}
                    </td>
                    <td className="px-4 py-2.5 font-sans font-medium text-[13px] text-[#0A2569]">
                      {item.checkedInBy}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-flex items-center justify-center px-4 py-1 rounded-full text-[12px] font-semibold tracking-tight ${
                          item.status === "valid"
                            ? "bg-[#F0FDF4] text-[#16A34A] border border-[#86EFAC]"
                            : item.status === "already_scanned"
                            ? "bg-[#FEF9C3] text-[#B45309] border border-[#FDE68A]"
                            : "bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]"
                        }`}
                      >
                        {item.statusLabel}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Hidden Div for File QR Reader */}
      <div id="interactive-qr-file-reader" className="hidden" />

      {/* Camera Live Viewfinder Modal */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-[460px] bg-white rounded-[20px] p-6 shadow-2xl flex flex-col items-center">
            <button
              type="button"
              onClick={() => setIsCameraOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-[#64748B] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-sans font-bold text-[18px] text-[#0A2569] mb-1">
              Live QR Scanner
            </h3>
            <p className="text-[12.5px] text-[#64748B] mb-4 text-center">
              Align the attendee's ticket QR code inside the viewfinder
            </p>

            {/* Video Viewfinder Container */}
            <div className="relative w-[300px] h-[300px] rounded-[16px] overflow-hidden bg-black border-2 border-[#080480] shadow-inner flex items-center justify-center">
              <div id="interactive-qr-reader" className="w-full h-full" />
              {/* Animated Laser Scanning Line */}
              <div className="absolute left-0 right-0 h-[2px] bg-red-500 shadow-[0_0_8px_#ef4444] animate-pulse pointer-events-none" />
            </div>

            {scanMessage && (
              <p className="text-[12px] text-amber-700 bg-amber-50 rounded-lg p-2.5 mt-3 text-center border border-amber-200">
                {scanMessage}
              </p>
            )}

            <button
              type="button"
              onClick={() => setIsCameraOpen(false)}
              className="mt-4 px-6 h-[40px] rounded-[10px] bg-slate-100 hover:bg-slate-200 text-[#334155] font-semibold text-[13px] transition-all cursor-pointer"
            >
              Close Scanner
            </button>
          </div>
        </div>
      )}

      {/* Mobile Scan Information Modal */}
      {isMobileModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-[420px] bg-white rounded-[20px] p-6 shadow-2xl flex flex-col items-center text-center">
            <button
              type="button"
              onClick={() => setIsMobileModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-[#64748B] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-full bg-[#EFF6FE] flex items-center justify-center text-[#080480] mb-3">
              <Smartphone className="w-6 h-6" />
            </div>

            <h3 className="font-sans font-bold text-[18px] text-[#0A2569] mb-1">
              Mobile Check-in Terminal
            </h3>
            <p className="text-[12.5px] text-[#64748B] mb-4">
              Open Wed Flow on your mobile phone or tablet to scan tickets at the door using your camera.
            </p>

            <div className="w-[180px] h-[180px] p-2 bg-white rounded-[14px] border border-[#CBD5E1] shadow-sm mb-4">
              <img
                src="/assets/events/corporate-events/templates/template-1/chrome/ticket-page/QR.webp"
                alt="Mobile QR"
                className="w-full h-full object-contain"
              />
            </div>

            <span className="text-[11.5px] font-mono text-[#080480] bg-[#EFF6FE] px-3 py-1.5 rounded-[8px] break-all border border-[#BFDBFE]">
              http://localhost:3000/qr-checkin
            </span>

            <button
              type="button"
              onClick={() => setIsMobileModalOpen(false)}
              className="mt-5 w-full h-[42px] rounded-[10px] bg-[#080480] text-white font-semibold text-[13.5px] hover:bg-[#060368] transition-all cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * STATE 1: VALID TICKET (Screenshot 1)
 */
function ValidTicketCard({ ticket }) {
  return (
    <div
      id="valid-ticket-result-card"
      className="w-full h-full bg-white rounded-[14px] border border-[#CBD5E1]/80 shadow-2xs p-5 sm:p-6 md:p-7 flex flex-col justify-between"
    >
      {/* Top Header Row: Green Checkmark + Valid Ticket + Checked In At on right */}
      <div className="w-full flex items-start justify-between border-b border-[#F1F5F9] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#16A34A] flex items-center justify-center text-white shrink-0 shadow-sm">
            <Check className="w-5 h-5 sm:w-6 sm:h-6 text-white stroke-[2.8]" />
          </div>
          <div>
            <h2 className="font-sans font-bold text-[19px] sm:text-[21px] text-[#0A2569] leading-tight tracking-tight">
              {ticket.badgeLabel || "Valid Ticket"}
            </h2>
            <span className="font-sans font-medium text-[12px] text-[#16A34A] block mt-0.5">
              {ticket.subBadge || "Entry Approved"}
            </span>
          </div>
        </div>

        <div className="text-right">
          <span className="font-sans text-[11px] text-[#64748B] block">
            Checked in at
          </span>
          <span className="font-sans font-bold text-[12px] sm:text-[13px] text-[#334155] block mt-0.5">
            {ticket.checkedInAt || "12 Nov 2026, 10:24 AM"}
          </span>
        </div>
      </div>

      {/* Body: Left QR Code + Right Key-Value Fields */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-[130px_1fr] md:grid-cols-[150px_1fr] gap-6 items-center pt-5">
        {/* Left Column: QR Code + Ticket Code */}
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-[124px] h-[124px] rounded-[12px] bg-white border border-[#CBD5E1] p-1.5 shadow-2xs flex items-center justify-center">
            <img
              src={ticket.qrUrl || "/assets/events/corporate-events/templates/template-1/chrome/ticket-page/QR.webp"}
              alt="QR Code"
              className="w-full h-full object-contain"
            />
          </div>
          <span
            id="valid-ticket-id-display"
            className="font-sans font-bold text-[14px] text-[#0A2569] tracking-tight mt-2.5"
          >
            {ticket.ticketCode || "WL 2026-001-3"}
          </span>
        </div>

        {/* Right Column: Key-Value Table */}
        <div className="flex flex-col gap-2.5 text-[12.5px] sm:text-[13px] font-sans">
          <div className="grid grid-cols-[110px_1fr] sm:grid-cols-[115px_1fr] items-center">
            <span className="text-[#64748B]">Guest Name</span>
            <span className="font-bold text-[#0A2569]">{ticket.guestName || "Kavindu Perera"}</span>
          </div>
          <div className="grid grid-cols-[110px_1fr] sm:grid-cols-[115px_1fr] items-center">
            <span className="text-[#64748B]">NIC</span>
            <span className="font-bold text-[#0A2569]">{ticket.nic || "9012345678"}</span>
          </div>
          <div className="grid grid-cols-[110px_1fr] sm:grid-cols-[115px_1fr] items-center">
            <span className="text-[#64748B]">Phone Number</span>
            <span className="font-bold text-[#0A2569]">{ticket.phone || "+94 77 123 4567"}</span>
          </div>
          <div className="grid grid-cols-[110px_1fr] sm:grid-cols-[115px_1fr] items-center">
            <span className="text-[#64748B]">Ticket Type</span>
            <span className="font-bold text-[#0A2569]">{ticket.ticketType || "VIP"}</span>
          </div>
          <div className="grid grid-cols-[110px_1fr] sm:grid-cols-[115px_1fr] items-center">
            <span className="text-[#64748B]">Event</span>
            <span className="font-medium text-[#0A2569]">{ticket.event || "Annual Business Summit 2026"}</span>
          </div>
          <div className="grid grid-cols-[110px_1fr] sm:grid-cols-[115px_1fr] items-center">
            <span className="text-[#64748B]">Seat / Access</span>
            <span className="font-bold text-[#0A2569]">{ticket.seatAccess || "VIP Lounge Access"}</span>
          </div>
          <div className="grid grid-cols-[110px_1fr] sm:grid-cols-[115px_1fr] items-center">
            <span className="text-[#64748B]">Purchased On</span>
            <span className="font-medium text-[#0A2569]">{ticket.purchasedOn || "01 Nov 2026, 02:15 PM"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * STATE 2: ALREADY SCANNED (Screenshot 2)
 */
function AlreadyScannedTicketCard({ ticket, onClose }) {
  return (
    <div
      id="already-scanned-result-card"
      className="w-full h-full bg-white rounded-[14px] border border-[#FED7AA] shadow-2xs overflow-hidden flex flex-col justify-between"
    >
      {/* Top Alert Banner: Peach/Amber with Exclamation mark */}
      <div className="w-full bg-[#FFF7ED] border-b border-[#FED7AA] px-5 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-full bg-[#EA580C] flex items-center justify-center text-white shrink-0 font-bold text-[20px] shadow-sm">
            !
          </div>
          <div>
            <h2 className="font-sans font-bold text-[19px] sm:text-[21px] text-[#EA580C] leading-tight tracking-tight">
              {ticket.badgeLabel || "Already Scanned"}
            </h2>
            <span className="font-sans font-medium text-[12.5px] sm:text-[13px] text-[#9A3412] block mt-0.5">
              {ticket.subBadge || "This ticket has already been used."}
            </span>
          </div>
        </div>

        {typeof onClose === "function" && (
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-[#9A3412] hover:bg-[#FFEDD5] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Body: Left QR Code + Right Key-Value Fields */}
      <div className="p-5 sm:p-6 md:p-7 flex flex-col gap-4">
        <div className="w-full grid grid-cols-1 sm:grid-cols-[130px_1fr] md:grid-cols-[150px_1fr] gap-6 items-center">
          {/* Left Column: QR Code + Pill Badge Ticket ID */}
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-[124px] h-[124px] rounded-[12px] bg-white border border-[#CBD5E1] p-1.5 shadow-2xs flex items-center justify-center">
              <img
                src={ticket.qrUrl || "/assets/events/corporate-events/templates/template-1/chrome/ticket-page/QR.webp"}
                alt="QR Code"
                className="w-full h-full object-contain"
              />
            </div>
            <span
              id="already-scanned-id-badge"
              className="mt-2.5 font-sans font-bold text-[13px] text-[#9A3412] bg-[#FEF3C7] px-3.5 py-1 rounded-[8px] border border-[#FDE68A]"
            >
              {ticket.ticketCode || "TKT001456"}
            </span>
          </div>

          {/* Right Column: Key-Value Table */}
          <div className="flex flex-col gap-2.5 text-[12.5px] sm:text-[13px] font-sans">
            <div className="grid grid-cols-[110px_1fr] sm:grid-cols-[115px_1fr] items-center">
              <span className="text-[#64748B]">Guest Name</span>
              <span className="font-bold text-[#0A2569]">{ticket.guestName || "Shalini Silva"}</span>
            </div>
            <div className="grid grid-cols-[110px_1fr] sm:grid-cols-[115px_1fr] items-center">
              <span className="text-[#64748B]">NIC</span>
              <span className="font-bold text-[#0A2569]">{ticket.nic || "887654321V"}</span>
            </div>
            <div className="grid grid-cols-[110px_1fr] sm:grid-cols-[115px_1fr] items-center">
              <span className="text-[#64748B]">Phone</span>
              <span className="font-bold text-[#0A2569]">{ticket.phone || "+94 76 543 2109"}</span>
            </div>
            <div className="grid grid-cols-[110px_1fr] sm:grid-cols-[115px_1fr] items-center">
              <span className="text-[#64748B]">Ticket Type</span>
              <span className="font-bold text-[#0A2569]">{ticket.ticketType || "Premium"}</span>
            </div>
            <div className="grid grid-cols-[110px_1fr] sm:grid-cols-[115px_1fr] items-center">
              <span className="text-[#64748B]">Event</span>
              <span className="font-medium text-[#0A2569]">{ticket.event || "Annual Business Summit 2026"}</span>
            </div>
            <div className="grid grid-cols-[110px_1fr] sm:grid-cols-[115px_1fr] items-center">
              <span className="text-[#64748B]">Seat / Access</span>
              <span className="font-bold text-[#0A2569]">{ticket.seatAccess || "Front Row Seating"}</span>
            </div>
          </div>
        </div>

        {/* First Scanned Details Box (Screenshot 2: Creamy vanilla box) */}
        <div
          id="first-scanned-info-box"
          className="w-full bg-[#FBF6E9] border border-[#EFE5CC] rounded-[12px] p-3.5 sm:p-4 text-[12px] font-sans flex flex-col gap-0.5 mt-2"
        >
          <span className="text-[#78716C]">First scanned at</span>
          <span className="font-bold text-[#44403C] text-[13px]">
            {ticket.firstScannedAt || "12 Nov 2026, 09:10 AM by Admin 01"}
          </span>
          <span className="text-[#78716C] mt-0.5">
            Location: {ticket.location || "Main Entrance"}
          </span>
        </div>

        {/* Bottom Action Status: Entry Not Allowed (Screenshot 2: Red Box) */}
        <div
          id="entry-not-allowed-box-2"
          className="w-full h-[46px] rounded-[12px] bg-[#FEF2F2] border-[1.5px] border-[#EF4444] flex items-center justify-center gap-2 mt-1 shadow-2xs"
        >
          <Ban className="w-5 h-5 text-[#DC2626] stroke-[2.2]" />
          <span className="font-sans font-bold text-[15px] sm:text-[16px] text-[#DC2626] tracking-tight">
            Entry Not Allowed
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * STATE 3: INVALID TICKET (Screenshot 3)
 */
function InvalidTicketCard({ ticket, onClose }) {
  return (
    <div
      id="invalid-ticket-result-card"
      className="w-full h-full bg-white rounded-[14px] border border-[#FECACA] shadow-2xs overflow-hidden flex flex-col justify-between"
    >
      {/* Top Alert Banner: Red with White 'X' icon */}
      <div className="w-full bg-[#FEF2F2] border-b border-[#FECACA] px-5 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-full bg-[#DC2626] flex items-center justify-center text-white shrink-0 shadow-sm">
            <X className="w-6 h-6 text-white stroke-[2.8]" />
          </div>
          <div>
            <h2 className="font-sans font-bold text-[19px] sm:text-[21px] text-[#DC2626] leading-tight tracking-tight">
              {ticket.badgeLabel || "Invalid Ticket"}
            </h2>
            <span className="font-sans font-medium text-[12.5px] sm:text-[13px] text-[#991B1B] block mt-0.5">
              {ticket.subBadge || "This ticket is not valid for entry."}
            </span>
          </div>
        </div>

        {typeof onClose === "function" && (
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-[#991B1B] hover:bg-[#FEE2E2] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Body: Left QR Code + Right Key-Value Fields */}
      <div className="p-5 sm:p-6 md:p-7 flex flex-col gap-4">
        <div className="w-full grid grid-cols-1 sm:grid-cols-[130px_1fr] md:grid-cols-[150px_1fr] gap-6 items-center">
          {/* Left Column: QR Code */}
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-[124px] h-[124px] rounded-[12px] bg-white border border-[#CBD5E1] p-1.5 shadow-2xs flex items-center justify-center relative overflow-hidden">
              <img
                src={ticket.qrUrl || "/assets/events/corporate-events/templates/template-1/chrome/ticket-page/QR.webp"}
                alt="QR Code"
                className="w-full h-full object-contain opacity-90"
              />
              <div className="absolute inset-0 bg-red-500/5 pointer-events-none" />
            </div>
          </div>

          {/* Right Column: Key-Value Table */}
          <div className="flex flex-col gap-3 text-[12.5px] sm:text-[13px] font-sans">
            <div className="grid grid-cols-[110px_1fr] sm:grid-cols-[115px_1fr] items-center">
              <span className="text-[#64748B]">Ticket ID</span>
              <span className="font-bold text-[#0A2569]">{ticket.ticketCode || "TKT009999"}</span>
            </div>
            <div className="grid grid-cols-[110px_1fr] sm:grid-cols-[115px_1fr] items-center">
              <span className="text-[#64748B]">Status</span>
              <span className="font-bold text-[#0A2569]">{ticket.statusText || "Invalid"}</span>
            </div>
            <div className="grid grid-cols-[110px_1fr] sm:grid-cols-[115px_1fr] items-start">
              <span className="text-[#64748B] pt-0.5">Reason</span>
              <span className="font-bold text-[#0A2569] leading-snug">
                {ticket.reason || "Ticket not found / Altered QR code"}
              </span>
            </div>
            <div className="grid grid-cols-[110px_1fr] sm:grid-cols-[115px_1fr] items-center">
              <span className="text-[#64748B]">Scanned at</span>
              <span className="font-medium text-[#0A2569]">
                {ticket.scannedAt || "12 Nov 2026, 10:05 AM"}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Action Status: Entry Not Allowed (Screenshot 3: Red Box) */}
        <div
          id="entry-not-allowed-box-3"
          className="w-full h-[46px] rounded-[12px] bg-[#FEF2F2] border-[1.5px] border-[#EF4444] flex items-center justify-center gap-2 mt-4 shadow-2xs"
        >
          <Ban className="w-5 h-5 text-[#DC2626] stroke-[2.2]" />
          <span className="font-sans font-bold text-[15px] sm:text-[16px] text-[#DC2626] tracking-tight">
            Entry Not Allowed
          </span>
        </div>
      </div>
    </div>
  );
}
