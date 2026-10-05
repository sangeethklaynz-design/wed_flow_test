"use client";

/**
 * Admin dashboard — ongoing event counts + recent events table.
 * API: GET /api/admin/dashboard
 */

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import StatCard from "@/components/dashboard/StatCard";
import EventsTable from "@/components/admin/EventsTable";
import { apiRequest } from "@/lib/api";
import { clearAuthSession, getAccessToken } from "@/lib/auth";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dashboard, setDashboard] = useState(null);

  const loadDashboard = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    try {
      const data = await apiRequest("/api/admin/dashboard", { token });
      setDashboard(data);
      setError("");
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        clearAuthSession();
        router.replace("/login");
        return;
      }
      setError(err.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const stats = dashboard?.stats;
  const fallback = dashboard ? "0" : "—";

  const statCards = [
    {
      title: "Ongoing events",
      value: String(stats?.ongoingTotal ?? fallback),
      dotColor: "bg-navy",
    },
    {
      title: "Weddings",
      value: String(stats?.weddings ?? fallback),
      dotColor: "bg-[#054380]",
    },
    {
      title: "Corporate events",
      value: String(stats?.corporate ?? fallback),
      dotColor: "bg-[#3b82f6]",
    },
    {
      title: "Parties",
      value: String(stats?.parties ?? fallback),
      dotColor: "bg-[#60a5fa]",
    },
  ];

  return (
    <div className="p-6 md:p-8 lg:p-12 w-full min-w-0">
      <div className="md:hidden mb-6">
        <h1 className="font-serif font-bold text-3xl text-navy">Dashboard</h1>
      </div>

      <div className="hidden md:flex justify-between items-center mb-8 bg-white p-5 rounded-2xl border border-border">
        <h1 className="font-serif font-bold text-2xl text-navy">Dashboard</h1>
      </div>

      {error ? (
        <div className="mb-6 bg-red-50 border border-red-100 text-red-600 text-sm rounded-2xl px-4 py-3">
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className="text-muted text-sm mb-6">Loading dashboard…</p>
      ) : null}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => (
          <StatCard
            key={card.title}
            title={card.title}
            value={card.value}
            dotColor={card.dotColor}
          />
        ))}
      </div>

      <div className="mb-4">
        <h2 className="font-serif font-bold text-xl text-navy">
          Recent ongoing events
        </h2>
        <p className="text-sm text-muted mt-1">
          Upcoming and today&apos;s events, soonest first.
        </p>
      </div>

      <EventsTable
        events={dashboard?.recentEvents || []}
        showActions={false}
        emptyMessage={
          loading
            ? "Loading events…"
            : "No ongoing events yet. Add one from the Events tab."
        }
      />
    </div>
  );
}
