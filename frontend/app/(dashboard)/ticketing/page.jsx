"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, FileText, Eye, Pencil, Trash2, AlertCircle } from "lucide-react";
import clsx from "clsx";
import { NotificationBell } from "@/components/ui/NotificationPanel";
import RowActionsMenu from "@/components/ui/RowActionsMenu";
import TicketModal from "@/components/ticketing/TicketModal";
import ViewTicketModal from "@/components/ticketing/ViewTicketModal";
import ConfirmDeleteModal from "@/components/guests/ConfirmDeleteModal";
import { apiRequest } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

export default function TicketingPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isTicketingEnabled, setIsTicketingEnabled] = useState(false);
  const [ticketTypes, setTicketTypes] = useState([]);
  const [toggling, setToggling] = useState(false);

  // RowActionsMenu open state
  const [openActionId, setOpenActionId] = useState(null);

  // Modal states
  const [modalMode, setModalMode] = useState(null); // 'add' | 'edit' | null
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [viewTicket, setViewTicket] = useState(null);
  const [deleteTicket, setDeleteTicket] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadTicketingData = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;

    setLoading(true);
    setError("");
    try {
      const data = await apiRequest("/api/couple/ticketing", { token });
      if (data) {
        setIsTicketingEnabled(Boolean(data.isTicketingEnabled));
        setTicketTypes(data.ticketTypes || []);
      }
    } catch (err) {
      console.error("Failed to load ticketing data:", err);
      setError(err?.message || "Failed to load ticketing data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTicketingData();
  }, [loadTicketingData]);

  const handleToggleTicketing = async () => {
    const token = getAccessToken();
    if (!token || toggling) return;

    const nextState = !isTicketingEnabled;
    setToggling(true);
    // Optimistic update
    setIsTicketingEnabled(nextState);

    try {
      await apiRequest("/api/couple/ticketing/toggle", {
        method: "PUT",
        token,
        body: { isTicketingEnabled: nextState },
      });
    } catch (err) {
      // Revert if error
      setIsTicketingEnabled(!nextState);
      setError(err?.message || "Failed to update ticketing toggle");
    } finally {
      setToggling(false);
    }
  };

  const handleOpenAdd = () => {
    setSelectedTicket(null);
    setModalMode("add");
  };

  const handleOpenEdit = (ticket) => {
    setSelectedTicket(ticket);
    setModalMode("edit");
  };

  const handleView = (ticket) => {
    setViewTicket(ticket);
  };

  const handleDelete = (ticket) => {
    setDeleteTicket(ticket);
  };

  const handleSaveTicket = async (payload) => {
    const token = getAccessToken();
    if (!token) return;

    setSaving(true);
    try {
      if (modalMode === "edit" && payload.id) {
        const res = await apiRequest(`/api/couple/ticketing/types/${payload.id}`, {
          method: "PUT",
          token,
          body: payload,
        });
        if (res?.ticketType) {
          setTicketTypes((prev) =>
            prev.map((t) => (t.id === payload.id ? res.ticketType : t))
          );
        }
      } else {
        const res = await apiRequest("/api/couple/ticketing/types", {
          method: "POST",
          token,
          body: payload,
        });
        if (res?.ticketType) {
          setTicketTypes((prev) => [...prev, res.ticketType]);
        }
      }
      setModalMode(null);
      setSelectedTicket(null);
    } catch (err) {
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTicket) return;
    const token = getAccessToken();
    if (!token) return;

    setDeleting(true);
    try {
      await apiRequest(`/api/couple/ticketing/types/${deleteTicket.id}`, {
        method: "DELETE",
        token,
      });
      setTicketTypes((prev) => prev.filter((t) => t.id !== deleteTicket.id));
      if (viewTicket?.id === deleteTicket.id) {
        setViewTicket(null);
      }
      setDeleteTicket(null);
    } catch (err) {
      setError(err?.message || "Failed to delete ticket type");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-6 md:p-8 lg:p-12 w-full min-w-0">
      {/* Mobile Title Bar */}
      <div className="md:hidden flex justify-between items-center mb-6 bg-white p-4 rounded-2xl border border-border shadow-sm">
        <h1 className="font-serif font-bold text-2xl text-[#054380]">Ticketing</h1>
        <NotificationBell />
      </div>

      {/* Desktop / Laptop Top Header Bar (Screenshot 2) */}
      <div className="hidden md:flex justify-between items-center mb-8 bg-white p-5 md:px-8 rounded-2xl border border-border shadow-sm min-h-[78px] w-full">
        <h1 className="font-serif font-bold text-2xl text-[#054380]">Ticketing</h1>
        <NotificationBell />
      </div>

      {error ? (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError("")}
            className="text-xs font-semibold underline ml-4 hover:opacity-80"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      {/* Selection Part: Ticketing Options (Screenshot 3) */}
      <div className="bg-white rounded-2xl border border-border shadow-sm p-6 sm:p-8 mb-6 md:mb-8 w-full">
        <h2 className="text-[#054380] font-bold text-base sm:text-lg mb-4">
          Ticketing Options
        </h2>

        <div className="border border-[#D1D5DB] rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4 transition-all hover:border-[#0B72E7]/40 w-full">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#EEF2F6] flex items-center justify-center shrink-0 border border-[#E2E8F0]">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-[#054380]" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-[#054380] text-sm sm:text-base leading-snug">
                Enable Ticketing for Guests
              </p>
              <p className="text-xs sm:text-sm text-[#64748B] mt-0.5 leading-snug">
                Replace RSVP page with ticket selection and payment
              </p>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={isTicketingEnabled}
            aria-label="Enable Ticketing for Guests"
            onClick={handleToggleTicketing}
            disabled={toggling}
            className={clsx(
              "relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
              isTicketingEnabled ? "bg-[#0B72E7]" : "bg-[#CBD5E1]",
              toggling && "opacity-60 cursor-not-allowed"
            )}
          >
            <span
              className={clsx(
                "pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                isTicketingEnabled ? "translate-x-5" : "translate-x-0"
              )}
            />
          </button>
        </div>
      </div>

      {/* Ticket Types Section (Screenshot 1 & 4) */}
      <div className="bg-white rounded-2xl border border-border shadow-sm p-6 sm:p-8 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-[#054380] font-bold text-base sm:text-lg">
            Ticket Types
          </h2>

          {/* Screenshot 4: Add Ticket Type button */}
          <button
            type="button"
            onClick={handleOpenAdd}
            className="w-full sm:w-[204px] h-[42px] px-3.5 py-3 bg-[#0B72E7] hover:bg-[#0961C5] text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors shadow-sm shrink-0"
          >
            <Plus className="w-4 h-4 shrink-0" strokeWidth={2.5} />
            <span>Add Ticket Type</span>
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-muted text-sm">
            Loading ticket types...
          </div>
        ) : ticketTypes.length === 0 ? (
          <div className="py-12 text-center text-muted text-sm border border-[#E2E8F0] rounded-xl bg-slate-50/50">
            No ticket types added yet. Click &quot;Add Ticket Type&quot; above to create one.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#E2E8F0]">
            <table className="w-full text-left border-collapse min-w-[650px]">
              <thead>
                <tr className="bg-[#E5EDF7] border-b border-[#E2E8F0]">
                  <th className="px-6 py-4 text-xs font-semibold text-[#475569] uppercase tracking-wider text-left">
                    TICKET NAME
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#475569] uppercase tracking-wider text-left">
                    PRICE (LKR)
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#475569] uppercase tracking-wider text-left">
                    DESCRIPTION
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#475569] uppercase tracking-wider text-center w-28">
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody>
                {ticketTypes.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="border-b border-[#E2E8F0] last:border-b-0 hover:bg-[#F8FAFC] transition-colors"
                  >
                    <td className="px-6 py-4 font-semibold text-[#054380] text-sm">
                      {ticket.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#334155] font-medium tabular-nums">
                      {Number(ticket.price).toLocaleString("en-US")}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#475569]">
                      {ticket.description || "—"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex justify-center">
                        <RowActionsMenu
                          id={ticket.id}
                          openId={openActionId}
                          setOpenId={setOpenActionId}
                          label={`Actions for ${ticket.name}`}
                          items={[
                            {
                              label: "View ticket type",
                              icon: Eye,
                              onClick: () => handleView(ticket),
                            },
                            {
                              label: "Edit ticket type",
                              icon: Pencil,
                              onClick: () => handleOpenEdit(ticket),
                            },
                            {
                              label: "Delete ticket type",
                              icon: Trash2,
                              destructive: true,
                              onClick: () => handleDelete(ticket),
                            },
                          ]}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Ticket Modal */}
      <TicketModal
        open={modalMode !== null}
        mode={modalMode || "add"}
        initialTicket={selectedTicket}
        saving={saving}
        onClose={() => {
          setModalMode(null);
          setSelectedTicket(null);
        }}
        onSubmit={handleSaveTicket}
      />

      {/* View Ticket Modal */}
      <ViewTicketModal
        open={viewTicket !== null}
        ticket={viewTicket}
        onClose={() => setViewTicket(null)}
        onEdit={(ticket) => {
          handleOpenEdit(ticket);
        }}
      />

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        open={deleteTicket !== null}
        title="Delete Ticket Type"
        itemName={deleteTicket?.name}
        description="This will permanently delete this ticket type from your event."
        onClose={() => setDeleteTicket(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
