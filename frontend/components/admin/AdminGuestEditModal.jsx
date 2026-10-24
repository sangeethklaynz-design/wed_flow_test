"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import ModalCloseButton from "@/components/ui/ModalCloseButton";

export default function AdminGuestEditModal({
  open,
  guest,
  onClose,
  onSubmit,
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      idNumber: "",
    },
  });

  useEffect(() => {
    if (!open || !guest) return;
    reset({
      name: guest.name || "",
      email: guest.email || "",
      phone: guest.phone || "",
      idNumber: guest.idNumber || "",
    });
  }, [open, guest, reset]);

  if (!open || !guest) return null;

  const handleFormSubmit = async (values) => {
    await onSubmit({
      id: guest.id,
      name: values.name.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      idNumber: values.idNumber.trim(),
    });
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-guest-edit-title"
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
            id="admin-guest-edit-title"
            className="font-serif font-bold text-xl text-navy mb-2"
          >
            Edit Guest
          </h2>
          <p className="text-muted text-sm">
            Ticket status and other system fields cannot be edited.
          </p>
        </div>

        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className="space-y-4 sm:space-y-5"
        >
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted block">
              Full name
            </label>
            <input
              type="text"
              placeholder="e.g. Tharindu Silva"
              {...register("name", { required: "Full name is required" })}
              className="w-full px-4 py-3 rounded-xl border border-border bg-white text-navy focus:outline-none focus:ring-2 focus:ring-[#054380]/50 transition-shadow placeholder:text-gray-300"
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted block">Email</label>
            <input
              type="email"
              placeholder="e.g. guest@email.com"
              {...register("email")}
              className="w-full px-4 py-3 rounded-xl border border-border bg-white text-navy focus:outline-none focus:ring-2 focus:ring-[#054380]/50 transition-shadow placeholder:text-gray-300"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted block">
              Mobile Number
            </label>
            <input
              type="tel"
              placeholder="+94 77 123 4567"
              {...register("phone", {
                required: "Mobile number is required",
                validate: (value) => {
                  const noSpaces = value.replace(/\s+/g, "");
                  if (!/^[+0-9]+$/.test(noSpaces)) {
                    return "Only numbers and '+' are allowed";
                  }
                  if (noSpaces.startsWith("0")) {
                    return (
                      noSpaces.length === 10 ||
                      "Number starting with 0 must be exactly 10 digits"
                    );
                  }
                  if (noSpaces.startsWith("+94")) {
                    return (
                      noSpaces.length === 12 ||
                      "Number starting with +94 must be exactly 12 characters"
                    );
                  }
                  return "Number must start with 0 or +94";
                },
              })}
              className="w-full px-4 py-3 rounded-xl border border-border bg-white text-navy focus:outline-none focus:ring-2 focus:ring-[#054380]/50 transition-shadow placeholder:text-gray-300"
            />
            {errors.phone && (
              <p className="text-xs text-red-500">{errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted block">
              ID Number
            </label>
            <input
              type="text"
              placeholder="e.g. 199012345678"
              {...register("idNumber")}
              className="w-full px-4 py-3 rounded-xl border border-border bg-white text-navy focus:outline-none focus:ring-2 focus:ring-[#054380]/50 transition-shadow placeholder:text-gray-300"
            />
          </div>

          <div className="space-y-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-navy text-white font-medium py-3.5 rounded-xl hover:bg-navy/90 transition-colors disabled:opacity-60"
            >
              {isSubmitting ? "Saving…" : "Save changes"}
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
