"use client";

/**
 * Admin events catalogue — list, filter, search, create/edit/delete/template.
 * APIs: GET|POST|PUT|DELETE /api/admin/events
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";
import AddEventModal from "@/components/admin/AddEventModal";
import AddMerchantModal from "@/components/admin/AddMerchantModal";
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

const EVENTS_PER_PAGE = 15;

function sortEventsByLatestCreated(eventList) {
  return [...eventList].sort((a, b) => {
    const timeA = new Date(a.createdAt || a.created_at || 0).getTime();
    const timeB = new Date(b.createdAt || b.created_at || 0).getTime();
    if (timeA !== timeB) return timeB - timeA;
    return String(b.id || "").localeCompare(String(a.id || ""));
  });
}

function getPageNumbers(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "...", totalPages];
  }
  if (currentPage >= totalPages - 3) {
    return [
      1,
      "...",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }
  return [
    1,
    "...",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "...",
    totalPages,
  ];
}

function PaginationBar({
  safePage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}) {
  if (totalItems === 0) return null;
  const startItem = (safePage - 1) * itemsPerPage + 1;
  const endItem = Math.min(safePage * itemsPerPage, totalItems);

  return (
    <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
      <p className="text-[13px] text-muted font-medium">
        Showing {startItem} to {endItem} of {totalItems} events
      </p>
      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-center">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, safePage - 1))}
          disabled={safePage === 1}
          className="w-8 h-8 rounded border border-[#eef0f3] flex items-center justify-center text-muted hover:bg-gray-50 disabled:opacity-40 transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {getPageNumbers(safePage, totalPages).map((p, idx) =>
          p === "..." ? (
            <span
              key={`ellipsis-${idx}`}
              className="w-8 h-8 flex items-center justify-center text-muted text-xs select-none"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={`w-8 h-8 rounded text-[13px] font-bold flex items-center justify-center transition-colors ${
                safePage === p
                  ? "bg-[#054380] text-white"
                  : "border border-[#eef0f3] text-muted hover:bg-gray-50"
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
          disabled={safePage === totalPages}
          className="w-8 h-8 rounded border border-[#eef0f3] flex items-center justify-center text-muted hover:bg-gray-50 disabled:opacity-40 transition-colors"
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function AdminEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [addMerchantOpen, setAddMerchantOpen] = useState(false);
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
      setEvents(sortEventsByLatestCreated(data.events || []));
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
    const matched = events.filter((event) => {
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
    return sortEventsByLatestCreated(matched);
  }, [events, query, typeFilter, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredEvents.length / EVENTS_PER_PAGE)
  );
  const safePage = Math.min(currentPage, totalPages);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, typeFilter, statusFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedEvents = useMemo(() => {
    const startIndex = (safePage - 1) * EVENTS_PER_PAGE;
    return filteredEvents.slice(startIndex, startIndex + EVENTS_PER_PAGE);
  }, [filteredEvents, safePage]);

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
        setCurrentPage(1);
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

  const handleAddMerchant = async (payload) => {
    const token = getAccessToken();
    if (!token) throw new Error("Not authenticated");
    return apiRequest("/api/admin/organizations", {
      method: "POST",
      token,
      body: payload,
    });
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
              onClick={() => setAddMerchantOpen(true)}
              className="hidden md:inline-flex items-center gap-2 bg-navy text-white font-medium px-4 py-2.5 rounded-xl hover:bg-navy/90 transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-[#054380]"
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              Add merchant
            </button>

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

        <div className="mt-3 md:hidden">
          <button
            type="button"
            onClick={() => setAddMerchantOpen(true)}
            className="w-full inline-flex items-center justify-center gap-2 bg-navy text-white font-medium px-4 py-2.5 rounded-xl hover:bg-navy/90 transition-colors focus:outline-none focus:ring-2 focus:ring-[#054380]"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            Add merchant
          </button>
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
          paginatedEvents.map((event) => (
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

        {!loading && filteredEvents.length > 0 ? (
          <div className="mt-4 bg-white rounded-2xl card-shadow border border-border">
            <PaginationBar
              safePage={safePage}
              totalPages={totalPages}
              totalItems={filteredEvents.length}
              itemsPerPage={EVENTS_PER_PAGE}
              onPageChange={setCurrentPage}
            />
          </div>
        ) : null}
      </div>

      <div className="hidden md:block">
        {!loading ? (
          <EventsTable
            events={paginatedEvents}
            onViewEvent={setViewEvent}
            onEditEvent={setEditEvent}
            onTemplateEvent={setTemplateEvent}
            onCredentialsEvent={setCredentialsEvent}
            onDeleteEvent={setDeleteEvent}
            footer={
              filteredEvents.length > 0 ? (
                <PaginationBar
                  safePage={safePage}
                  totalPages={totalPages}
                  totalItems={filteredEvents.length}
                  itemsPerPage={EVENTS_PER_PAGE}
                  onPageChange={setCurrentPage}
                />
              ) : null
            }
          />
        ) : null}
      </div>

      <AddEventModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={handleSave}
        mode="add"
      />

      <AddMerchantModal
        open={addMerchantOpen}
        onClose={() => setAddMerchantOpen(false)}
        onSubmit={handleAddMerchant}
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
