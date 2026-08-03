"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";

export default function AddGuestModal({ open, onClose, onAdd }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      phone: "",
      invitees: "",
      note: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    reset();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, reset]);

  if (!open) return null;

  const onSubmit = (data) => {
    onAdd?.({
      name: data.name.trim(),
      phone: data.phone.trim(),
      guestCount: Number(data.invitees) || 1,
      note: data.note?.trim() || "",
      status: "pending",
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-guests-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-navy/40"
        aria-label="Close dialog"
        onClick={onClose}
      />

      <div className="relative w-full sm:max-w-md bg-cream sm:rounded-[28px] rounded-t-[28px] p-6 sm:p-8 card-shadow max-h-[92vh] overflow-y-auto">
        <div className="text-center mb-8">
          <h2
            id="add-guests-title"
            className="font-serif font-bold text-3xl text-navy mb-2"
          >
            Add Guests
          </h2>
          <p className="text-muted text-sm">
            They&apos;ll be added as pending until they RSVP.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted block">
              Full name
            </label>
            <input
              type="text"
              placeholder="e.g. Tharindu Silva"
              {...register("name", { required: true })}
              className="w-full px-4 py-3 rounded-xl border border-border bg-white text-navy focus:outline-none focus:ring-2 focus:ring-[#e69e46]/50 transition-shadow placeholder:text-gray-300"
            />
            {errors.name && (
              <p className="text-xs text-red-500">Full name is required</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted block">
              WhatsApp number
            </label>
            <input
              type="tel"
              placeholder="+94 77 123 4567"
              {...register("phone", { required: true })}
              className="w-full px-4 py-3 rounded-xl border border-border bg-white text-navy focus:outline-none focus:ring-2 focus:ring-[#e69e46]/50 transition-shadow placeholder:text-gray-300"
            />
            {errors.phone && (
              <p className="text-xs text-red-500">WhatsApp number is required</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted block">
              Number of Invitees
            </label>
            <input
              type="number"
              min={1}
              {...register("invitees", { required: true, min: 1 })}
              className="w-full px-4 py-3 rounded-xl border border-border bg-white text-navy focus:outline-none focus:ring-2 focus:ring-[#e69e46]/50 transition-shadow placeholder:text-gray-300"
            />
            {errors.invitees && (
              <p className="text-xs text-red-500">Enter at least 1 invitee</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted block">
              Invitation Note
            </label>
            <textarea
              rows={3}
              placeholder="e.g. You and your family"
              {...register("note")}
              className="w-full px-4 py-3 rounded-xl border border-border bg-white text-navy focus:outline-none focus:ring-2 focus:ring-[#e69e46]/50 transition-shadow placeholder:text-gray-300 resize-none"
            />
          </div>

          <div className="space-y-3 pt-2">
            <button
              type="submit"
              className="w-full bg-navy text-white font-medium py-3.5 rounded-xl hover:bg-navy/90 transition-colors"
            >
              Add guest
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
