"use client";

import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import TimePicker from "@/components/ui/TimePicker";
import ModalCloseButton from "@/components/ui/ModalCloseButton";

const SCHEDULE_ICONS = [
  { id: "drink", label: "Drinks", emoji: "🍸" },
  { id: "mic", label: "Speeches", emoji: "🎤" },
  { id: "food", label: "Dining", emoji: "🍽️" },
  { id: "music", label: "Live Music", emoji: "🎵" },
  { id: "dj", label: "DJ & Party", emoji: "🎧" },
  { id: "celebrate", label: "Celebration", emoji: "🎉" },
];

export default function AddScheduleEventModal({
  open,
  onClose,
  onSubmit,
  initialEvent,
  mode = "add",
  existingEvents = [],
}) {
  const [customError, setCustomError] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("celebrate");

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: "",
      startTime: "",
      endTime: "",
      location: "",
      specialNotes: "",
      notificationEnabled: false,
    },
  });

  useEffect(() => {
    if (!open) return;
    setCustomError("");
    const ev = initialEvent || {};
    setSelectedIcon(ev.icon || "celebrate");
    reset({
      title: ev.title ?? "",
      startTime: ev.startTime ?? "",
      endTime: ev.endTime ?? "",
      location: ev.location ?? ev.specialNotes ?? "",
      specialNotes: ev.specialNotes ?? ev.location ?? "",
      notificationEnabled: ev.notificationEnabled ?? false,
    });
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, reset, initialEvent]);

  if (!open) return null;

  const handleFormSubmit = async (data) => {
    setCustomError("");

    if (data.startTime >= data.endTime) {
      setCustomError("Starting time must be before ending time.");
      return;
    }

    const payload = {
      id: initialEvent?.id,
      title: data.title.trim(),
      startTime: data.startTime,
      endTime: data.endTime,
      location: data.location?.trim() || data.specialNotes?.trim() || "",
      specialNotes: data.specialNotes?.trim() || data.location?.trim() || "",
      icon: selectedIcon || "celebrate",
      notificationEnabled:
        mode === "edit" ? Boolean(data.notificationEnabled) : false,
      status: mode === "edit" ? initialEvent?.status : "upcoming",
    };

    try {
      await onSubmit?.(payload);
      onClose();
    } catch (err) {
      setCustomError(err.message || "Failed to save event. Please try again.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="schedule-event-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-navy/40"
        aria-label="Close dialog"
        onClick={onClose}
      />

      <div className="relative w-full sm:max-w-md bg-cream sm:rounded-[28px] rounded-t-[28px] p-6 sm:p-8 card-shadow max-h-[92vh] overflow-y-auto">
        <ModalCloseButton onClick={onClose} />
        <div className="text-center mb-6 sm:mb-7 pr-12">
          <h2
            id="schedule-event-title"
            className="font-serif font-bold text-xl text-navy mb-2"
          >
            {mode === "edit" ? "Edit Event" : "Add Event"}
          </h2>
          <p className="text-muted text-sm">
            {mode === "edit"
              ? "Update the details and icon for your schedule moment."
              : "Add a new moment to your event schedule."}
          </p>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 sm:space-y-5">
          {customError && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">
              {customError}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted block">
              Event name
            </label>
            <input
              type="text"
              placeholder="e.g. Lunch Reception"
              {...register("title", { required: true })}
              className="w-full px-4 py-3 rounded-xl border border-border bg-white text-navy focus:outline-none focus:ring-2 focus:ring-[#054380]/50 transition-shadow placeholder:text-gray-300"
            />
            {errors.title && (
              <p className="text-xs text-red-500">Event name is required</p>
            )}
          </div>

          {/* Template Icon Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted block">
              Event Icon / Category
            </label>
            <div className="grid grid-cols-3 gap-2">
              {SCHEDULE_ICONS.map((item) => {
                const isSelected = selectedIcon === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedIcon(item.id)}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-medium transition-all ${
                      isSelected
                        ? "border-[#054380] bg-[#054380]/10 text-[#054380] font-semibold"
                        : "border-border bg-white text-navy hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-base">{item.emoji}</span>
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted block">
                Starting time
              </label>
              <Controller
                name="startTime"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TimePicker
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    aria-label="Starting time"
                    hasError={!!errors.startTime}
                  />
                )}
              />
              {errors.startTime && (
                <p className="text-xs text-red-500">Starting time is required</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted block">
                Ending time
              </label>
              <Controller
                name="endTime"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TimePicker
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    aria-label="Ending time"
                    hasError={!!errors.endTime}
                  />
                )}
              />
              {errors.endTime && (
                <p className="text-xs text-red-500">Ending time is required</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted block">
              Location / Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Main Ballroom · Red Carpet Area"
              {...register("location")}
              className="w-full px-4 py-3 rounded-xl border border-border bg-white text-navy focus:outline-none focus:ring-2 focus:ring-[#054380]/50 transition-shadow placeholder:text-gray-300"
            />
          </div>

          {mode === "edit" ? (
            <label className="flex items-start gap-3 rounded-2xl border border-border bg-white px-4 py-3 cursor-pointer">
              <input
                type="checkbox"
                {...register("notificationEnabled")}
                className="mt-1 h-4 w-4 rounded border-border text-navy focus:ring-[#054380]/50"
              />
              <span>
                <span className="block text-sm font-medium text-navy">
                  Notify at event time
                </span>
                <span className="block text-xs text-muted mt-1">
                  Wed Flow will request browser notification permission and alert you when the event starts.
                </span>
              </span>
            </label>
          ) : null}

          <div className="space-y-3 pt-2">
            <button
              type="submit"
              className="w-full bg-navy text-white font-medium py-3.5 rounded-xl hover:bg-navy/90 transition-colors"
            >
              {mode === "edit" ? "Save changes" : "Add event"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full bg-[#e8e8e8] text-muted font-medium py-3.5 rounded-xl hover:bg-[#dedede] transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
