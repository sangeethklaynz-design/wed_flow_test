"use client";

/**
 * Schedule list + CRUD + PDF download.
 * APIs:
 * - GET    /api/couple/schedule
 * - POST   /api/couple/schedule
 * - PUT    /api/couple/schedule/:id
 * - DELETE /api/couple/schedule/:id
 * - GET    /api/couple/schedule/download
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Download, Plus } from "lucide-react";
import ScheduleEventCard from "@/components/schedule/ScheduleEventCard";
import ScheduleTable from "@/components/schedule/ScheduleTable";
import AddScheduleEventModal from "@/components/schedule/AddScheduleEventModal";
import ScheduleViewModal from "@/components/schedule/ScheduleViewModal";
import ConfirmDeleteModal from "@/components/guests/ConfirmDeleteModal";
import { apiRequest } from "@/lib/api";
import { clearAuthSession, getAccessToken } from "@/lib/auth";

function sortByStartTime(events) {
  return [...events].sort((a, b) =>
    (a.startTime || "").localeCompare(b.startTime || "")
  );
}

function formatDisplayDate(dateStr) {
  if (!dateStr) return "Wedding date not set";
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function shouldNotifyNow(weddingDate, startTime) {
  if (!weddingDate || !startTime) return false;
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  if (today !== weddingDate) return false;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [hours, minutes] = startTime.split(":").map(Number);
  const eventMinutes = hours * 60 + minutes;
  return currentMinutes < eventMinutes;
}

function ProgressBlock({ done, total }) {
  const remaining = total - done;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <p className="text-sm text-muted whitespace-nowrap">
        {done} of {total} events done
      </p>
      <div
        className="h-2 w-28 sm:w-32 rounded-full bg-gold overflow-hidden shrink-0"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${done} of ${total} events done`}
      >
        <div
          className="h-full rounded-full bg-[#c4a574] transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-sm text-muted whitespace-nowrap">{remaining} remaining</p>
    </div>
  );
}

export default function SchedulePage() {
  const notificationTimersRef = useRef([]);
  const notifiedEventIdsRef = useRef(new Set());
  const [events, setEvents] = useState([]);
  const [weddingDate, setWeddingDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [viewEvent, setViewEvent] = useState(null);
  const [editEvent, setEditEvent] = useState(null);
  const [deleteEvent, setDeleteEvent] = useState(null);

  const sortedEvents = useMemo(() => sortByStartTime(events), [events]);
  const doneCount = events.filter((e) => e.status === "done").length;
  const total = events.length;
  const weddingDateLabel = useMemo(
    () => formatDisplayDate(weddingDate),
    [weddingDate]
  );
  const notificationSupported =
    typeof window !== "undefined" && typeof Notification !== "undefined";
  const notificationPermission = notificationSupported
    ? Notification.permission
    : "unsupported";

  const loadSchedule = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      clearAuthSession();
      window.location.href = "/login";
      return;
    }

    try {
      const data = await apiRequest("/api/couple/schedule", { token });
      setEvents(data.events || []);
      setWeddingDate(data.weddingDate || "");
      setError("");
    } catch (err) {
      if (err.status === 401) {
        clearAuthSession();
        window.location.href = "/login";
        return;
      }
      setError(err.message || "Failed to load schedule");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  useEffect(() => {
    notificationTimersRef.current.forEach((timer) => clearTimeout(timer));
    notificationTimersRef.current = [];

    if (
      typeof window === "undefined" ||
      typeof Notification === "undefined" ||
      Notification.permission !== "granted"
    ) {
      return undefined;
    }

    sortedEvents.forEach((event) => {
      if (
        !event.notificationEnabled ||
        !shouldNotifyNow(weddingDate, event.startTime) ||
        notifiedEventIdsRef.current.has(event.id)
      ) {
        return;
      }

      const targetTime = new Date(`${weddingDate}T${event.startTime}:00`);
      const delay = targetTime.getTime() - Date.now();
      if (delay <= 0) return;

      const timer = window.setTimeout(() => {
        new Notification("Wed Flow reminder", {
          body: `${event.title} starts now${event.specialNotes ? ` · ${event.specialNotes}` : ""}`,
        });
        notifiedEventIdsRef.current.add(event.id);
      }, delay);

      notificationTimersRef.current.push(timer);
    });

    return () => {
      notificationTimersRef.current.forEach((timer) => clearTimeout(timer));
      notificationTimersRef.current = [];
    };
  }, [sortedEvents, weddingDate]);

  const handleDownload = async () => {
    const token = getAccessToken();
    if (!token) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/couple/schedule/download`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to download schedule");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "wedding-schedule.pdf";
      a.click();
      URL.revokeObjectURL(url);
      setError("");
    } catch (err) {
      setError(err.message || "Failed to download schedule");
    }
  };

  const requestNotifications = async () => {
    if (typeof window === "undefined" || typeof Notification === "undefined") {
      return;
    }
    if (Notification.permission === "default") {
      try {
        await Notification.requestPermission();
      } catch {
        // ignore permission errors
      }
    }
  };

  const handleAdd = async (event) => {
    const token = getAccessToken();
    if (!token) return;
    await requestNotifications();
    const data = await apiRequest("/api/couple/schedule", {
      method: "POST",
      token,
      body: event,
    });
    setEvents((prev) => sortByStartTime([data.event, ...prev]));
    setError("");
  };

  return (
    <div className="p-6 md:p-8 lg:p-12 w-full">
      {/* Mobile header */}
      <div className="md:hidden mb-6">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h1 className="font-serif font-bold text-3xl text-navy">Schedule</h1>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              aria-label="Add event"
              className="w-11 h-11 rounded-full bg-navy text-white flex items-center justify-center hover:bg-navy/90 transition-colors shadow-sm"
            >
              <Plus className="w-5 h-5" strokeWidth={2.5} />
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-2 bg-navy text-white font-medium px-4 py-2.5 rounded-xl hover:bg-navy/90 transition-colors whitespace-nowrap"
            >
              <Download className="w-4 h-4" strokeWidth={2} />
              Download
            </button>
          </div>
        </div>
        <p className="text-muted text-sm mb-5">{weddingDateLabel}</p>
        <ProgressBlock done={doneCount} total={total} />
      </div>

      {/* Desktop header */}
      <div className="hidden md:flex items-center mb-8 bg-white p-5 rounded-2xl border border-border">
        <h1 className="font-serif font-bold text-2xl text-navy">Schedule</h1>
      </div>

      {/* Desktop controls */}
      <div className="hidden md:block mb-8 bg-white rounded-2xl border border-border p-5 card-shadow">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-8">
          <div className="flex-1 min-w-0">
            <p className="text-navy font-medium mb-3">{weddingDateLabel}</p>
            <ProgressBlock done={doneCount} total={total} />
          </div>
          <div className="flex items-center gap-2 self-start lg:self-center lg:ml-auto shrink-0">
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="inline-flex items-center gap-2 bg-navy text-white font-medium px-4 py-2.5 rounded-xl hover:bg-navy/90 transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              Add event
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-2 bg-navy text-white font-medium px-4 py-2.5 rounded-xl hover:bg-navy/90 transition-colors whitespace-nowrap"
            >
              <Download className="w-4 h-4" strokeWidth={2} />
              Download
            </button>
          </div>
        </div>
      </div>

      {error ? (
        <div className="mb-6 bg-red-50 border border-red-100 text-red-600 text-sm rounded-2xl px-4 py-3">
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className="text-muted text-sm mb-6">Loading schedule…</p>
      ) : null}

      {!loading && notificationPermission !== "granted" ? (
        <div className="mb-6 bg-white border border-border rounded-2xl px-4 py-3 card-shadow flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-sm text-muted">
            Turn on browser notifications to get reminders when your events start.
          </p>
          {notificationSupported ? (
            <button
              type="button"
              onClick={requestNotifications}
              className="inline-flex items-center justify-center bg-navy text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-navy/90 transition-colors whitespace-nowrap"
            >
              Enable notifications
            </button>
          ) : null}
        </div>
      ) : null}

      {/* Mobile cards */}
      <div className="md:hidden space-y-3 mt-6">
        {sortedEvents.length === 0 && !loading ? (
          <div className="bg-white rounded-2xl p-8 card-shadow border border-border text-center">
            <p className="text-muted text-sm">No events on the schedule.</p>
          </div>
        ) : (
          sortedEvents.map((event) => (
            <div
              key={event.id}
              className="bg-white rounded-2xl border border-border card-shadow overflow-hidden"
            >
              <div className="p-0">
                <ScheduleEventCard {...event} />
              </div>
              <div className="grid grid-cols-3 gap-px bg-border">
                <button
                  type="button"
                  onClick={() => setViewEvent(event)}
                  className="bg-white py-3 text-sm font-medium text-navy hover:bg-cream transition-colors"
                >
                  View
                </button>
                <button
                  type="button"
                  onClick={() => setEditEvent(event)}
                  className="bg-white py-3 text-sm font-medium text-navy hover:bg-cream transition-colors"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteEvent(event)}
                  className="bg-white py-3 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block">
        <ScheduleTable
          events={sortedEvents}
          onViewEvent={(e) => setViewEvent(e)}
          onEditEvent={(e) => setEditEvent(e)}
          onDeleteEvent={(e) => setDeleteEvent(e)}
        />
      </div>

      <AddScheduleEventModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={handleAdd}
        mode="add"
        existingEvents={events}
      />

      <AddScheduleEventModal
        open={!!editEvent}
        onClose={() => setEditEvent(null)}
        onSubmit={async (payload) => {
          const token = getAccessToken();
          if (!token || !payload.id) return;
          await requestNotifications();
          const data = await apiRequest(`/api/couple/schedule/${payload.id}`, {
            method: "PUT",
            token,
            body: payload,
          });
          setEvents((prev) =>
            sortByStartTime(
              prev.map((e) => (e.id === data.event.id ? data.event : e))
            )
          );
          if (viewEvent?.id === data.event.id) setViewEvent(data.event);
          setEditEvent(null);
          setError("");
        }}
        mode="edit"
        initialEvent={editEvent}
        existingEvents={events}
      />

      <ScheduleViewModal
        open={!!viewEvent}
        onClose={() => setViewEvent(null)}
        event={viewEvent}
      />

      <ConfirmDeleteModal
        open={!!deleteEvent}
        onClose={() => setDeleteEvent(null)}
        title="Delete Event"
        itemName={deleteEvent?.title}
        description="This will permanently remove the event from your wedding schedule."
        onConfirm={async () => {
          if (!deleteEvent) return;
          const token = getAccessToken();
          if (!token) return;
          await apiRequest(`/api/couple/schedule/${deleteEvent.id}`, {
            method: "DELETE",
            token,
          });
          setEvents((prev) => prev.filter((e) => e.id !== deleteEvent.id));
          if (viewEvent?.id === deleteEvent.id) setViewEvent(null);
          setDeleteEvent(null);
          setError("");
        }}
      />
    </div>
  );
}
