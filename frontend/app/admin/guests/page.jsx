"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, Eye, Pencil, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import RowActionsMenu from "@/components/ui/RowActionsMenu";
import AdminGuestViewModal from "@/components/admin/AdminGuestViewModal";
import AdminGuestEditModal from "@/components/admin/AdminGuestEditModal";
import ConfirmDeleteModal from "@/components/guests/ConfirmDeleteModal";

export default function AdminGuestsPage() {
  const [guests, setGuests] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [eventId, setEventId] = useState("");
  const [eventType, setEventType] = useState("");

  const [openMenuId, setOpenMenuId] = useState(null);
  const [viewGuest, setViewGuest] = useState(null);
  const [editGuest, setEditGuest] = useState(null);
  const [deleteGuest, setDeleteGuest] = useState(null);

  const filteredEvents = useMemo(() => {
    let list = events;
    if (organizationId) {
      list = list.filter((e) => e.organizationId === organizationId);
    }
    if (eventType) {
      list = list.filter((e) => e.type === eventType);
    }
    return list;
  }, [events, organizationId, eventType]);

  const loadMeta = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    try {
      const data = await apiRequest("/api/admin/guests/meta", { token });
      setOrganizations(data.organizations || []);
      setEvents(data.events || []);
    } catch (err) {
      setError(err.message || "Failed to load filters");
    }
  }, []);

  const loadGuests = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (organizationId) params.set("organizationId", organizationId);
      if (eventId) params.set("eventId", eventId);
      if (eventType) params.set("eventType", eventType);
      if (query.trim()) params.set("q", query.trim());
      const qs = params.toString();
      const data = await apiRequest(
        `/api/admin/guests${qs ? `?${qs}` : ""}`,
        { token }
      );
      setGuests(data.guests || []);
    } catch (err) {
      setError(err.message || "Failed to load guests");
      setGuests([]);
    } finally {
      setLoading(false);
    }
  }, [organizationId, eventId, eventType, query]);

  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  useEffect(() => {
    const t = setTimeout(() => loadGuests(), 200);
    return () => clearTimeout(t);
  }, [loadGuests]);

  useEffect(() => {
    if (eventId && !filteredEvents.some((e) => e.id === eventId)) {
      setEventId("");
    }
  }, [eventId, filteredEvents]);

  const openView = async (guest) => {
    const token = getAccessToken();
    if (!token) return;
    try {
      const data = await apiRequest(`/api/admin/guests/${guest.id}`, { token });
      setViewGuest(data.guest || guest);
    } catch {
      setViewGuest(guest);
    }
  };

  const handleEdit = async (payload) => {
    const token = getAccessToken();
    if (!token || !payload.id) return;
    try {
      const data = await apiRequest(`/api/admin/guests/${payload.id}`, {
        method: "PUT",
        token,
        body: {
          name: payload.name,
          phone: payload.phone,
          email: payload.email,
          idNumber: payload.idNumber,
        },
      });
      setGuests((prev) =>
        prev.map((g) => (g.id === data.guest.id ? data.guest : g))
      );
      if (viewGuest?.id === data.guest.id) setViewGuest(data.guest);
      setEditGuest(null);
      setError("");
    } catch (err) {
      setError(err.message || "Failed to update guest");
      throw err;
    }
  };

  const handleDelete = async () => {
    if (!deleteGuest?.id) return;
    const token = getAccessToken();
    if (!token) return;
    try {
      await apiRequest(`/api/admin/guests/${deleteGuest.id}`, {
        method: "DELETE",
        token,
      });
      setGuests((prev) => prev.filter((g) => g.id !== deleteGuest.id));
      setDeleteGuest(null);
      setError("");
    } catch (err) {
      setError(err.message || "Failed to delete guest");
    }
  };

  return (
    <div className="p-6 md:p-8 lg:p-12 w-full min-w-0">
      <div className="md:hidden mb-6">
        <h1 className="font-serif font-bold text-3xl text-navy">Guests</h1>
      </div>

      <div className="hidden md:flex justify-between items-center mb-8 bg-white p-5 rounded-2xl border border-border">
        <div>
          <h1 className="font-serif font-bold text-2xl text-navy">Guests</h1>
          <p className="text-sm text-muted mt-1">
            Corporate and party guests across merchants
          </p>
        </div>
      </div>

      {error ? (
        <div className="mb-6 bg-red-50 border border-red-100 text-red-600 text-sm rounded-2xl px-4 py-3">
          {error}
        </div>
      ) : null}

      <div className="mb-6 md:mb-8 bg-white rounded-2xl border border-border p-4 md:p-5 card-shadow">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
          <div className="relative w-full lg:w-[260px] lg:shrink-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, email, phone…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-white text-navy text-sm text-left focus:outline-none focus:ring-2 focus:ring-[#054380]/50"
            />
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap gap-3 lg:justify-end w-full">
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="h-[42px] px-3 rounded-xl border border-border bg-white text-sm text-navy text-center"
            >
              <option value="">All event types</option>
              <option value="corporate">Corporate</option>
              <option value="party">Party</option>
            </select>

            <select
              value={organizationId}
              onChange={(e) => setOrganizationId(e.target.value)}
              className="h-[42px] px-3 rounded-xl border border-border bg-white text-sm text-navy text-center"
            >
              <option value="">All merchants</option>
              {organizations.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>

            <select
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className="h-[42px] px-3 rounded-xl border border-border bg-white text-sm text-navy text-center"
            >
              <option value="">All events</option>
              {filteredEvents.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl card-shadow border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-center">
            <thead>
              <tr className="border-b border-border bg-cream/60">
                <th className="px-6 py-4 text-xs font-medium text-muted uppercase tracking-wide text-center">
                  Guest Name
                </th>
                <th className="px-6 py-4 text-xs font-medium text-muted uppercase tracking-wide text-center">
                  Merchant
                </th>
                <th className="px-6 py-4 text-xs font-medium text-muted uppercase tracking-wide text-center">
                  Event
                </th>
                <th className="px-6 py-4 text-xs font-medium text-muted uppercase tracking-wide text-center">
                  Tickets Bought
                </th>
                <th className="px-6 py-4 text-xs font-medium text-muted uppercase tracking-wide text-center">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-sm text-muted text-center">
                    Loading guests…
                  </td>
                </tr>
              ) : guests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-sm text-muted text-center">
                    No guests match these filters.
                  </td>
                </tr>
              ) : (
                guests.map((guest) => (
                  <tr
                    key={guest.id}
                    className="border-b border-border last:border-b-0 hover:bg-cream/40"
                  >
                    <td className="px-6 py-4 text-center font-semibold text-navy">
                      {guest.name}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-navy">
                      {guest.organizationName || "—"}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-navy">
                      {guest.eventName || "—"}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-navy font-medium">
                      {guest.isTicketingEnabled || guest.ticketCount > 0
                        ? guest.ticketCount ?? guest.ticketsBought ?? 0
                        : "—"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="relative inline-flex items-center justify-center">
                        <RowActionsMenu
                          id={guest.id}
                          openId={openMenuId}
                          setOpenId={setOpenMenuId}
                          label={`Row actions for ${guest.name}`}
                          items={[
                            {
                              label: "View detail",
                              icon: Eye,
                              onClick: () => openView(guest),
                            },
                            {
                              label: "Edit detail",
                              icon: Pencil,
                              onClick: () => setEditGuest(guest),
                            },
                            {
                              label: "Delete guest",
                              icon: Trash2,
                              onClick: () => setDeleteGuest(guest),
                              destructive: true,
                            },
                          ]}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AdminGuestViewModal
        open={Boolean(viewGuest)}
        guest={viewGuest}
        onClose={() => setViewGuest(null)}
      />

      <AdminGuestEditModal
        open={Boolean(editGuest)}
        guest={editGuest}
        onClose={() => setEditGuest(null)}
        onSubmit={handleEdit}
      />

      <ConfirmDeleteModal
        open={Boolean(deleteGuest)}
        guestName={deleteGuest?.name}
        onClose={() => setDeleteGuest(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
