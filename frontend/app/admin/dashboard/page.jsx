"use client";

/**
 * Admin dashboard — ongoing event counts + recent events table.
 * API: GET /api/admin/dashboard
 */

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import StatCard from "@/components/dashboard/StatCard";
import EventsTable from "@/components/admin/EventsTable";
import AddEventModal from "@/components/admin/AddEventModal";
import ViewEventModal from "@/components/admin/ViewEventModal";
import TemplateEventModal from "@/components/admin/TemplateEventModal";
import UserCredentialsModal from "@/components/admin/UserCredentialsModal";
import ConfirmDeleteModal from "@/components/guests/ConfirmDeleteModal";
import { apiRequest } from "@/lib/api";
import { clearAuthSession, getAccessToken } from "@/lib/auth";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dashboard, setDashboard] = useState(null);
  const [viewEvent, setViewEvent] = useState(null);
  const [editEvent, setEditEvent] = useState(null);
  const [templateEvent, setTemplateEvent] = useState(null);
  const [credentialsEvent, setCredentialsEvent] = useState(null);
  const [deleteEvent, setDeleteEvent] = useState(null);
  const [saving, setSaving] = useState(false);

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

  const handleSave = async (payload) => {
    const token = getAccessToken();
    if (!token) throw new Error("Not authenticated");

    setSaving(true);
    try {
      if (payload.id) {
        await apiRequest(`/api/admin/events/${payload.id}`, {
          method: "PUT",
          token,
          body: payload,
        });
      } else {
        await apiRequest("/api/admin/events", {
          method: "POST",
          token,
          body: payload,
        });
      }
      setEditEvent(null);
      await loadDashboard();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteEvent?.id) return;
    const token = getAccessToken();
    if (!token) return;

    setSaving(true);
    try {
      await apiRequest(`/api/admin/events/${deleteEvent.id}`, {
        method: "DELETE",
        token,
      });
      setDeleteEvent(null);
      await loadDashboard();
    } catch (err) {
      setError(err.message || "Failed to delete event");
    } finally {
      setSaving(false);
    }
  };

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
        onViewEvent={setViewEvent}
        onEditEvent={setEditEvent}
        onTemplateEvent={setTemplateEvent}
        onCredentialsEvent={setCredentialsEvent}
        onDeleteEvent={setDeleteEvent}
        emptyMessage={
          loading
            ? "Loading events…"
            : "No ongoing events yet. Add one from the Events tab."
        }
      />

      <AddEventModal
        open={!!editEvent}
        onClose={() => setEditEvent(null)}
        onSubmit={handleSave}
        mode="edit"
        initialEvent={editEvent}
      />

      <ViewEventModal
        open={!!viewEvent}
        onClose={() => setViewEvent(null)}
        event={viewEvent}
      />

      <TemplateEventModal
        open={!!templateEvent}
        onClose={() => setTemplateEvent(null)}
        event={templateEvent}
        onSaved={loadDashboard}
      />

      <UserCredentialsModal
        open={!!credentialsEvent}
        onClose={() => setCredentialsEvent(null)}
        event={credentialsEvent}
      />

      <ConfirmDeleteModal
        open={!!deleteEvent}
        onClose={() => setDeleteEvent(null)}
        title="Delete Event"
        itemName={deleteEvent?.name}
        description="This will permanently remove the event from the admin catalogue."
        onConfirm={handleDelete}
      />

      {saving ? (
        <p className="sr-only" aria-live="polite">
          Saving…
        </p>
      ) : null}
    </div>
  );
}
