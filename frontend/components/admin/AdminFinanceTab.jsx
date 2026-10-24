"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, Eye, Search } from "lucide-react";
import { NotificationBell } from "@/components/ui/NotificationPanel";
import RowActionsMenu from "@/components/ui/RowActionsMenu";
import AdminFinanceDetailModal from "@/components/admin/AdminFinanceDetailModal";
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

export default function AdminFinanceTab({ hideNotificationBell = false }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [vendors, setVendors] = useState([]);
  const [organizationId, setOrganizationId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({
    ticketCount: 0,
    grossRevenue: 0,
  });
  const [openMenuId, setOpenMenuId] = useState(null);
  const [detailTicket, setDetailTicket] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadMeta = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    try {
      const data = await apiRequest("/api/admin/finances/meta", { token });
      setVendors(data.vendors || []);
    } catch (err) {
      setError(err.message || "Failed to load merchants");
    }
  }, []);

  const loadFinances = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (organizationId) params.set("organizationId", organizationId);
      if (statusFilter && statusFilter !== "all") {
        params.set("paymentStatus", statusFilter);
      }
      if (searchQuery.trim()) params.set("q", searchQuery.trim());
      const qs = params.toString();
      const data = await apiRequest(
        `/api/admin/finances${qs ? `?${qs}` : ""}`,
        { token }
      );
      setRows(Array.isArray(data?.rows) ? data.rows : []);
      setSummary({
        ticketCount: Number(data?.summary?.ticketCount) || 0,
        grossRevenue: Number(data?.summary?.grossRevenue) || 0,
      });
    } catch (err) {
      setError(err.message || "Failed to load finances");
      setRows([]);
      setSummary({ ticketCount: 0, grossRevenue: 0 });
    } finally {
      setLoading(false);
    }
  }, [organizationId, statusFilter, searchQuery]);

  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  useEffect(() => {
    const t = setTimeout(() => loadFinances(), 200);
    return () => clearTimeout(t);
  }, [loadFinances]);

  const platformProfit = useMemo(
    () => summary.ticketCount * 100,
    [summary.ticketCount]
  );

  const handleViewDetail = async (row) => {
    const token = getAccessToken();
    if (!token || !row?.ticketId) return;
    setDetailLoading(true);
    try {
      const data = await apiRequest(
        `/api/admin/finances/tickets/${encodeURIComponent(row.ticketId)}`,
        { token }
      );
      setDetailTicket(data.ticket || row);
    } catch {
      setDetailTicket(row);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 md:gap-8">
      <section className="w-full min-h-[78px] bg-white rounded-[20px] px-6 md:px-8 py-3.5 flex items-center justify-between border border-[#E2E8F0]/70 shadow-sm">
        <h1 className="font-serif font-bold text-[24px] md:text-[28px] text-[#0A2569] leading-tight tracking-[-0.01em]">
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
        <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-2xl px-4 py-3">
          {error}
        </div>
      ) : null}

      <section className="w-full bg-white rounded-[15px] p-5 sm:p-7 md:p-8 border border-[#E2E8F0]/70 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
          <div className="w-full bg-[#EEF6FE] border-[1.5px] border-[#BFDBFE] rounded-[14px] p-5 md:py-6 flex flex-col items-center justify-center text-center">
            <span className="font-sans font-bold text-[14px] md:text-[15px] text-[#0B72E7]">
              Total Tickets Sold
            </span>
            <span className="font-sans font-bold text-[32px] md:text-[36px] text-[#0B72E7] leading-tight mt-1.5">
              {summary.ticketCount.toLocaleString("en-US")}
            </span>
          </div>
          <div className="w-full bg-[#F0FDF4] border-[1.5px] border-[#86EFAC] rounded-[14px] p-5 md:py-6 flex flex-col items-center justify-center text-center">
            <span className="font-sans font-bold text-[14px] md:text-[15px] text-[#16A34A]">
              Revenue Collected
            </span>
            <span className="font-sans font-bold text-[24px] sm:text-[26px] md:text-[28px] text-[#15803D] leading-tight mt-1.5">
              {formatCurrency(summary.grossRevenue)}
            </span>
          </div>
          <div className="w-full bg-[#FFF7ED] border-[1.5px] border-[#FDBA74] rounded-[14px] p-4 sm:p-5 md:py-5 flex flex-col items-center justify-center text-center">
            <span className="font-sans font-bold text-[14px] md:text-[15px] text-[#EA580C]">
              Platform Profit
            </span>
            <span className="font-sans font-bold text-[24px] sm:text-[26px] md:text-[28px] text-[#EA580C] leading-tight mt-1">
              {formatCurrency(platformProfit)}
            </span>
            <span className="font-sans font-medium text-[11px] md:text-[12px] text-[#EA580C] mt-0.5 opacity-90">
              (Rs. 100 per ticket)
            </span>
          </div>
        </div>
      </section>

      <section className="w-full bg-white rounded-[15px] p-6 sm:p-7 md:p-8 flex flex-col border border-[#E2E8F0]/70 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
          <div>
            <h2 className="font-sans font-bold text-[18px] md:text-[20px] text-[#0A2569] leading-snug">
              Transactions
            </h2>
            <p className="text-[13px] md:text-[14px] text-[#64748B] mt-1">
              Ticket payments across merchants
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap justify-end ml-auto">
            <div className="relative w-full sm:w-[220px]">
              <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search transactions…"
                className="w-full h-[38px] pl-9 pr-3.5 text-[13px] bg-white text-[#1E293B] border border-[#CBD5E1] rounded-[10px] focus:outline-none focus:ring-1 focus:ring-[#0B72E7]"
              />
            </div>

            <select
              value={organizationId}
              onChange={(e) => setOrganizationId(e.target.value)}
              className="h-[38px] px-3 min-w-[150px] bg-white border border-[#CBD5E1] rounded-[10px] text-[13px] font-medium text-[#1E293B] text-center"
            >
              <option value="">All merchants</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-[38px] px-3 min-w-[130px] bg-white border border-[#CBD5E1] rounded-[10px] text-[13px] font-medium text-[#1E293B] text-center"
            >
              <option value="all">All status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        <div className="w-full overflow-x-auto rounded-[10px] border border-[#E2E8F0]/80">
          <table className="w-full text-center border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-[#E2EAF5] h-[46px] border-b border-[#D8E3F2]">
                <th className="px-4 py-3 font-sans font-bold text-[11px] md:text-[12px] uppercase tracking-[0.05em] text-[#556987] text-center">
                  Date
                </th>
                <th className="px-4 py-3 font-sans font-bold text-[11px] md:text-[12px] uppercase tracking-[0.05em] text-[#556987] text-center">
                  Merchant
                </th>
                <th className="px-4 py-3 font-sans font-bold text-[11px] md:text-[12px] uppercase tracking-[0.05em] text-[#556987] text-center">
                  Guest
                </th>
                <th className="px-4 py-3 font-sans font-bold text-[11px] md:text-[12px] uppercase tracking-[0.05em] text-[#556987] text-center">
                  Ticket
                </th>
                <th className="px-4 py-3 font-sans font-bold text-[11px] md:text-[12px] uppercase tracking-[0.05em] text-[#556987] text-center">
                  Amount
                </th>
                <th className="px-4 py-3 font-sans font-bold text-[11px] md:text-[12px] uppercase tracking-[0.05em] text-[#556987] text-center">
                  Status
                </th>
                <th className="px-4 py-3 font-sans font-bold text-[11px] md:text-[12px] uppercase tracking-[0.05em] text-[#556987] text-center">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading || detailLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-sm text-[#64748B] text-center">
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-sm text-[#64748B] text-center">
                    No transactions found
                  </td>
                </tr>
              ) : (
                rows.map((row, idx) => {
                  const status = statusLabel(row.paymentStatus);
                  return (
                    <tr
                      key={row.ticketId}
                      className={`h-[56px] border-b border-[#EEF2F6] hover:bg-[#F8FAFC] ${
                        idx % 2 === 0 ? "bg-white" : "bg-[#FCFDFE]"
                      }`}
                    >
                      <td className="px-4 py-3.5 text-[13px] md:text-[14px] text-[#334155] text-center whitespace-nowrap">
                        {formatDateTime(row.orderCreatedAt || row.issuedAt)}
                      </td>
                      <td className="px-4 py-3.5 text-[13px] md:text-[14px] text-[#334155] text-center">
                        {row.organizationName || "—"}
                      </td>
                      <td className="px-4 py-3.5 text-[13px] md:text-[14px] text-[#1E293B] font-medium text-center">
                        {row.buyerName || "—"}
                      </td>
                      <td className="px-4 py-3.5 text-[13px] md:text-[14px] text-[#334155] text-center">
                        {row.tierName || "—"}
                      </td>
                      <td className="px-4 py-3.5 text-[13px] md:text-[14px] text-[#334155] text-center whitespace-nowrap">
                        {formatCurrency(row.price)}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {status === "Paid" ? (
                          <span className="inline-flex min-w-[70px] px-3 py-0.5 rounded-full text-[12px] font-semibold bg-[#DCFCE7] text-[#16A34A] border border-[#86EFAC]">
                            Paid
                          </span>
                        ) : status === "Failed" ? (
                          <span className="inline-flex min-w-[70px] px-3 py-0.5 rounded-full text-[12px] font-semibold bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA]">
                            Failed
                          </span>
                        ) : (
                          <span className="inline-flex min-w-[70px] px-3 py-0.5 rounded-full text-[12px] font-semibold bg-[#FEF3C7] text-[#D97706] border border-[#FCD34D]">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="inline-flex justify-center">
                          <RowActionsMenu
                            id={row.ticketId}
                            openId={openMenuId}
                            setOpenId={setOpenMenuId}
                            label={`Actions for ${row.ticketCode || row.ticketId}`}
                            items={[
                              {
                                label: "View detail",
                                icon: Eye,
                                onClick: () => handleViewDetail(row),
                              },
                            ]}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <AdminFinanceDetailModal
        open={Boolean(detailTicket)}
        ticket={detailTicket}
        onClose={() => setDetailTicket(null)}
      />
    </div>
  );
}
