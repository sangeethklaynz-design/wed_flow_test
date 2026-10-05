"use client";

/**
 * Admin events catalogue — list, filter, search, create/edit/delete/template.
 * APIs: GET|POST|PUT|DELETE /api/admin/events
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";
import AddEventModal from "@/components/admin/AddEventModal";
import EventsTable from "@/components/admin/EventsTable";
import ViewEventModal from "@/components/admin/ViewEventModal";
import TemplateEventModal from "@/components/admin/TemplateEventModal";
import UserCredentialsModal from "@/components/admin/UserCredentialsModal";
import ConfirmDeleteModal from "@/components/guests/ConfirmDeleteModal";
import { apiRequest } from "@/lib/api";
import { clearAuthSession, getAccessToken } from "@/lib/auth";
import {
  EVENT_STATUS_FILTERS,
  EVENT_TYPE_FILTERS,
  openAdminGuestPreview,
} from "@/lib/adminEvents";

export default function AdminEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [viewEvent, setViewEvent] = useState(null);
  const [editEvent, setEditEvent] = useState(null);
  const [templateEvent, setTemplateEvent] = useState(null);
  const [credentialsEvent, setCredentialsEvent] = useState(null);
  const [deleteEvent, setDeleteEvent] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadEvents = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    try {
      const data = await apiRequest("/api/admin/events", { token });
      setEvents(data.events || []);
      setError("");
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        clearAuthSession();
        router.replace("/login");
        return;
      }
      setError(err.message || "Failed to load events");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const filteredEvents = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter((event) => {
      const matchesType = typeFilter === "all" || event.type === typeFilter;
      const matchesStatus =
        statusFilter === "all" || event.status === statusFilter;
      const matchesQuery =
        !q ||
        event.name.toLowerCase().includes(q) ||
        String(event.location || "")
          .toLowerCase()
          .includes(q) ||
        String(event.templateKey || "")
          .toLowerCase()
          .includes(q);
      return matchesType && matchesStatus && matchesQuery;
    });
  }, [events, query, typeFilter, statusFilter]);

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
        const created = await apiRequest("/api/admin/events", {
          method: "POST",
          token,
          body: payload,
        });
        if (created?.event && created?.credentials) {
          setCredentialsEvent({
            ...created.event,
            clientEmail: created.credentials.email,
            createdPassword: created.credentials.password,
          });
        }
      }
      await loadEvents();
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
      await loadEvents();
    } catch (err) {
      setError(err.message || "Failed to delete event");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 md:p-8 lg:p-12 w-full min-w-0">
      <div className="md:hidden mb-6">
        <h1 className="font-serif font-bold text-3xl text-navy">Events</h1>
      </div>

      <div className="hidden md:flex justify-between items-center mb-8 bg-white p-5 rounded-2xl border border-border">
        <h1 className="font-serif font-bold text-2xl text-navy">Events</h1>
      </div>

      {error ? (
        <div className="mb-6 bg-red-50 border border-red-100 text-red-600 text-sm rounded-2xl px-4 py-3">
          {error}
        </div>
      ) : null}

      <div className="mb-6 md:mb-8 md:bg-white md:rounded-2xl md:border md:border-border md:p-5 md:card-shadow">
        <div className="flex flex-row items-center justify-between gap-3 sm:gap-4">
          <div className="relative w-full max-w-[220px] sm:max-w-[280px] shrink-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search events…"
              className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl border border-border bg-white text-navy text-sm focus:outline-none focus:ring-2 focus:ring-[#054380]/50 transition-shadow placeholder:text-gray-300"
            />
          </div>

          <div className="flex flex-nowrap items-center gap-2 sm:gap-3 shrink-0 ml-auto">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 sm:px-4 py-2.5 rounded-xl border border-border bg-white text-sm text-navy focus:outline-none focus:ring-2 focus:ring-[#054380]/50"
              aria-label="Filter by type"
            >
              {EVENT_TYPE_FILTERS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 sm:px-4 py-2.5 rounded-xl border border-border bg-white text-sm text-navy focus:outline-none focus:ring-2 focus:ring-[#054380]/50"
              aria-label="Filter by status"
            >
              {EVENT_STATUS_FILTERS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setAddOpen(true)}
              aria-label="Add event"
              className="w-11 h-11 rounded-full bg-navy text-white flex items-center justify-center hover:bg-navy/90 transition-colors shadow-sm md:hidden focus:outline-none focus:ring-2 focus:ring-[#054380]"
            >
              <Plus className="w-5 h-5" strokeWidth={2.5} />
            </button>

            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="hidden md:inline-flex items-center gap-2 bg-navy text-white font-medium px-4 py-2.5 rounded-xl hover:bg-navy/90 transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-[#054380]"
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              Add event
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <p className="text-muted text-sm mb-6">Loading events…</p>
      ) : null}

      <div className="md:hidden space-y-3 mb-4">
        {!loading && filteredEvents.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 card-shadow border border-border text-center">
            <p className="text-muted text-sm">No events match your search.</p>
          </div>
        ) : (
          filteredEvents.map((event) => (
            <div
              key={event.id}
              className="bg-white rounded-2xl p-4 card-shadow border border-border"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-navy">{event.name}</p>
                  <p className="text-sm text-muted mt-1">
                    {event.type} · {event.templateKey}
                  </p>
                  <p className="text-sm text-navy mt-1">{event.eventDate}</p>
                  {event.location ? (
                    <p className="text-sm text-muted mt-1">{event.location}</p>
                  ) : null}
                </div>
                <div className="flex flex-col gap-2 shrink-0 text-right">
                  <button
                    type="button"
                    onClick={() => setViewEvent(event)}
                    className="text-xs font-medium text-[#054380]"
                  >
                    View
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditEvent(event)}
                    className="text-xs font-medium text-[#054380]"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setTemplateEvent(event)}
                    className="text-xs font-medium text-[#054380]"
                  >
                    Template
                  </button>
                  <button
                    type="button"
                    onClick={() => openAdminGuestPreview(event.id, event)}
                    className="text-xs font-medium text-[#054380]"
                  >
                    Guest view
                  </button>
                  <button
                    type="button"
                    onClick={() => setCredentialsEvent(event)}
                    className="text-xs font-medium text-[#054380]"
                  >
                    Credentials
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteEvent(event)}
                    className="text-xs font-medium text-red-500"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="hidden md:block">
        {!loading ? (
          <EventsTable
            events={filteredEvents}
            onViewEvent={setViewEvent}
            onEditEvent={setEditEvent}
            onTemplateEvent={setTemplateEvent}
            onCredentialsEvent={setCredentialsEvent}
            onDeleteEvent={setDeleteEvent}
          />
        ) : null}
      </div>

      <AddEventModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={handleSave}
        mode="add"
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
        onSaved={loadEvents}
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
