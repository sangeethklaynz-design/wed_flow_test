"use client";

/**
 * Standalone RSVP card (legacy/alternate UI).
 * API: POST /api/public/invite/:token/rsvp
 * Note: Guest flow now uses InvitationPage built-in RSVP; this component is kept for reuse.
 */

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { CheckCircle2 } from "lucide-react";
import { apiRequest } from "@/lib/api";

export default function GuestRsvpForm({ token, guest, onSubmitted }) {
  const maxGuests = guest?.maxGuests || 1;
  const alreadySubmitted = guest?.rsvp?.hasSubmitted;
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(alreadySubmitted);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      status:
        guest?.rsvp?.attendingStatus === "declined"
          ? "DECLINED"
          : guest?.rsvp?.attendingStatus === "attending"
            ? "ATTENDING"
            : "ATTENDING",
      attendingCount: Math.min(
        Math.max(guest?.rsvp?.attendingCount || 1, 1),
        maxGuests
      ),
      wishes: guest?.rsvp?.wishes || "",
    },
  });

  const status = watch("status");

  useEffect(() => {
    if (status === "DECLINED") {
      setValue("attendingCount", 0);
    } else if (!watch("attendingCount") || watch("attendingCount") < 1) {
      setValue("attendingCount", 1);
    }
  }, [status, setValue, watch]);

  const onSubmit = async (data) => {
    setError("");
    setSubmitting(true);
    try {
      const result = await apiRequest(`/api/public/invite/${token}/rsvp`, {
        method: "POST",
        body: {
          status: data.status,
          attendingCount:
            data.status === "DECLINED" ? 0 : Number(data.attendingCount),
          wishes: data.wishes?.trim() || "",
        },
      });
      setDone(true);
      onSubmitted?.(result.guest);
    } catch (err) {
      setError(err.message || "Could not save your RSVP");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="bg-white rounded-[28px] border border-border card-shadow p-6 md:p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-gold mx-auto mb-4 flex items-center justify-center">
          <CheckCircle2 className="w-6 h-6 text-[#e69e46]" strokeWidth={2.25} />
        </div>
        <h3 className="font-serif font-bold text-2xl text-navy mb-2">
          Thank you
        </h3>
        <p className="text-muted text-sm mb-4">
          Your RSVP has been recorded
          {guest?.fullName ? ` for ${guest.fullName}` : ""}.
        </p>
        {!alreadySubmitted ? null : (
          <p className="text-xs text-muted">
            You can update your response below if plans change.
          </p>
        )}
        {alreadySubmitted ? (
          <button
            type="button"
            onClick={() => setDone(false)}
            className="mt-4 text-sm font-medium text-[#e69e46] hover:underline"
          >
            Update RSVP
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setDone(false)}
            className="mt-4 text-sm font-medium text-[#e69e46] hover:underline"
          >
            Edit response
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[28px] border border-border card-shadow p-6 md:p-8">
      <div className="mb-6">
        <h3 className="font-serif font-bold text-2xl text-navy mb-2">RSVP</h3>
        {guest?.fullName ? (
          <p className="text-navy font-medium text-sm mb-1">
            Dear {guest.fullName}
          </p>
        ) : null}
        {guest?.invitationNote ? (
          <p className="text-muted text-sm leading-relaxed">
            {guest.invitationNote}
          </p>
        ) : (
          <p className="text-muted text-sm">
            Please let us know if you can join us.
          </p>
        )}
        <p className="text-xs text-muted mt-3">
          You may RSVP for up to{" "}
          <span className="font-medium text-navy">{maxGuests}</span>{" "}
          {maxGuests === 1 ? "guest" : "guests"}.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted block">
            Will you attend?
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="cursor-pointer">
              <input
                type="radio"
                value="ATTENDING"
                className="sr-only peer"
                {...register("status", { required: true })}
              />
              <span className="block text-center px-4 py-3 rounded-xl border border-border bg-cream peer-checked:bg-gold peer-checked:border-[#e69e46]/40 peer-checked:text-navy font-medium text-sm transition-colors">
                Joyfully accept
              </span>
            </label>
            <label className="cursor-pointer">
              <input
                type="radio"
                value="DECLINED"
                className="sr-only peer"
                {...register("status", { required: true })}
              />
              <span className="block text-center px-4 py-3 rounded-xl border border-border bg-cream peer-checked:bg-gold peer-checked:border-[#e69e46]/40 peer-checked:text-navy font-medium text-sm transition-colors">
                Regretfully decline
              </span>
            </label>
          </div>
        </div>

        {status === "ATTENDING" ? (
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted block">
              Number of guests attending
            </label>
            <select
              {...register("attendingCount", {
                required: status === "ATTENDING",
                valueAsNumber: true,
                min: 1,
                max: maxGuests,
              })}
              className="w-full px-4 py-3 rounded-xl border border-border bg-white text-navy focus:outline-none focus:ring-2 focus:ring-[#e69e46]/50"
            >
              {Array.from({ length: maxGuests }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            {errors.attendingCount ? (
              <p className="text-xs text-red-500">
                Choose between 1 and {maxGuests}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted block">
            Wish note <span className="text-muted/70">(optional)</span>
          </label>
          <textarea
            rows={3}
            placeholder="Share a short wish for the couple…"
            {...register("wishes")}
            className="w-full px-4 py-3 rounded-xl border border-border bg-white text-navy focus:outline-none focus:ring-2 focus:ring-[#e69e46]/50 resize-none placeholder:text-gray-300"
          />
        </div>

        {error ? <p className="text-sm text-red-500">{error}</p> : null}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-navy text-white font-medium py-3.5 rounded-xl hover:bg-navy/90 transition-colors disabled:opacity-60"
        >
          {submitting ? "Sending…" : alreadySubmitted ? "Update RSVP" : "Send RSVP"}
        </button>
      </form>
    </div>
  );
}
