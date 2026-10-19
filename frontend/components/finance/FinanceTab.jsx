"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { Search, ChevronDown, Check, Bell } from "lucide-react";
import { NotificationBell } from "@/components/ui/NotificationPanel";

const DEFAULT_TICKET_SALES = [
  { id: "standard", name: "Standard", sold: 180, amount: 180000 },
  { id: "vip", name: "VIP", sold: 90, amount: 180000 },
  { id: "premium", name: "Premium", sold: 50, amount: 250000 },
];

const DEFAULT_TRANSACTIONS = [
  {
    id: "tx-1",
    date: "Oct 28, 2026, 10:24 AM",
    ref: "TXN987654321",
    guest: "Kavindu Perera",
    type: "Standard",
    quantity: 3,
    amount: 3000,
    status: "Paid",
  },
  {
    id: "tx-2",
    date: "Oct 27, 2026, 04:15 PM",
    ref: "TXN987654320",
    guest: "Nimesh Fernando",
    type: "VIP",
    quantity: 2,
    amount: 4000,
    status: "Paid",
  },
  {
    id: "tx-3",
    date: "Oct 26, 2026, 03:14 PM",
    ref: "TXN987654341",
    guest: "Hashini Silva",
    type: "Premium",
    quantity: 1,
    amount: 5000,
    status: "Paid",
  },
  {
    id: "tx-4",
    date: "Oct 28, 2026, 10:24 AM",
    ref: "TXN987654321",
    guest: "Kavindu Perera",
    type: "Standard",
    quantity: 3,
    amount: 3000,
    status: "Pending",
  },
];

function formatCurrency(amount) {
  return `LKR ${Number(amount || 0).toLocaleString("en-US")}`;
}

export default function FinanceTab({ hideNotificationBell = false }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef(null);

  // Close filter dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Compute total sales metrics
  const totals = useMemo(() => {
    const totalQty = DEFAULT_TICKET_SALES.reduce((sum, item) => sum + item.sold, 0);
    const totalAmount = DEFAULT_TICKET_SALES.reduce((sum, item) => sum + item.amount, 0);
    return {
      quantity: totalQty,
      amount: totalAmount,
    };
  }, []);

  // Filter transactions based on search and status
  const filteredTransactions = useMemo(() => {
    return DEFAULT_TRANSACTIONS.filter((tx) => {
      // Status filter
      if (statusFilter !== "All Status") {
        if (tx.status.toLowerCase() !== statusFilter.toLowerCase()) {
          return false;
        }
      }

      // Search query filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const matchGuest = tx.guest.toLowerCase().includes(q);
      const matchRef = tx.ref.toLowerCase().includes(q);
      const matchType = tx.type.toLowerCase().includes(q);
      const matchDate = tx.date.toLowerCase().includes(q);
      const matchStatus = tx.status.toLowerCase().includes(q);
      const matchAmount = String(tx.amount).includes(q) || formatCurrency(tx.amount).toLowerCase().includes(q);

      return matchGuest || matchRef || matchType || matchDate || matchStatus || matchAmount;
    });
  }, [searchQuery, statusFilter]);

  return (
    <div className="w-full flex flex-col gap-6 md:gap-8">
      {/* 1. Header Card (Screenshot 2: H:78, R:20, Fill:#FFF) */}
      <section
        id="finance-header-card"
        className="w-full min-h-[78px] bg-white rounded-[20px] px-6 md:px-8 py-3.5 flex items-center justify-between border border-[#E2E8F0]/70 shadow-sm"
      >
        <h1
          id="finance-page-title"
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

      {/* 2. Ticket Sales Card (Screenshot 3: R:15, Fill:#FFF) */}
      <section
        id="ticket-sales-card"
        className="w-full bg-white rounded-[15px] p-6 sm:p-7 md:p-8 flex flex-col border border-[#E2E8F0]/70 shadow-sm"
      >
        <div className="mb-5">
          <h2 className="font-sans font-bold text-[18px] md:text-[20px] text-[#0A2569] leading-snug">
            Ticket Sales
          </h2>
          <p className="text-[13px] md:text-[14px] text-[#64748B] mt-1">
            Overview of ticket sales for the event.
          </p>
        </div>

        {/* Ticket Sales Table */}
        <div className="w-full overflow-x-auto rounded-[10px] border border-[#E2E8F0]/80">
          <table className="w-full text-left border-collapse min-w-[480px]">
            <thead>
              <tr className="bg-[#E2EAF5] h-[46px] border-b border-[#D8E3F2]">
                <th className="px-5 sm:px-6 py-3 font-sans font-bold text-[11px] md:text-[12px] uppercase tracking-[0.05em] text-[#556987] w-[40%]">
                  TICKET NAME
                </th>
                <th className="px-5 sm:px-6 py-3 font-sans font-bold text-[11px] md:text-[12px] uppercase tracking-[0.05em] text-[#556987] w-[30%]">
                  QUANTITY SOLD
                </th>
                <th className="px-5 sm:px-6 py-3 font-sans font-bold text-[11px] md:text-[12px] uppercase tracking-[0.05em] text-[#556987] w-[30%]">
                  AMOUNT (LKR)
                </th>
              </tr>
            </thead>
            <tbody>
              {DEFAULT_TICKET_SALES.map((ticket, index) => (
                <tr
                  key={ticket.id}
                  className={`h-[56px] border-b border-[#EEF2F6] transition-colors hover:bg-[#F8FAFC] ${
                    index % 2 === 0 ? "bg-white" : "bg-[#FCFDFE]"
                  }`}
                >
                  <td className="px-5 sm:px-6 py-4 font-sans font-medium text-[14px] md:text-[15px] text-[#1E293B]">
                    {ticket.name}
                  </td>
                  <td className="px-5 sm:px-6 py-4 font-sans font-medium text-[14px] md:text-[15px] text-[#1E293B]">
                    {ticket.sold}
                  </td>
                  <td className="px-5 sm:px-6 py-4 font-sans font-medium text-[14px] md:text-[15px] text-[#1E293B]">
                    {`LKR ${Number(ticket.amount).toLocaleString("en-US").replace(/,/g, ", ")}`}
                  </td>
                </tr>
              ))}

              {/* Total Row (Screenshot 3: Highlighted blue row #DCE8FA) */}
              <tr className="bg-[#DCE8FA] h-[58px] border-t-2 border-[#CBDDF6]">
                <td className="px-5 sm:px-6 py-4 font-sans font-bold text-[14px] md:text-[15px] text-[#080480]">
                  Total
                </td>
                <td className="px-5 sm:px-6 py-4 font-sans font-bold text-[14px] md:text-[15px] text-[#080480]">
                  {totals.quantity}
                </td>
                <td className="px-5 sm:px-6 py-4 font-sans font-bold text-[14px] md:text-[15px] text-[#080480]">
                  {`LKR ${Number(totals.amount).toLocaleString("en-US").replace(/,/g, ", ")}`}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. Transactions Card (Screenshot 4: R:15, Fill:#FFF) */}
      <section
        id="transactions-card"
        className="w-full bg-white rounded-[15px] p-6 sm:p-7 md:p-8 flex flex-col border border-[#E2E8F0]/70 shadow-sm"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
          <div>
            <h2 className="font-sans font-bold text-[18px] md:text-[20px] text-[#0A2569] leading-snug">
              Transactions
            </h2>
            <p className="text-[13px] md:text-[14px] text-[#64748B] mt-1">
              Recent ticket payments and transactions
            </p>
          </div>

          {/* Controls: Search and Status Filter */}
          <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
            {/* Search Input */}
            <div className="relative w-full sm:w-[220px] md:w-[240px]">
              <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="search-transactions-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search transactions...."
                className="w-full h-[38px] pl-9 pr-3.5 text-[13px] bg-white text-[#1E293B] placeholder:text-[#94A3B8] border border-[#CBD5E1] rounded-[10px] transition-all focus:outline-none focus:ring-1 focus:ring-[#0B72E7] focus:border-[#0B72E7]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 px-1"
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Status Dropdown */}
            <div className="relative" ref={filterRef}>
              <button
                type="button"
                id="transactions-status-filter-btn"
                onClick={() => setIsFilterOpen((prev) => !prev)}
                className="h-[38px] px-3.5 min-w-[120px] bg-white border border-[#CBD5E1] rounded-[10px] flex items-center justify-between gap-2 text-[13px] font-medium text-[#1E293B] hover:bg-gray-50 active:scale-[0.99] transition-all cursor-pointer shadow-2xs"
              >
                <span>{statusFilter}</span>
                <ChevronDown
                  className={`w-4 h-4 text-[#64748B] transition-transform duration-200 ${
                    isFilterOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isFilterOpen && (
                <div
                  id="transactions-status-dropdown-menu"
                  className="absolute right-0 mt-1.5 w-[140px] bg-white border border-[#E2E8F0] rounded-[10px] shadow-lg py-1.5 z-30 animate-in fade-in zoom-in-95 duration-150"
                >
                  {["All Status", "Paid", "Pending"].map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => {
                        setStatusFilter(status);
                        setIsFilterOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 text-[13px] flex items-center justify-between transition-colors ${
                        statusFilter === status
                          ? "bg-[#EEF5FF] text-[#080480] font-semibold"
                          : "text-[#334155] hover:bg-[#F8FAFC]"
                      }`}
                    >
                      <span>{status}</span>
                      {statusFilter === status && (
                        <Check className="w-3.5 h-3.5 text-[#080480]" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="w-full overflow-x-auto rounded-[10px] border border-[#E2E8F0]/80">
          <table className="w-full text-left border-collapse min-w-[650px] md:min-w-0 table-auto md:table-fixed">
            <thead>
              <tr className="bg-[#E2EAF5] h-[46px] border-b border-[#D8E3F2]">
                <th className="px-3 sm:px-4 py-3 font-sans font-bold text-[11px] md:text-[12px] uppercase tracking-[0.05em] text-[#556987] md:w-[20%]">
                  DATE & TIME
                </th>
                <th className="px-3 sm:px-4 py-3 font-sans font-bold text-[11px] md:text-[12px] uppercase tracking-[0.05em] text-[#556987] md:w-[17%]">
                  <div>TRANSACTION/</div>
                  <div>REFERENCE</div>
                </th>
                <th className="px-3 sm:px-4 py-3 font-sans font-bold text-[11px] md:text-[12px] uppercase tracking-[0.05em] text-[#556987] md:w-[17%]">
                  GUEST
                </th>
                <th className="px-3 sm:px-4 py-3 font-sans font-bold text-[11px] md:text-[12px] uppercase tracking-[0.05em] text-[#556987] md:w-[13%]">
                  TICKET TYPE
                </th>
                <th className="px-3 sm:px-4 py-3 font-sans font-bold text-[11px] md:text-[12px] uppercase tracking-[0.05em] text-[#556987] md:w-[9%]">
                  QUANTITY
                </th>
                <th className="px-3 sm:px-4 py-3 font-sans font-bold text-[11px] md:text-[12px] uppercase tracking-[0.05em] text-[#556987] md:w-[13%]">
                  AMOUNT (LKR)
                </th>
                <th className="px-3 sm:px-4 py-3 font-sans font-bold text-[11px] md:text-[12px] uppercase tracking-[0.05em] text-[#556987] text-center md:w-[11%]">
                  STATUS
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((tx, idx) => (
                  <tr
                    key={tx.id}
                    className={`h-[56px] border-b border-[#EEF2F6] transition-colors hover:bg-[#F8FAFC] ${
                      idx % 2 === 0 ? "bg-white" : "bg-[#FCFDFE]"
                    }`}
                  >
                    <td className="px-3 sm:px-4 py-3.5 font-sans text-[13px] md:text-[14px] text-[#334155] whitespace-nowrap">
                      {tx.date}
                    </td>
                    <td className="px-3 sm:px-4 py-3.5 font-sans font-medium text-[13px] md:text-[14px] text-[#334155]">
                      {tx.ref}
                    </td>
                    <td className="px-3 sm:px-4 py-3.5 font-sans font-medium text-[13px] md:text-[14px] text-[#1E293B]">
                      {tx.guest}
                    </td>
                    <td className="px-3 sm:px-4 py-3.5 font-sans text-[13px] md:text-[14px] text-[#334155]">
                      {tx.type}
                    </td>
                    <td className="px-3 sm:px-4 py-3.5 font-sans text-[13px] md:text-[14px] text-[#334155]">
                      {tx.quantity}
                    </td>
                    <td className="px-3 sm:px-4 py-3.5 font-sans font-medium text-[13px] md:text-[14px] text-[#334155] whitespace-nowrap">
                      {formatCurrency(tx.amount)}
                    </td>
                    <td className="px-3 sm:px-4 py-3.5 text-center">
                      {tx.status === "Paid" ? (
                        <span className="inline-flex items-center justify-center min-w-[70px] px-3 py-0.5 rounded-full text-[12px] font-semibold bg-[#DCFCE7] text-[#16A34A] border border-[#86EFAC]">
                          Paid
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center min-w-[70px] px-3 py-0.5 rounded-full text-[12px] font-semibold bg-[#FEF3C7] text-[#D97706] border border-[#FCD34D]">
                          Pending
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[#64748B]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <p className="text-[14px] font-medium text-[#475569]">
                        No transactions found
                      </p>
                      <p className="text-[12px] text-[#94A3B8]">
                        {searchQuery
                          ? `No results matching "${searchQuery}"`
                          : "No transactions available for the selected filter."}
                      </p>
                      {(searchQuery || statusFilter !== "All Status") && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery("");
                            setStatusFilter("All Status");
                          }}
                          className="mt-2 text-[12px] font-semibold text-[#0B72E7] hover:underline"
                        >
                          Clear filters
                        </button>
                      )}
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
