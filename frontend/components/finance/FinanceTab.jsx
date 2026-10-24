"use client";

import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { Search, ChevronDown, Check, Bell, AlertCircle } from "lucide-react";
import { NotificationBell } from "@/components/ui/NotificationPanel";
import { apiRequest } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

function formatCurrency(amount) {
  return `LKR ${Number(amount || 0).toLocaleString("en-US")}`;
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

function statusLabel(paymentStatus) {
  const s = String(paymentStatus || "").toLowerCase();
  if (s === "paid") return "Paid";
  if (s === "failed") return "Failed";
  return "Pending";
}

function buildSalesFromRows(rows) {
  const map = new Map();
  for (const row of rows) {
    if (String(row.paymentStatus || "").toLowerCase() !== "paid") continue;
    const name = row.tierName || "Ticket";
    const prev = map.get(name) || { id: name, name, sold: 0, amount: 0 };
    prev.sold += 1;
    prev.amount += Number(row.price) || 0;
    map.set(name, prev);
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function buildTransactionsFromRows(rows) {
  const byOrder = new Map();
  for (const row of rows) {
    const orderId = row.orderId || row.ticketId;
    const key = `${orderId}::${row.tierName || ""}`;
    const prev = byOrder.get(key) || {
      id: key,
      date: formatDateTime(row.orderCreatedAt || row.issuedAt),
      ref: row.paymentRef || row.orderId || row.ticketCode || "—",
      guest: row.buyerName || "—",
      type: row.tierName || "Ticket",
      quantity: 0,
      amount: 0,
      status: statusLabel(row.paymentStatus),
      sortAt: row.orderCreatedAt || row.issuedAt || "",
    };
    prev.quantity += 1;
    prev.amount += Number(row.price) || 0;
    prev.status = statusLabel(row.paymentStatus);
    byOrder.set(key, prev);
  }
  return Array.from(byOrder.values()).sort((a, b) =>
    String(b.sortAt).localeCompare(String(a.sortAt))
  );
}

export default function FinanceTab({ hideNotificationBell = false }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ticketSales, setTicketSales] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const loadFinances = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setError("Sign in required");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest("/api/couple/finances", { token });
      const rows = Array.isArray(data?.rows) ? data.rows : [];
      setTicketSales(buildSalesFromRows(rows));
      setTransactions(buildTransactionsFromRows(rows));
    } catch (err) {
      setError(err?.message || "Failed to load finances");
      setTicketSales([]);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFinances();
  }, [loadFinances]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const totals = useMemo(() => {
    const totalQty = ticketSales.reduce((sum, item) => sum + item.sold, 0);
    const totalAmount = ticketSales.reduce((sum, item) => sum + item.amount, 0);
    return { quantity: totalQty, amount: totalAmount };
  }, [ticketSales]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (statusFilter !== "All Status") {
        if (tx.status.toLowerCase() !== statusFilter.toLowerCase()) {
          return false;
        }
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        tx.guest.toLowerCase().includes(q) ||
        tx.ref.toLowerCase().includes(q) ||
        tx.type.toLowerCase().includes(q) ||
        tx.date.toLowerCase().includes(q) ||
        tx.status.toLowerCase().includes(q) ||
        String(tx.amount).includes(q) ||
        formatCurrency(tx.amount).toLowerCase().includes(q)
      );
    });
  }, [searchQuery, statusFilter, transactions]);

  return (
    <div className="w-full flex flex-col gap-6 md:gap-8">
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

      {error ? (
        <div className="flex items-start gap-2 rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

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
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-10 text-center text-[#64748B] text-sm">
                    Loading sales…
                  </td>
                </tr>
              ) : ticketSales.length ? (
                ticketSales.map((ticket, index) => (
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
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-10 text-center text-[#64748B] text-sm">
                    No paid ticket sales yet
                  </td>
                </tr>
              )}

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

          <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
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
                  {["All Status", "Paid", "Pending", "Failed"].map((status) => (
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
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[#64748B] text-sm">
                    Loading transactions…
                  </td>
                </tr>
              ) : filteredTransactions.length > 0 ? (
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
                      ) : tx.status === "Failed" ? (
                        <span className="inline-flex items-center justify-center min-w-[70px] px-3 py-0.5 rounded-full text-[12px] font-semibold bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA]">
                          Failed
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
