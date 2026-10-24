"use client";

/**
 * Guests list + CRUD (includes per-guest invitation_note).
 * APIs:
 * - GET    /api/couple/guests
 * - POST   /api/couple/guests
 * - PUT    /api/couple/guests/:id
 * - DELETE /api/couple/guests/:id
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus, Search, Send, Share2, Check, Copy } from "lucide-react";
import clsx from "clsx";
import { NotificationBell } from "@/components/ui/NotificationPanel";
import GuestCard from "@/components/guests/GuestCard";
import GuestTable from "@/components/guests/GuestTable";
import AddGuestModal from "@/components/guests/AddGuestModal";
import GuestViewModal from "@/components/guests/GuestViewModal";
import ConfirmDeleteModal from "@/components/guests/ConfirmDeleteModal";
import ShareInviteModal from "@/components/guests/ShareInviteModal";
import { apiRequest } from "@/lib/api";
import { clearAuthSession, getAccessToken } from "@/lib/auth";
import { shareGuestInviteNative } from "@/lib/shareInvite";

const GUESTS_PER_PAGE = 15;

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
        Showing {startItem} to {endItem} of {totalItems} guests
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

const FILTERS = [
  { id: "all", label: "All" },
  { id: "confirmed", label: "Confirmed" },
  { id: "pending", label: "Pending" },
  { id: "declined", label: "Declined" },
];

function sortGuestsByPinAndName(guestList) {
  return [...guestList].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });
}

export default function GuestsPage() {
  const router = useRouter();
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [viewGuest, setViewGuest] = useState(null);
  const [editGuest, setEditGuest] = useState(null);
  const [deleteGuest, setDeleteGuest] = useState(null);
  const [shareGuest, setShareGuest] = useState(null);
  const [saving, setSaving] = useState(false);
  const [publicInvite, setPublicInvite] = useState(null);
  const [copiedPublic, setCopiedPublic] = useState(false);
  const fetchInProgressRef = useRef(false);

  const loadGuests = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    if (fetchInProgressRef.current) return;
    fetchInProgressRef.current = true;

    try {
      const data = await apiRequest("/api/couple/guests", { token });
      setGuests(sortGuestsByPinAndName(data.guests || []));
      setPublicInvite(data.publicInvite || null);
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
      fetchInProgressRef.current = false;
    }
  }, [router]);

  const handleCopyPublicLink = async () => {
    if (!publicInvite?.url) return;
    try {
      await navigator.clipboard.writeText(publicInvite.url);
      setCopiedPublic(true);
      setTimeout(() => setCopiedPublic(false), 2000);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadGuests();
  }, [loadGuests]);

  // Real-time-ish updates: keep the guests table fresh without requiring
  // a manual page reload (e.g. immediately after a guest submits RSVP).
  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const POLL_MS = 2500;

    const maybePoll = () => {
      if (document.visibilityState !== "visible") return;
      loadGuests();
    };

    maybePoll();
    const intervalId = window.setInterval(maybePoll, POLL_MS);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        maybePoll();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [loadGuests]);

  const filteredGuests = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = guests.filter((guest) => {
      const matchesFilter = filter === "all" || guest.status === filter;
      const matchesQuery =
        !q ||
        guest.name.toLowerCase().includes(q) ||
        guest.phone.toLowerCase().includes(q);
      return matchesFilter && matchesQuery;
    });
    return sortGuestsByPinAndName(filtered);
  }, [guests, query, filter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredGuests.length / GUESTS_PER_PAGE)
  );
  const safePage = Math.min(currentPage, totalPages);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, filter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedGuests = useMemo(() => {
    const startIndex = (safePage - 1) * GUESTS_PER_PAGE;
    return filteredGuests.slice(startIndex, startIndex + GUESTS_PER_PAGE);
  }, [filteredGuests, safePage]);

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
      setGuests((prev) => sortGuestsByPinAndName([data.guest, ...prev]));
      setFilter("all");
      setCurrentPage(1);
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

  const handleCancelRsvp = async (guest) => {
    if (!confirm(`Cancel RSVP for ${guest.name}? Their status will be set to Declined.`)) return;
    try {
      await apiRequest(`/api/couple/guests/${guest.id}/cancel-rsvp`, {
        method: "POST",
        token: getAccessToken(),
      });
      await loadGuests();
    } catch (err) {
      alert(err.message || "Failed to cancel RSVP");
    }
  };

  const handleResendInvite = async (guest) => {
    if (!confirm(`Resend invitation to ${guest.name}? This will reset their RSVP so they can respond again.`)) return;
    try {
      await apiRequest(`/api/couple/guests/${guest.id}/resend-invite`, {
        method: "POST",
        token: getAccessToken(),
      });
      await loadGuests();
    } catch (err) {
      alert(err.message || "Failed to resend invite");
    }
  };

  const markInviteShared = useCallback(async (guestId) => {
    const token = getAccessToken();
    if (!token || !guestId) return;

    try {
      const data = await apiRequest(
        `/api/couple/guests/${guestId}/mark-invite-shared`,
        { method: "POST", token }
      );
      if (data?.guest) {
        setGuests((prev) =>
          prev.map((g) => (g.id === guestId ? data.guest : g))
        );
      }
    } catch {
      // Keep UI usable even if marking fails silently.
    }
  }, []);

  const handleTogglePin = async (guest) => {
    const token = getAccessToken();
    if (!token) return;

    try {
      const data = await apiRequest(`/api/couple/guests/${guest.id}/toggle-pin`, {
        method: "POST",
        token,
      });
      if (data?.guest) {
        setGuests((prev) =>
          sortGuestsByPinAndName(
            prev.map((g) => (g.id === guest.id ? data.guest : g))
          )
        );
      }
    } catch (err) {
      setError(err.message || "Failed to update pin");
    }
  };

  const handleShare = async (guest) => {
    const prefersNativeShare =
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 767px)").matches;

    if (prefersNativeShare) {
      const result = await shareGuestInviteNative(guest);
      if (result.ok) {
        await markInviteShared(guest.id);
        return;
      }
      if (result.reason === "cancelled") return;
    }

    setShareGuest(guest);
  };

  return (
    <div className="p-6 md:p-8 lg:p-12 w-full min-w-0">
      <div className="md:hidden mb-6">
        <h1 className="font-serif font-bold text-3xl text-navy">Guests</h1>
      </div>

      <div className="hidden md:flex justify-between items-center mb-8 bg-white p-5 rounded-2xl border border-border gap-4">
        <h1 className="font-serif font-bold text-2xl text-navy">Guests</h1>
        <div className="flex items-center gap-3">
          {publicInvite?.url ? (
            <button
              type="button"
              onClick={handleCopyPublicLink}
              className="inline-flex items-center gap-2 h-10 px-3.5 rounded-xl border border-border text-sm font-medium text-navy hover:bg-[#EAF5FF]"
            >
              {copiedPublic ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              {copiedPublic ? "Link copied" : "Copy public invite link"}
            </button>
          ) : null}
          <NotificationBell />
        </div>
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
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-white text-navy text-sm focus:outline-none focus:ring-2 focus:ring-[#054380]/50 transition-shadow placeholder:text-gray-300"
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
                        "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border transition-colors outline-none focus:outline-none focus-visible:outline-none",
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
          paginatedGuests.map((guest) => (
            <GuestCard
              key={guest.id}
              guest={guest}
              name={guest.name}
              phone={guest.phone}
              status={guest.status}
              inviteShared={Boolean(guest.inviteSharedAt)}
              guestCount={guest.invitedCount ?? guest.guestCount}
              onShare={() => handleShare(guest)}
              onTogglePin={() => handleTogglePin(guest)}
              onViewGuest={(g) => setViewGuest(g)}
              onEditGuest={(g) => setEditGuest(g)}
              onDeleteGuest={(g) => setDeleteGuest(g)}
              onCancelRsvp={handleCancelRsvp}
              onResendInvite={handleResendInvite}
            />
          ))
        )}

        {!loading && filteredGuests.length > 0 ? (
          <div className="mt-4 bg-white rounded-2xl card-shadow border border-border">
            <PaginationBar
              safePage={safePage}
              totalPages={totalPages}
              totalItems={filteredGuests.length}
              itemsPerPage={GUESTS_PER_PAGE}
              onPageChange={setCurrentPage}
            />
          </div>
        ) : null}
      </div>

      <div className="hidden md:block">
        {!loading ? (
          <GuestTable
            guests={paginatedGuests}
            onViewGuest={(g) => setViewGuest(g)}
            onEditGuest={(g) => setEditGuest(g)}
            onDeleteGuest={(g) => setDeleteGuest(g)}
            onShareGuest={handleShare}
            onCancelRsvp={handleCancelRsvp}
            onResendInvite={handleResendInvite}
            onTogglePin={handleTogglePin}
            footer={
              filteredGuests.length > 0 ? (
                <PaginationBar
                  safePage={safePage}
                  totalPages={totalPages}
                  totalItems={filteredGuests.length}
                  itemsPerPage={GUESTS_PER_PAGE}
                  onPageChange={setCurrentPage}
                />
              ) : null
            }
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

      <ShareInviteModal
        open={!!shareGuest}
        guest={shareGuest}
        onClose={() => setShareGuest(null)}
        onShareAction={(guest) => markInviteShared(guest.id)}
      />

      {saving ? (
        <p className="sr-only" aria-live="polite">
          Saving…
        </p>
      ) : null}
    </div>
  );
}
