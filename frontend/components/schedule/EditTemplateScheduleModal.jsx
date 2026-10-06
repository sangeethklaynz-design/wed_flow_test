"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, ArrowUp, ArrowDown, Sparkles } from "lucide-react";
import ModalCloseButton from "@/components/ui/ModalCloseButton";
import { apiRequest } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

const SCHEDULE_ICONS = [
  { id: "drink", label: "Drinks", emoji: "🍸" },
  { id: "mic", label: "Speeches", emoji: "🎤" },
  { id: "food", label: "Dining", emoji: "🍽️" },
  { id: "music", label: "Music", emoji: "🎵" },
  { id: "dj", label: "DJ", emoji: "🎧" },
  { id: "celebrate", label: "Celebrate", emoji: "🎉" },
];

export default function EditTemplateScheduleModal({ open, onClose, onSaved }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [scheduleTitle, setScheduleTitle] = useState("");
  const [scheduleSubtitle, setScheduleSubtitle] = useState("");
  const [scheduleNotes, setScheduleNotes] = useState("");
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!open) return;
    setError("");
    setSuccess("");
    setLoading(true);

    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const data = await apiRequest("/api/couple/schedule/template", { token });
        if (cancelled) return;
        setScheduleTitle(data.scheduleTitle || "");
        setScheduleSubtitle(data.scheduleSubtitle || "");
        setScheduleNotes(data.scheduleNotes || "");
        setItems(
          (data.items || []).map((it, idx) => ({
            id: it.id || `item-${idx + 1}`,
            time: it.time || "09:00 AM",
            title: it.title || `Moment ${idx + 1}`,
            location: it.location || "",
            icon: it.icon || "celebrate",
          }))
        );
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Failed to load template schedule details");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      cancelled = true;
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const handleUpdateItem = (index, field, value) => {
    setItems((prev) =>
      prev.map((it, idx) => (idx === index ? { ...it, [field]: value } : it))
    );
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}`,
        time: "07:00 PM",
        title: "New Program Item",
        location: "",
        icon: "celebrate",
      },
    ]);
  };

  const handleRemoveItem = (index) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleMoveUp = (index) => {
    if (index === 0) return;
    setItems((prev) => {
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const handleMoveDown = (index) => {
    if (index === items.length - 1) return;
    setItems((prev) => {
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    const token = getAccessToken();
    if (!token) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await apiRequest("/api/couple/schedule/template", {
        method: "PUT",
        token,
        body: {
          scheduleTitle: scheduleTitle.trim(),
          scheduleSubtitle: scheduleSubtitle.trim(),
          scheduleNotes: scheduleNotes.trim(),
          items: items.map((it) => ({
            time: it.time.trim(),
            title: it.title.trim(),
            location: it.location.trim(),
            icon: it.icon || "celebrate",
          })),
        },
      });

      setSuccess("Template schedule updated and synchronized across all pages!");
      onSaved?.();
      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err) {
      setError(err.message || "Failed to save template schedule.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[65] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="template-schedule-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-navy/40"
        aria-label="Close dialog"
        onClick={onClose}
      />

      <div className="relative w-full sm:max-w-2xl bg-[#faf7f2] sm:rounded-[32px] rounded-t-[32px] p-6 sm:p-8 card-shadow max-h-[92vh] flex flex-col overflow-hidden">
        <ModalCloseButton onClick={onClose} />

        <div className="text-left mb-6 pr-12 shrink-0">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#054380]/10 text-[#054380] text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Template Schedule
          </div>
          <h2
            id="template-schedule-title"
            className="font-serif font-bold text-2xl text-navy mb-1"
          >
            Customize Template Schedule
          </h2>
          <p className="text-muted text-sm">
            Edit the title, subtitle, and timeline items displayed on your invitation template, guest page, and schedule.
          </p>
        </div>

        {error ? (
          <div className="mb-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3 shrink-0">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="mb-4 bg-green-50 border border-green-100 text-green-700 text-sm rounded-xl px-4 py-3 shrink-0 font-medium">
            ✓ {success}
          </div>
        ) : null}

        {loading ? (
          <div className="py-12 text-center text-muted text-sm flex-1">
            Loading template schedule details…
          </div>
        ) : (
          <form
            onSubmit={handleSave}
            className="flex-1 overflow-y-auto space-y-6 pr-1 pb-4"
          >
            {/* Header Settings */}
            <div className="bg-white rounded-2xl border border-border p-5 space-y-4 shadow-sm">
              <h3 className="font-semibold text-navy text-sm">Section Header</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted block mb-1">
                    Schedule Title
                  </label>
                  <input
                    type="text"
                    value={scheduleTitle}
                    onChange={(e) => setScheduleTitle(e.target.value)}
                    placeholder="e.g. Order of Events, Event Agenda, Party Timeline"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-[#fdfdfd] text-navy focus:outline-none focus:ring-2 focus:ring-[#054380]/40 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted block mb-1">
                    Subtitle / Tagline
                  </label>
                  <input
                    type="text"
                    value={scheduleSubtitle}
                    onChange={(e) => setScheduleSubtitle(e.target.value)}
                    placeholder="e.g. A timeline of our celebration"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-[#fdfdfd] text-navy focus:outline-none focus:ring-2 focus:ring-[#054380]/40 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Timeline Items List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-navy text-sm">
                  Timeline Items ({items.length})
                </h3>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#054380] hover:text-[#054380]/80 bg-[#054380]/10 px-3 py-1.5 rounded-xl transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Moment
                </button>
              </div>

              {items.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-gray-300">
                  <p className="text-muted text-sm mb-3">No schedule items configured.</p>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold bg-navy text-white px-4 py-2 rounded-xl"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add First Item
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div
                      key={item.id || index}
                      className="bg-white rounded-2xl border border-border p-4 shadow-sm hover:border-[#054380]/40 transition-colors space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-2">
                        <span className="text-xs font-bold text-[#054380] bg-[#054380]/10 px-2.5 py-0.5 rounded-full">
                          #{index + 1}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => handleMoveUp(index)}
                            aria-label="Move item up"
                            className="p-1 text-gray-400 hover:text-navy disabled:opacity-30 disabled:hover:text-gray-400"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            disabled={index === items.length - 1}
                            onClick={() => handleMoveDown(index)}
                            aria-label="Move item down"
                            className="p-1 text-gray-400 hover:text-navy disabled:opacity-30 disabled:hover:text-gray-400"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            aria-label="Delete item"
                            className="p-1 text-red-500 hover:text-red-700 ml-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-medium text-muted block mb-1">
                            Time range / display
                          </label>
                          <input
                            type="text"
                            value={item.time}
                            onChange={(e) =>
                              handleUpdateItem(index, "time", e.target.value)
                            }
                            placeholder="e.g. 06:00 PM - 07:00 PM"
                            className="w-full px-3 py-2 rounded-xl border border-border bg-[#fdfdfd] text-navy text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#054380]/30"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-medium text-muted block mb-1">
                            Event title
                          </label>
                          <input
                            type="text"
                            value={item.title}
                            onChange={(e) =>
                              handleUpdateItem(index, "title", e.target.value)
                            }
                            placeholder="e.g. Welcome Drinks"
                            className="w-full px-3 py-2 rounded-xl border border-border bg-[#fdfdfd] text-navy text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#054380]/30"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
                        <div>
                          <label className="text-[11px] font-medium text-muted block mb-1">
                            Location / details
                          </label>
                          <input
                            type="text"
                            value={item.location}
                            onChange={(e) =>
                              handleUpdateItem(index, "location", e.target.value)
                            }
                            placeholder="e.g. Red Carpet Area"
                            className="w-full px-3 py-2 rounded-xl border border-border bg-[#fdfdfd] text-navy text-xs focus:outline-none focus:ring-2 focus:ring-[#054380]/30"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-medium text-muted block mb-1">
                            Icon
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            {SCHEDULE_ICONS.map((iconOpt) => {
                              const active = item.icon === iconOpt.id;
                              return (
                                <button
                                  key={iconOpt.id}
                                  type="button"
                                  onClick={() =>
                                    handleUpdateItem(index, "icon", iconOpt.id)
                                  }
                                  className={`px-2 py-1 rounded-lg text-xs flex items-center gap-1 border transition-all ${
                                    active
                                      ? "border-[#054380] bg-[#054380] text-white shadow-xs"
                                      : "border-border bg-gray-50 text-gray-700 hover:bg-gray-100"
                                  }`}
                                >
                                  <span>{iconOpt.emoji}</span>
                                  <span className="text-[10px]">{iconOpt.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom action buttons */}
            <div className="pt-4 border-t border-border flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-border bg-white text-muted hover:text-navy hover:bg-gray-50 font-medium text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-navy text-white hover:bg-navy/90 font-medium text-sm transition-colors shadow-sm disabled:opacity-50"
              >
                {saving ? "Saving changes…" : "Save Template Schedule"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
