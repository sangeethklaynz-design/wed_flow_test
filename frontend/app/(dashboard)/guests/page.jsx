"use client";

import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import clsx from "clsx";
import GuestCard from "@/components/guests/GuestCard";
import GuestTable from "@/components/guests/GuestTable";
import AddGuestModal from "@/components/guests/AddGuestModal";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "confirmed", label: "Confirmed" },
  { id: "pending", label: "Pending" },
  { id: "declined", label: "Declined" },
];

const INITIAL_GUESTS = [
  {
    id: 1,
    name: "Amaya Fernando",
    phone: "+94771234567",
    status: "confirmed",
    guestCount: 3,
  },
  {
    id: 2,
    name: "Nuwan Perera",
    phone: "+94772345678",
    status: "pending",
    guestCount: 1,
  },
  {
    id: 3,
    name: "Kavindi Silva",
    phone: "+94773456789",
    status: "declined",
    guestCount: 1,
  },
  {
    id: 4,
    name: "Tharindu Jayasuriya",
    phone: "+94774567890",
    status: "confirmed",
    guestCount: 2,
  },
  {
    id: 5,
    name: "Ishara Bandara",
    phone: "+94775678901",
    status: "pending",
    guestCount: 1,
  },
];

export default function GuestsPage() {
  const [guests, setGuests] = useState(INITIAL_GUESTS);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);

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

  const handleAdd = (guest) => {
    setGuests((prev) => [{ ...guest, id: Date.now() }, ...prev]);
    setFilter("all");
  };

  const handleShare = (guest) => {
    const text = `You're invited! Please RSVP — ${guest.name}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title: "Wedding Invite", text }).catch(() => {});
      return;
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
  };

  return (
    <div className="p-6 md:p-8 lg:p-12 w-full">
      {/* Mobile title */}
      <div className="md:hidden mb-6">
        <h1 className="font-serif font-bold text-3xl text-navy">Guests</h1>
      </div>

      {/* Desktop header — page name only (matches Dashboard) */}
      <div className="hidden md:flex items-center mb-8 bg-white p-5 rounded-2xl border border-border">
        <h1 className="font-serif font-bold text-2xl text-navy">Guests</h1>
      </div>

      {/* Controls */}
      <div className="mb-6 md:mb-8 md:bg-white md:rounded-2xl md:border md:border-border md:p-5 md:card-shadow">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
          <div className="relative w-full md:max-w-sm shrink-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search guests..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-white text-navy text-sm focus:outline-none focus:ring-2 focus:ring-[#e69e46]/50 transition-shadow placeholder:text-gray-300"
            />
          </div>

          <div className="flex items-center gap-2 md:ml-auto shrink-0">
            <div className="flex-1 min-w-0 overflow-x-auto md:overflow-visible md:flex-none">
              <div className="flex items-center gap-2 w-max">
                {FILTERS.map((item) => {
                  const isActive = filter === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setFilter(item.id)}
                      className={clsx(
                        "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border transition-colors",
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

            <button
              type="button"
              onClick={() => setAddOpen(true)}
              aria-label="Add guest"
              className="shrink-0 w-11 h-11 rounded-full bg-navy text-white flex items-center justify-center hover:bg-navy/90 transition-colors shadow-sm md:hidden"
            >
              <Plus className="w-5 h-5" strokeWidth={2.5} />
            </button>

            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="hidden md:inline-flex items-center gap-2 bg-navy text-white font-medium px-4 py-2.5 rounded-xl hover:bg-navy/90 transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              Add guest
            </button>
          </div>
        </div>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden space-y-3">
        {filteredGuests.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 card-shadow border border-border text-center">
            <p className="text-muted text-sm">No guests match your search.</p>
          </div>
        ) : (
          filteredGuests.map((guest) => (
            <GuestCard
              key={guest.id}
              {...guest}
              onShare={() => handleShare(guest)}
            />
          ))
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block">
        <GuestTable guests={filteredGuests} onShare={handleShare} />
      </div>

      <AddGuestModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={handleAdd}
      />
    </div>
  );
}
