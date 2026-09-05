"use client";

/**
 * Dashboard home — stats, RSVP breakdown, countdown.
 * API: GET /api/couple/dashboard
 * Stats are computed from the same guest records as the Guests page.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { NotificationBell } from "@/components/ui/NotificationPanel";
import StatCard from "@/components/dashboard/StatCard";
import RsvpBreakdown from "@/components/dashboard/RsvpBreakdown";
import Countdown from "@/components/dashboard/Countdown";
import { apiRequest } from "@/lib/api";
import { getAccessToken, getStoredUser, clearAuthSession } from "@/lib/auth";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dashboard, setDashboard] = useState(null);
  const [storedUser, setStoredUser] = useState(null);
  const fetchInProgressRef = useRef(false);

  const loadDashboard = useCallback(async ({ silent = false } = {}) => {
    const token = getAccessToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    if (fetchInProgressRef.current) return;
    fetchInProgressRef.current = true;

    if (!silent) setLoading(true);

    try {
      const data = await apiRequest("/api/couple/dashboard", { token });
      setDashboard(data);
      setError("");
    } catch (err) {
      if (err.status === 401) {
        clearAuthSession();
        router.replace("/login");
        return;
      }
      setError(err.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
      fetchInProgressRef.current = false;
    }
  }, [router]);

  useEffect(() => {
    setStoredUser(getStoredUser());
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const POLL_MS = 2500;
    const maybePoll = () => {
      if (document.visibilityState !== "visible") return;
      loadDashboard({ silent: true });
    };

    const intervalId = window.setInterval(maybePoll, POLL_MS);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") maybePoll();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [loadDashboard]);

  const coupleNames =
    dashboard?.wedding?.coupleNames ||
    (storedUser?.brideName && storedUser?.groomName
      ? `${storedUser.brideName} & ${storedUser.groomName}`
      : null) ||
    storedUser?.coupleNames ||
    "Welcome";
  const initials =
    dashboard?.wedding?.initials ||
    storedUser?.initials ||
    "W";
  const stats = dashboard?.stats;
  const fallback = dashboard ? "0" : "—";

  const statCards = [
    {
      title: "Guests invited",
      value: String(stats?.guestsInvited ?? fallback),
      dotColor: "bg-navy",
    },
    {
      title: "RSVP confirmed",
      value: String(stats?.rsvpConfirmed ?? fallback),
      dotColor: "bg-green-500",
    },
    {
      title: "Pending",
      value: String(stats?.pending ?? fallback),
      dotColor: "bg-orange-400",
    },
    {
      title: "Declined",
      value: String(stats?.declined ?? fallback),
      dotColor: "bg-red-500",
    },
  ];

  const breakdownStats = [
    {
      label: "Confirmed",
      value: String(stats?.rsvpConfirmed ?? "0"),
      color: "bg-green-500",
    },
    {
      label: "Pending",
      value: String(stats?.pending ?? "0"),
      color: "bg-orange-400",
    },
    {
      label: "Declined",
      value: String(stats?.declined ?? "0"),
      color: "bg-red-500",
    },
  ];

  return (
    <div className="p-6 md:p-8 lg:p-12 w-full">
      <div className="md:hidden flex justify-between items-center mb-8">
        <div>
          <p className="text-muted text-sm mb-1">Welcome back</p>
          <h1 className="font-serif font-bold text-2xl text-navy">
            {coupleNames}
          </h1>
          <span className="inline-block mt-2 text-[10px] bg-[#fcecd4] text-[#e69e46] px-3 py-1 rounded-full font-medium">
            Premium Membership
          </span>
        </div>
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-[#1A1D2E] border-2 border-[#e69e46] shadow-sm"
          title="Premium member"
        >
          <span className="font-serif font-bold text-[#e69e46] text-xs leading-none tracking-tight">
            {initials}
          </span>
        </div>
      </div>

      <div className="hidden md:flex justify-between items-center mb-8 bg-white p-5 rounded-2xl border border-border">
        <h1 className="font-serif font-bold text-2xl text-navy">Dashboard</h1>
        <NotificationBell />
      </div>

      <h2 className="md:hidden font-serif font-bold text-3xl text-navy mb-6">
        Dashboard
      </h2>

      {error ? (
        <div className="mb-6 bg-red-50 border border-red-100 text-red-600 text-sm rounded-2xl px-4 py-3">
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className="text-muted text-sm mb-6">Loading dashboard…</p>
      ) : null}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
        {statCards.map((stat, idx) => (
          <StatCard key={idx} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
        <Countdown targetDate={dashboard?.wedding?.weddingDate} />
        <RsvpBreakdown stats={breakdownStats} />
      </div>
    </div>
  );
}
