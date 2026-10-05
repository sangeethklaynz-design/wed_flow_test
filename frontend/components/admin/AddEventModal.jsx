"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { apiRequest } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { EVENT_TYPE_LABELS } from "@/lib/adminEvents";
import ModalCloseButton from "@/components/ui/ModalCloseButton";

const TYPE_OPTIONS = [
  { value: "wedding", label: EVENT_TYPE_LABELS.wedding },
  { value: "corporate", label: EVENT_TYPE_LABELS.corporate },
  { value: "party", label: EVENT_TYPE_LABELS.party },
];

function localDateInputValue(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function minSelectableEventDate(mode, initialEventDate) {
  const today = localDateInputValue();
  if (
    mode === "edit" &&
    initialEventDate &&
    initialEventDate < today
  ) {
    return initialEventDate;
  }
  return today;
}

export default function AddEventModal({
  open,
  onClose,
  onSubmit,
  initialEvent,
  mode = "add",
}) {
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: "",
      type: "wedding",
      templateKey: "",
      eventDate: "",
      location: "",
      googleMapsLink: "",
      clientEmail: "",
    },
  });

  const selectedType = watch("type");

  useEffect(() => {
    if (!open) return;
    reset({
      name: initialEvent?.name ?? "",
      type: initialEvent?.type ?? "wedding",
      templateKey: initialEvent?.templateKey ?? "",
      eventDate: initialEvent?.eventDate ?? "",
      location: initialEvent?.location ?? "",
      googleMapsLink: initialEvent?.googleMapsLink ?? "",
      clientEmail: "",
    });
    setFormError("");
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, reset, initialEvent]);

  useEffect(() => {
    if (!open || !selectedType) return;

    let cancelled = false;
    (async () => {
      setTemplatesLoading(true);
      try {
        const data = await apiRequest(
          `/api/admin/templates?type=${encodeURIComponent(selectedType)}`,
          { token: getAccessToken() }
        );
        if (cancelled) return;
        const list = data.templates || [];
        setTemplates(list);
        const current = initialEvent?.type === selectedType
          ? initialEvent?.templateKey
          : "";
        if (current && list.includes(current)) {
          setValue("templateKey", current);
        } else if (list.length === 1) {
          setValue("templateKey", list[0]);
        } else {
          setValue("templateKey", "");
        }
      } catch (err) {
        if (!cancelled) {
          setTemplates([]);
          setFormError(err.message || "Failed to load templates");
        }
      } finally {
        if (!cancelled) setTemplatesLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, selectedType, setValue, initialEvent]);

  if (!open) return null;

  const handleFormSubmit = async (data) => {
    setFormError("");
    const today = localDateInputValue();
    const initialDate = initialEvent?.eventDate?.slice?.(0, 10) || initialEvent?.eventDate || "";
    if (
      data.eventDate < today &&
      !(mode === "edit" && data.eventDate === initialDate)
    ) {
      setFormError("Event date must be today or in the future.");
      return;
    }

    const payload = {
      id: initialEvent?.id,
      name: data.name.trim(),
      type: data.type,
      templateKey: data.templateKey,
      eventDate: data.eventDate,
      location: data.location.trim(),
      googleMapsLink: data.googleMapsLink.trim(),
    };
    if (mode === "add") {
      payload.clientEmail = String(data.clientEmail || "").trim().toLowerCase();
    }

    try {
      await onSubmit?.(payload);
      onClose();
    } catch (err) {
      setFormError(err.message || "Failed to save event");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-event-title"
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
            id="add-event-title"
            className="font-serif font-bold text-xl text-navy mb-2"
          >
            {mode === "edit" ? "Edit Event" : "Add Event"}
          </h2>
          <p className="text-muted text-sm">
            {mode === "edit"
              ? "Update event details and template selection."
              : "Create a new event in the admin catalogue."}
          </p>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted block">
              Event name
            </label>
            <input
              type="text"
              placeholder="Dinelka & Dishmi Wedding"
              {...register("name", { required: true })}
              className="w-full px-4 py-3 rounded-xl border border-border bg-white text-navy focus:outline-none focus:ring-2 focus:ring-[#054380]/50 transition-shadow placeholder:text-gray-300"
            />
            {errors.name ? (
              <p className="text-xs text-red-500">Name is required</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted block">Type</label>
            <select
              {...register("type", { required: true })}
              className="w-full px-4 py-3 rounded-xl border border-border bg-white text-navy focus:outline-none focus:ring-2 focus:ring-[#054380]/50 transition-shadow"
            >
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted block">
              Template
            </label>
            <select
              {...register("templateKey", { required: true })}
              disabled={templatesLoading || templates.length === 0}
              className="w-full px-4 py-3 rounded-xl border border-border bg-white text-navy focus:outline-none focus:ring-2 focus:ring-[#054380]/50 transition-shadow disabled:opacity-60"
            >
              <option value="">
                {templatesLoading
                  ? "Loading templates…"
                  : templates.length
                    ? "Select a template"
                    : "No templates found"}
              </option>
              {templates.map((key) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
            </select>
            {errors.templateKey ? (
              <p className="text-xs text-red-500">Template is required</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted block">
              Event date
            </label>
            <input
              type="date"
              min={minSelectableEventDate(mode, initialEvent?.eventDate?.slice?.(0, 10) || initialEvent?.eventDate || "")}
              {...register("eventDate", {
                required: true,
                validate: (value) => {
                  const today = localDateInputValue();
                  const initialDate =
                    initialEvent?.eventDate?.slice?.(0, 10) ||
                    initialEvent?.eventDate ||
                    "";
                  if (value >= today) return true;
                  if (mode === "edit" && value === initialDate) return true;
                  return "Date must be today or in the future";
                },
              })}
              className="w-full px-4 py-3 rounded-xl border border-border bg-white text-navy focus:outline-none focus:ring-2 focus:ring-[#054380]/50 transition-shadow"
            />
            {errors.eventDate ? (
              <p className="text-xs text-red-500">
                {errors.eventDate.message || "Date is required"}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted block">
              Location
            </label>
            <input
              type="text"
              placeholder="Venue or city"
              {...register("location")}
              className="w-full px-4 py-3 rounded-xl border border-border bg-white text-navy focus:outline-none focus:ring-2 focus:ring-[#054380]/50 transition-shadow placeholder:text-gray-300"
            />
          </div>

          {mode === "add" ? (
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted block">
                Client email
              </label>
              <input
                type="email"
                placeholder="client@example.com"
                {...register("clientEmail", { required: mode === "add" })}
                className="w-full px-4 py-3 rounded-xl border border-border bg-white text-navy focus:outline-none focus:ring-2 focus:ring-[#054380]/50 transition-shadow placeholder:text-gray-300"
              />
              <p className="text-[11px] text-muted">
                A login password is generated automatically. You can view or
                regenerate it from Actions → User credentials.
              </p>
              {errors.clientEmail ? (
                <p className="text-xs text-red-500">Client email is required</p>
              ) : null}
            </div>
          ) : null}

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted block">
              Google Maps link
            </label>
            <input
              type="url"
              placeholder="https://maps.google.com/..."
              {...register("googleMapsLink")}
              className="w-full px-4 py-3 rounded-xl border border-border bg-white text-navy focus:outline-none focus:ring-2 focus:ring-[#054380]/50 transition-shadow placeholder:text-gray-300"
            />
          </div>

          {formError ? (
            <p className="text-sm text-red-500 text-center">{formError}</p>
          ) : null}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-[#e8e8e8] text-muted font-medium py-3.5 rounded-xl hover:bg-[#dedede] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || templatesLoading}
              className="flex-1 bg-navy text-white font-medium py-3.5 rounded-xl hover:bg-navy/90 transition-colors disabled:opacity-60"
            >
              {isSubmitting
                ? "Saving…"
                : mode === "edit"
                  ? "Save changes"
                  : "Add event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
