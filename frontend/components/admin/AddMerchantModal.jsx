"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Copy, Check } from "lucide-react";
import ModalCloseButton from "@/components/ui/ModalCloseButton";

export default function AddMerchantModal({ open, onClose, onSubmit }) {
  const [formError, setFormError] = useState("");
  const [credentials, setCredentials] = useState(null);
  const [copiedField, setCopiedField] = useState("");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: "",
      ownerEmail: "",
      maxStaffAccounts: 5,
    },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      name: "",
      ownerEmail: "",
      maxStaffAccounts: 5,
    });
    setFormError("");
    setCredentials(null);
    setCopiedField("");
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, reset]);

  if (!open) return null;

  const copyValue = async (field, value) => {
    try {
      await navigator.clipboard.writeText(String(value || ""));
      setCopiedField(field);
      window.setTimeout(() => setCopiedField(""), 1500);
    } catch {
      // ignore
    }
  };

  const handleFormSubmit = async (values) => {
    setFormError("");
    try {
      const result = await onSubmit?.({
        name: values.name.trim(),
        ownerEmail: values.ownerEmail.trim().toLowerCase(),
        maxStaffAccounts: Number(values.maxStaffAccounts) || 5,
      });
      if (result?.credentials) {
        setCredentials(result.credentials);
      } else {
        onClose();
      }
    } catch (err) {
      setFormError(err.message || "Failed to create merchant");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-merchant-title"
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
            id="add-merchant-title"
            className="font-serif font-bold text-xl text-navy mb-2"
          >
            {credentials ? "Merchant created" : "Add Merchant"}
          </h2>
          <p className="text-muted text-sm">
            {credentials
              ? "Save these login details. The password is shown only once."
              : "Create a merchant account that can own multiple corporate or party events."}
          </p>
        </div>

        {credentials ? (
          <div className="space-y-4">
            {[
              { key: "email", label: "Email", value: credentials.email },
              {
                key: "username",
                label: "Username",
                value: credentials.username,
              },
              {
                key: "password",
                label: "Password",
                value: credentials.password,
              },
            ].map((item) => (
              <div
                key={item.key}
                className="rounded-xl border border-border bg-white px-4 py-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0 text-left">
                  <p className="text-xs text-muted uppercase tracking-wide">
                    {item.label}
                  </p>
                  <p className="text-sm font-medium text-navy break-all mt-0.5">
                    {item.value || "—"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => copyValue(item.key, item.value)}
                  className="shrink-0 w-10 h-10 rounded-xl border border-border text-navy hover:bg-cream transition-colors inline-flex items-center justify-center"
                  aria-label={`Copy ${item.label}`}
                >
                  {copiedField === item.key ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={onClose}
              className="w-full bg-navy text-white font-medium py-3.5 rounded-xl hover:bg-navy/90 transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted block">
                Merchant name
              </label>
              <input
                type="text"
                placeholder="Kingsbury Events"
                {...register("name", { required: true })}
                className="w-full px-4 py-3 rounded-xl border border-border bg-white text-navy focus:outline-none focus:ring-2 focus:ring-[#054380]/50 transition-shadow placeholder:text-gray-300"
              />
              {errors.name ? (
                <p className="text-xs text-red-500">Merchant name is required</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted block">
                Owner email
              </label>
              <input
                type="email"
                placeholder="merchant@example.com"
                {...register("ownerEmail", { required: true })}
                className="w-full px-4 py-3 rounded-xl border border-border bg-white text-navy focus:outline-none focus:ring-2 focus:ring-[#054380]/50 transition-shadow placeholder:text-gray-300"
              />
              {errors.ownerEmail ? (
                <p className="text-xs text-red-500">Owner email is required</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted block">
                Max staff accounts
              </label>
              <input
                type="number"
                min={0}
                max={100}
                {...register("maxStaffAccounts", {
                  valueAsNumber: true,
                  min: 0,
                })}
                className="w-full px-4 py-3 rounded-xl border border-border bg-white text-navy focus:outline-none focus:ring-2 focus:ring-[#054380]/50 transition-shadow"
              />
              <p className="text-[11px] text-muted">
                How many staff seats this merchant can create later.
              </p>
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
                disabled={isSubmitting}
                className="flex-1 bg-navy text-white font-medium py-3.5 rounded-xl hover:bg-navy/90 transition-colors disabled:opacity-60"
              >
                {isSubmitting ? "Creating…" : "Add merchant"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
