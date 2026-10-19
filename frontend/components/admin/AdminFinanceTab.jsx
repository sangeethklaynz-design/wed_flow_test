"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  Bell,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { NotificationBell } from "@/components/ui/NotificationPanel";

const DEFAULT_PROFIT_EVENTS = [
  // Oct 01, 2026 (Screenshot 1 defaults - exactly matching 320 tickets, LKR 1,240,000 revenue, LKR 32,000 profit)
  {
    id: "evt-1",
    name: "Annual Summit 2026",
    type: "Cooperate",
    ticketsSold: 180,
    revenue: 720000,
    profit: 18000,
    date: "2026-10-01",
    formattedDate: "Oct 01, 2026",
  },
  {
    id: "evt-2",
    name: "Golden Gala Night",
    type: "Party",
    ticketsSold: 60,
    revenue: 300000,
    profit: 6000,
    date: "2026-10-01",
    formattedDate: "Oct 01, 2026",
  },
  {
    id: "evt-3",
    name: "Cooperate Event 01",
    type: "Cooperate",
    ticketsSold: 80,
    revenue: 220000,
    profit: 8000,
    date: "2026-10-01",
    formattedDate: "Oct 01, 2026",
  },

  // Oct 08, 2026
  {
    id: "evt-4",
    name: "Colombo Tech Expo 2026",
    type: "Cooperate",
    ticketsSold: 140,
    revenue: 560000,
    profit: 14000,
    date: "2026-10-08",
    formattedDate: "Oct 08, 2026",
  },
  {
    id: "evt-5",
    name: "Alumni Homecoming Party",
    type: "Party",
    ticketsSold: 95,
    revenue: 285000,
    profit: 9500,
    date: "2026-10-08",
    formattedDate: "Oct 08, 2026",
  },

  // Oct 15, 2026
  {
    id: "evt-6",
    name: "FinTech Innovation Summit",
    type: "Cooperate",
    ticketsSold: 210,
    revenue: 840000,
    profit: 21000,
    date: "2026-10-15",
    formattedDate: "Oct 15, 2026",
  },
  {
    id: "evt-7",
    name: "Neon Glow Music Fest",
    type: "Party",
    ticketsSold: 110,
    revenue: 440000,
    profit: 11000,
    date: "2026-10-15",
    formattedDate: "Oct 15, 2026",
  },

  // Oct 24, 2026
  {
    id: "evt-8",
    name: "Autumn Masquerade Ball",
    type: "Party",
    ticketsSold: 120,
    revenue: 480000,
    profit: 12000,
    date: "2026-10-24",
    formattedDate: "Oct 24, 2026",
  },

  // Sep 18, 2026
  {
    id: "evt-9",
    name: "Tech Leadership Summit",
    type: "Cooperate",
    ticketsSold: 210,
    revenue: 840000,
    profit: 21000,
    date: "2026-09-18",
    formattedDate: "Sep 18, 2026",
  },

  // Sep 24, 2026
  {
    id: "evt-10",
    name: "Grand Charity Gala",
    type: "Party",
    ticketsSold: 150,
    revenue: 600000,
    profit: 15000,
    date: "2026-09-24",
    formattedDate: "Sep 24, 2026",
  },
];

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const WEEKDAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function formatCurrency(amount, withSpace = true) {
  const formatted = Number(amount || 0).toLocaleString("en-US");
  return withSpace ? `LKR ${formatted.replace(/,/g, ", ")}` : `LKR ${formatted}`;
}

function formatDateString(dateStr) {
  if (!dateStr) return "All Dates";
  const [y, m, d] = dateStr.split("-").map(Number);
  const monthName = MONTH_SHORT[m - 1] || "";
  const dayStr = String(d).padStart(2, "0");
  return `${monthName} ${dayStr}, ${y}`;
}

export default function AdminFinanceTab({ hideNotificationBell = false }) {
  // Date state: "YYYY-MM-DD" or null (null = All Dates)
  const [selectedDate, setSelectedDate] = useState("2026-10-01");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Month & Year view for the calendar picker (starts at October 2026)
  const [viewYear, setViewYear] = useState(2026);
  const [viewMonth, setViewMonth] = useState(9); // 0-indexed: 9 = October

  const calendarContainerRef = useRef(null);

  // Set of dates that have event records
  const datesWithEvents = useMemo(() => {
    const set = new Set();
    DEFAULT_PROFIT_EVENTS.forEach((evt) => set.add(evt.date));
    return set;
  }, []);

  // Close calendar popup on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        calendarContainerRef.current &&
        !calendarContainerRef.current.contains(event.target)
      ) {
        setIsCalendarOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter events by selected date
  const filteredEvents = useMemo(() => {
    if (!selectedDate) {
      return DEFAULT_PROFIT_EVENTS;
    }
    return DEFAULT_PROFIT_EVENTS.filter((evt) => evt.date === selectedDate);
  }, [selectedDate]);

  // Dynamically compute summary metrics based on filtered events
  const summaryMetrics = useMemo(() => {
    const totalTickets = filteredEvents.reduce((sum, evt) => sum + evt.ticketsSold, 0);
    const totalRevenue = filteredEvents.reduce((sum, evt) => sum + evt.revenue, 0);
    const totalProfit = filteredEvents.reduce((sum, evt) => sum + evt.profit, 0);

    return {
      ticketsSold: totalTickets,
      revenue: totalRevenue,
      platformProfit: totalProfit,
    };
  }, [filteredEvents]);

  // Calendar calculations
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sun
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  // Previous month trailing days
  const prevMonthDays = [];
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    prevMonthDays.push(daysInPrevMonth - i);
  }

  // Current month days
  const currentMonthDays = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const hasEvents = datesWithEvents.has(dateKey);
    const isSelected = selectedDate === dateKey;
    currentMonthDays.push({
      day: d,
      dateKey,
      hasEvents,
      isSelected,
    });
  }

  // Next month leading days to complete full grid rows (multiple of 7)
  const totalSlots = Math.ceil((prevMonthDays.length + currentMonthDays.length) / 7) * 7;
  const nextMonthDaysCount = totalSlots - (prevMonthDays.length + currentMonthDays.length);
  const nextMonthDays = [];
  for (let d = 1; d <= nextMonthDaysCount; d++) {
    nextMonthDays.push(d);
  }

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  const handleSelectDate = (dateKey) => {
    setSelectedDate(dateKey);
    setIsCalendarOpen(false);
  };

  const handleResetToOct1 = (e) => {
    e.stopPropagation();
    setSelectedDate("2026-10-01");
    setViewYear(2026);
    setViewMonth(9);
    setIsCalendarOpen(false);
  };

  const handleSelectAllDates = (e) => {
    e.stopPropagation();
    setSelectedDate(null);
    setIsCalendarOpen(false);
  };

  return (
    <div className="w-full flex flex-col gap-6 md:gap-8">
      {/* 1. Header Bar (Screenshot 2: H:78, R:20, Fill:#FFF) */}
      <section
        id="admin-finance-header-card"
        className="w-full min-h-[78px] bg-white rounded-[20px] px-6 md:px-8 py-3.5 flex items-center justify-between border border-[#E2E8F0]/70 shadow-sm"
      >
        <h1
          id="admin-finance-page-title"
          className="font-serif font-bold text-[24px] md:text-[28px] text-[#0A2569] leading-tight tracking-[-0.01em]"
        >
          Finance
        </h1>

        <div className="flex items-center">
          {!hideNotificationBell ? (
            <NotificationBell />
          ) : (
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-[#0A2569] hover:bg-gray-100 transition-colors">
              <Bell className="w-6 h-6" strokeWidth={1.8} />
            </div>
          )}
        </div>
      </section>

      {/* 2. Summary Cards Part (Screenshot 3: R:15, Fill:#FFF, 3 Metric Cards) */}
      <section
        id="admin-summary-cards-container"
        className="w-full bg-white rounded-[15px] p-5 sm:p-7 md:p-8 border border-[#E2E8F0]/70 shadow-sm"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
          {/* Card 1: Total Tickets Sold */}
          <div
            id="card-total-tickets-sold"
            className="w-full bg-[#EEF6FE] border-[1.5px] border-[#BFDBFE] rounded-[14px] p-5 md:py-6 flex flex-col items-center justify-center text-center shadow-2xs hover:shadow-sm transition-all"
          >
            <span className="font-sans font-bold text-[14px] md:text-[15px] text-[#0B72E7] tracking-tight">
              Total Tickets Sold
            </span>
            <span className="font-sans font-bold text-[32px] md:text-[36px] text-[#0B72E7] leading-tight mt-1.5">
              {summaryMetrics.ticketsSold.toLocaleString("en-US")}
            </span>
          </div>

          {/* Card 2: Revenue Collected */}
          <div
            id="card-revenue-collected"
            className="w-full bg-[#F0FDF4] border-[1.5px] border-[#86EFAC] rounded-[14px] p-5 md:py-6 flex flex-col items-center justify-center text-center shadow-2xs hover:shadow-sm transition-all"
          >
            <span className="font-sans font-bold text-[14px] md:text-[15px] text-[#16A34A] tracking-tight">
              Revenue Collected
            </span>
            <span className="font-sans font-bold text-[24px] sm:text-[26px] md:text-[28px] lg:text-[30px] text-[#15803D] leading-tight mt-1.5 truncate max-w-full px-2">
              {`LKR ${summaryMetrics.revenue.toLocaleString("en-US")}`}
            </span>
          </div>

          {/* Card 3: Platform Profit */}
          <div
            id="card-platform-profit"
            className="w-full bg-[#FFF7ED] border-[1.5px] border-[#FDBA74] rounded-[14px] p-4 sm:p-5 md:py-5 flex flex-col items-center justify-center text-center shadow-2xs hover:shadow-sm transition-all"
          >
            <span className="font-sans font-bold text-[14px] md:text-[15px] text-[#EA580C] tracking-tight">
              Platform Profit
            </span>
            <span className="font-sans font-bold text-[24px] sm:text-[26px] md:text-[28px] lg:text-[30px] text-[#EA580C] leading-tight mt-1">
              {`LKR ${summaryMetrics.platformProfit.toLocaleString("en-US")}`}
            </span>
            <span className="font-sans font-medium text-[11px] md:text-[12px] text-[#EA580C] mt-0.5 opacity-90">
              (Rs. 100 per ticket)
            </span>
          </div>
        </div>
      </section>

      {/* 3. Profit Analysis Part (Screenshot 4: R:15, Fill:#FFF, Table & Interactive Calendar) */}
      <section
        id="admin-profit-analysis-card"
        className="w-full bg-white rounded-[15px] p-6 sm:p-7 md:p-8 flex flex-col border border-[#E2E8F0]/70 shadow-sm"
      >
        {/* Header with Title and Interactive Calendar Date Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
          <div>
            <h2 className="font-sans font-bold text-[18px] md:text-[20px] text-[#0A2569] leading-snug">
              Profit Analysis
            </h2>
          </div>

          {/* Date Selector Button & Popover Calendar (Screenshot 4: Oct 01, 2026) */}
          <div className="relative" ref={calendarContainerRef}>
            <button
              type="button"
              id="profit-analysis-date-btn"
              onClick={() => setIsCalendarOpen((prev) => !prev)}
              aria-label="Select profit analysis date"
              className="h-[40px] px-4 min-w-[175px] bg-white border border-[#CBD5E1] rounded-[10px] flex items-center justify-between gap-3 text-[13px] md:text-[14px] font-medium text-[#1E293B] hover:bg-gray-50 hover:border-[#94A3B8] active:scale-[0.99] transition-all cursor-pointer shadow-2xs"
            >
              <div className="flex items-center gap-2.5">
                <CalendarIcon className="w-4 h-4 text-[#64748B]" strokeWidth={2} />
                <span className="font-semibold text-[#1E293B]">
                  {formatDateString(selectedDate)}
                </span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-[#64748B] transition-transform duration-200 ${
                  isCalendarOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Interactive Calendar Popover */}
            {isCalendarOpen && (
              <div
                id="profit-analysis-calendar-popover"
                className="absolute right-0 top-[calc(100%+8px)] w-[320px] sm:w-[340px] bg-white border border-[#E2E8F0] rounded-[16px] shadow-2xl p-4 z-40 animate-in fade-in zoom-in-95 duration-150"
              >
                {/* Calendar Header with Month/Year and navigation arrows */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    aria-label="Previous month"
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[#475569] hover:bg-[#F1F5F9] active:scale-95 transition-all cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-1.5 font-sans font-bold text-[15px] text-[#0A2569]">
                    <span>{MONTH_NAMES[viewMonth]}</span>
                    <span>{viewYear}</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleNextMonth}
                    aria-label="Next month"
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[#475569] hover:bg-[#F1F5F9] active:scale-95 transition-all cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Day of Week Headers */}
                <div className="grid grid-cols-7 gap-1 text-center mb-1">
                  {WEEKDAY_NAMES.map((name) => (
                    <div
                      key={name}
                      className="font-sans font-semibold text-[11px] text-[#94A3B8] py-1 select-none"
                    >
                      {name}
                    </div>
                  ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {/* Previous Month trailing days */}
                  {prevMonthDays.map((dayNum, idx) => (
                    <div
                      key={`prev-${idx}`}
                      className="h-9 flex items-center justify-center text-[13px] text-[#CBD5E1] select-none"
                    >
                      {dayNum}
                    </div>
                  ))}

                  {/* Current Month Days */}
                  {currentMonthDays.map(({ day, dateKey, hasEvents, isSelected }) => (
                    <button
                      key={dateKey}
                      type="button"
                      onClick={() => handleSelectDate(dateKey)}
                      className={`h-9 rounded-full flex flex-col items-center justify-center relative text-[13px] transition-all cursor-pointer select-none ${
                        isSelected
                          ? "bg-[#0B72E7] text-white font-bold shadow-sm"
                          : hasEvents
                          ? "text-[#0A2569] font-bold hover:bg-[#EEF6FE]"
                          : "text-[#334155] hover:bg-[#F1F5F9]"
                      }`}
                    >
                      <span>{day}</span>
                      {hasEvents && (
                        <span
                          className={`w-1 h-1 rounded-full absolute bottom-1 ${
                            isSelected ? "bg-white" : "bg-[#0B72E7]"
                          }`}
                        />
                      )}
                    </button>
                  ))}

                  {/* Next Month leading days */}
                  {nextMonthDays.map((dayNum, idx) => (
                    <div
                      key={`next-${idx}`}
                      className="h-9 flex items-center justify-center text-[13px] text-[#CBD5E1] select-none"
                    >
                      {dayNum}
                    </div>
                  ))}
                </div>

                {/* Calendar Footer / Quick Action Shortcuts */}
                <div className="mt-3 pt-3 border-t border-[#F1F5F9] flex flex-col gap-2">
                  <div className="flex items-center justify-between text-[11px] text-[#64748B]">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0B72E7]" />
                      <span>Has event records</span>
                    </div>
                    {selectedDate && (
                      <span className="font-medium text-[#0B72E7]">
                        {formatDateString(selectedDate)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 mt-1">
                    <button
                      type="button"
                      onClick={handleResetToOct1}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        selectedDate === "2026-10-01"
                          ? "bg-[#0B72E7] text-white"
                          : "bg-[#EEF6FE] text-[#0B72E7] hover:bg-[#DBEAFE]"
                      }`}
                    >
                      Oct 01, 2026 (Default)
                    </button>

                    <button
                      type="button"
                      onClick={handleSelectAllDates}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        selectedDate === null
                          ? "bg-[#0B72E7] text-white"
                          : "bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]"
                      }`}
                    >
                      All Dates
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Profit Analysis Table */}
        <div className="w-full overflow-x-auto rounded-[10px] border border-[#E2E8F0]/80">
          <table className="w-full text-left border-collapse min-w-[650px] md:min-w-0 table-auto md:table-fixed">
            <thead>
              <tr className="bg-[#E2EAF5] h-[46px] border-b border-[#D8E3F2]">
                <th className="px-5 sm:px-6 py-3 font-sans font-bold text-[11px] md:text-[12px] uppercase tracking-[0.05em] text-[#556987] md:w-[26%]">
                  EVENT NAME
                </th>
                <th className="px-4 sm:px-5 py-3 font-sans font-bold text-[11px] md:text-[12px] uppercase tracking-[0.05em] text-[#556987] md:w-[16%]">
                  TYPE
                </th>
                <th className="px-4 sm:px-5 py-3 font-sans font-bold text-[11px] md:text-[12px] uppercase tracking-[0.05em] text-[#556987] md:w-[16%]">
                  TICKETS SOLD
                </th>
                <th className="px-4 sm:px-5 py-3 font-sans font-bold text-[11px] md:text-[12px] uppercase tracking-[0.05em] text-[#556987] md:w-[22%]">
                  REVENUE
                </th>
                <th className="px-4 sm:px-6 py-3 font-sans font-bold text-[11px] md:text-[12px] uppercase tracking-[0.05em] text-[#556987] md:w-[20%]">
                  PLATFORM PROFIT
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.length > 0 ? (
                filteredEvents.map((evt, idx) => (
                  <tr
                    key={evt.id}
                    className={`h-[56px] border-b border-[#EEF2F6] transition-colors hover:bg-[#F8FAFC] ${
                      idx % 2 === 0 ? "bg-white" : "bg-[#FCFDFE]"
                    }`}
                  >
                    <td className="px-5 sm:px-6 py-4 font-sans font-medium text-[14px] md:text-[15px] text-[#1E293B]">
                      {evt.name}
                    </td>
                    <td className="px-4 sm:px-5 py-4 font-sans text-[14px] md:text-[15px] text-[#334155]">
                      {evt.type}
                    </td>
                    <td className="px-4 sm:px-5 py-4 font-sans text-[14px] md:text-[15px] text-[#334155]">
                      {evt.ticketsSold}
                    </td>
                    <td className="px-4 sm:px-5 py-4 font-sans text-[14px] md:text-[15px] text-[#334155]">
                      {formatCurrency(evt.revenue)}
                    </td>
                    <td className="px-4 sm:px-5 py-4 font-sans font-bold text-[14px] md:text-[15px] text-[#080480]">
                      {formatCurrency(evt.profit)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[#64748B]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <p className="text-[14px] font-medium text-[#475569]">
                        No profit records found for {formatDateString(selectedDate)}
                      </p>
                      <p className="text-[12px] text-[#94A3B8]">
                        Dates with event records are marked with blue dots in the calendar.
                      </p>
                      <div className="flex items-center gap-3 mt-3">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDate("2026-10-01");
                            setViewYear(2026);
                            setViewMonth(9);
                          }}
                          className="px-3 py-1.5 bg-[#EEF6FE] text-[#0B72E7] hover:bg-[#DBEAFE] rounded-md text-[12px] font-semibold cursor-pointer transition-colors"
                        >
                          View Oct 01, 2026
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedDate(null)}
                          className="px-3 py-1.5 bg-gray-100 text-[#475569] hover:bg-gray-200 rounded-md text-[12px] font-semibold cursor-pointer transition-colors"
                        >
                          View All Dates
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
