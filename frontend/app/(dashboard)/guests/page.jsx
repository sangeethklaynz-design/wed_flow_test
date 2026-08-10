"use client";

/**
 * Guests list + CRUD (includes per-guest invitation_note).
 * APIs:
 * - GET    /api/couple/guests
 * - POST   /api/couple/guests
 * - PUT    /api/couple/guests/:id
 * - DELETE /api/couple/guests/:id
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";
import clsx from "clsx";
import GuestCard from "@/components/guests/GuestCard";
import GuestTable from "@/components/guests/GuestTable";
import AddGuestModal from "@/components/guests/AddGuestModal";
import GuestViewModal from "@/components/guests/GuestViewModal";
import ConfirmDeleteModal from "@/components/guests/ConfirmDeleteModal";
import { apiRequest } from "@/lib/api";
import { clearAuthSession, getAccessToken } from "@/lib/auth";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "confirmed", label: "Confirmed" },
  { id: "pending", label: "Pending" },
  { id: "declined", label: "Declined" },
];

function getInviteBaseUrl() {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export default function GuestsPage() {
  const router = useRouter();
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [viewGuest, setViewGuest] = useState(null);
  const [editGuest, setEditGuest] = useState(null);
  const [deleteGuest, setDeleteGuest] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadGuests = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    try {
      const data = await apiRequest("/api/couple/guests", { token });
      setGuests(data.guests || []);
      setError("");
    } catch (err) {
      if (err.status === 401) {
        clearAuthSession();
        router.replace("/login");
        return;
      }
      setError(err.message || "Failed to load guests");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadGuests();
  }, [loadGuests]);

  const filteredGuests = useMemo(() => {
    const q = query.trim().toLowerCase();
    return guests.filter((guest) => {
      const matchesFilter = filter === "all" || guest.status === filter;
      const matchesQuery =
        !q ||
        guest.name.toLowerCase().includes(q) ||
        guest.phone.toLowerCase().includes(q);
      return matchesFilter && matchesQuery;
    });
  }, [guests, query, filter]);

  const handleAdd = async (payload) => {
    const token = getAccessToken();
    if (!token) return;
    setSaving(true);
    try {
      const data = await apiRequest("/api/couple/guests", {
        method: "POST",
        token,
        body: {
          name: payload.name,
          phone: payload.phone,
          guestCount: payload.guestCount,
          note: payload.note,
          tableNumber: payload.tableNumber,
        },
      });
      setGuests((prev) => [data.guest, ...prev]);
      setFilter("all");
      setError("");
    } catch (err) {
      setError(err.message || "Failed to add guest");
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (payload) => {
    const token = getAccessToken();
    if (!token || !payload.id) return;
    setSaving(true);
    try {
      const data = await apiRequest(`/api/couple/guests/${payload.id}`, {
        method: "PUT",
        token,
        body: {
          name: payload.name,
          phone: payload.phone,
          guestCount: payload.guestCount,
          note: payload.note,
          tableNumber: payload.tableNumber,
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
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteGuest) return;
    const token = getAccessToken();
    if (!token) return;
    setSaving(true);
    try {
      await apiRequest(`/api/couple/guests/${deleteGuest.id}`, {
        method: "DELETE",
        token,
      });
      setGuests((prev) => prev.filter((g) => g.id !== deleteGuest.id));
      if (viewGuest?.id === deleteGuest.id) setViewGuest(null);
      setDeleteGuest(null);
      setFilter("all");
      setError("");
    } catch (err) {
      setError(err.message || "Failed to delete guest");
    } finally {
      setSaving(false);
    }
  };

  const handleShare = (guest) => {
    const inviteUrl = guest.uniqueToken
      ? `${getInviteBaseUrl()}/i/${guest.uniqueToken}`
      : "";
    const text = inviteUrl
      ? `You're invited to our wedding! Open your invitation and RSVP here:\n${inviteUrl}`
      : `You're invited! Please RSVP — ${guest.name}`;

    if (typeof navigator !== "undefined" && navigator.share) {
      navigator
        .share({ title: "Wedding Invite", text, url: inviteUrl || undefined })
        .catch(() => {});
      return;
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
  };

  return (
    <div className="p-6 md:p-8 lg:p-12 w-full min-w-0">
      <div className="md:hidden mb-6">
        <h1 className="font-serif font-bold text-3xl text-navy">Guests</h1>
      </div>

      <div className="hidden md:flex items-center mb-8 bg-white p-5 rounded-2xl border border-border">
        <h1 className="font-serif font-bold text-2xl text-navy">Guests</h1>
      </div>

      {error ? (
        <div className="mb-6 bg-red-50 border border-red-100 text-red-600 text-sm rounded-2xl px-4 py-3">
          {error}
        </div>
      ) : null}

      <div className="mb-6 md:mb-8 md:bg-white md:rounded-2xl md:border md:border-border md:p-5 md:card-shadow">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div className="relative w-full xl:max-w-sm shrink-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search guests..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-white text-navy text-sm focus:outline-none focus:ring-2 focus:ring-[#e69e46]/50 transition-shadow placeholder:text-gray-300"
            />
          </div>

          <div className="flex items-center gap-3 w-full xl:w-auto xl:ml-auto min-w-0">
            <div className="flex-1 min-w-0 overflow-x-auto scrollbar-none pb-1 -mb-1">
              <div className="flex items-center gap-2 w-max">
                {FILTERS.map((item) => {
                  const isActive = filter === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setFilter(item.id)}
                      className={clsx(
                        "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border transition-colors focus:outline-none focus:ring-2 focus:ring-[#e69e46]",
                        isActive
                          ? "bg-navy text-white border-navy"
                          : "bg-white text-muted border-border hover:bg-cream"
                      )}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="shrink-0 flex items-center">
              <button
                type="button"
                onClick={() => setAddOpen(true)}
                aria-label="Add guest"
                className="w-11 h-11 rounded-full bg-navy text-white flex items-center justify-center hover:bg-navy/90 transition-colors shadow-sm md:hidden focus:outline-none focus:ring-2 focus:ring-[#e69e46]"
              >
                <Plus className="w-5 h-5" strokeWidth={2.5} />
              </button>

              <button
                type="button"
                onClick={() => setAddOpen(true)}
                className="hidden md:inline-flex items-center gap-2 bg-navy text-white font-medium px-4 py-2.5 rounded-xl hover:bg-navy/90 transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-[#e69e46]"
              >
                <Plus className="w-4 h-4" strokeWidth={2.5} />
                Add guest
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <p className="text-muted text-sm mb-6">Loading guests…</p>
      ) : null}

      <div className="md:hidden space-y-3">
        {!loading && filteredGuests.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 card-shadow border border-border text-center">
            <p className="text-muted text-sm">No guests match your search.</p>
          </div>
        ) : (
          filteredGuests.map((guest) => (
            <GuestCard
              key={guest.id}
              {...guest}
              guestCount={guest.invitedCount ?? guest.guestCount}
              onShare={() => handleShare(guest)}
            />
          ))
        )}
      </div>

      <div className="hidden md:block">
        {!loading ? (
          <GuestTable
            guests={filteredGuests}
            onViewGuest={(g) => setViewGuest(g)}
            onEditGuest={(g) => setEditGuest(g)}
            onDeleteGuest={(g) => setDeleteGuest(g)}
          />
        ) : null}
      </div>

      <AddGuestModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={async (payload) => {
          await handleAdd(payload);
        }}
        mode="add"
      />

      <AddGuestModal
        open={!!editGuest}
        onClose={() => setEditGuest(null)}
        onSubmit={async (payload) => {
          await handleEdit(payload);
        }}
        mode="edit"
        initialGuest={editGuest}
      />

      <GuestViewModal
        open={!!viewGuest}
        onClose={() => setViewGuest(null)}
        guest={viewGuest}
      />

      <ConfirmDeleteModal
        open={!!deleteGuest}
        onClose={() => setDeleteGuest(null)}
        guestName={deleteGuest?.name}
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
