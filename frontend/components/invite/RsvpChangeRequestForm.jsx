"use client";

import { useState } from "react";
import Image from "next/image";
import { Lock } from "lucide-react";
import { apiRequest } from "@/lib/api";

export default function RsvpChangeRequestForm({ guestToken, rsvp, maxGuests }) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const attendanceLabel =
    rsvp?.attendingStatus === "attending"
      ? "Yes, I will attend"
      : rsvp?.attendingStatus === "declined"
      ? "No, I cannot attend"
      : "Pending";

  const handleSubmit = async () => {
    setError("");
    if (!reason.trim()) {
      setError("Please tell us the reason for your change request.");
      return;
    }
    setSubmitting(true);
    try {
      await apiRequest(
        `/api/public/invite/${encodeURIComponent(guestToken)}/rsvp-change-request`,
        { method: "POST", body: { reason: reason.trim() } }
      );
      setSubmitted(true);
    } catch (err) {
      setError(err.message || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="absolute -top-[350px] -left-[35px] w-[390px] h-[949px] bg-[#FAF6F0] z-50 flex flex-col items-center justify-start px-[35px] pt-[70px]">
      <h2 className="font-cormorant-custom font-semibold text-[34px] text-[#7732A4] tracking-normal leading-none text-center mb-2">
        NEED TO MAKE A<br />CHANGE?
      </h2>

      <div className="relative w-[150px] h-[28px] mb-4">
        <Image
          src="/invitation/page3-lotus-divider.png"
          alt="Lotus divider"
          fill
          className="object-contain"
        />
      </div>

      <p className="font-quattrocento-custom font-bold text-[14px] text-[#1B3601] text-center leading-[20px] mb-6">
        If you've made a mistake or need<br />
        to update your RSVP, you can<br />
        request to enable changes<br />
        again
      </p>

      {/* Read-only RSVP fields — always visible */}
      <div className="w-full flex flex-col gap-4 text-left mb-6">
        <div className="flex flex-col items-start">
          <label className="font-quattrocento-custom font-normal text-[13px] text-[#1B3601] tracking-wider uppercase mb-1 pl-2">
            Will you attend?
          </label>
          <div className="w-full h-[40px] bg-white border border-[#D1D1D1] text-[#7A7A7A] font-sans text-[13px] px-4 rounded-[20px] flex items-center justify-between opacity-80 cursor-not-allowed">
            <span>{attendanceLabel}</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 292.4 292.4" fill="#7A7A7A">
              <path d="M287 69.4a17.6 17.6 0 0 0-13-5.4H18.4c-5 0-9.3 1.8-12.9 5.4A17.6 17.6 0 0 0 0 82.2c0 5 1.8 9.3 5.4 12.9l128 127.9c3.6 3.6 7.8 5.4 12.8 5.4s9.2-1.8 12.8-5.4L287 95c3.5-3.5 5.4-7.8 5.4-12.8 0-5-1.9-9.2-5.5-12.8z"/>
            </svg>
          </div>
        </div>

        <div className="flex flex-col items-start">
          <label className="font-quattrocento-custom font-normal text-[13px] text-[#1B3601] tracking-wider uppercase mb-1 pl-2">
            Number of guests
          </label>
          <div className="w-full h-[40px] bg-white border border-[#D1D1D1] text-[#7A7A7A] font-sans text-[13px] px-4 flex items-center rounded-[20px] opacity-80 cursor-not-allowed">
            {rsvp?.attendingCount ?? maxGuests ?? "—"}
          </div>
        </div>

        <div className="flex flex-col items-start">
          <label className="font-quattrocento-custom font-normal text-[13px] text-[#1B3601] tracking-wider uppercase mb-1 pl-2">
            Your wishes for us
          </label>
          <div className="w-full h-[66px] bg-white border border-[#D1D1D1] text-[#7A7A7A] font-sans text-[13px] px-4 py-3 rounded-[20px] opacity-80 cursor-not-allowed overflow-hidden">
            {rsvp?.wishes || "Write your wishes....."}
          </div>
        </div>
      </div>

      {submitted ? (
        /* Success — replaces only the request-for-change section */
        <div className="w-full flex flex-col items-center gap-3 py-4 mb-2">
          <div className="relative w-[53px] h-[48px]">
            <Image
              src="/invitation/0.2.png"
              alt="Lotus"
              fill
              className="object-contain"
            />
          </div>
          <p className="font-quattrocento-custom font-bold text-[15px] text-[#1B3601] text-center leading-[22px] px-2">
            Your note has reached us<br />
            with care.
          </p>
        </div>
      ) : (
        <>
          {/* Divider button */}
          <button
            type="button"
            disabled
            className="w-full h-[44px] rounded-[22px] border border-[#C6A15B] bg-transparent flex items-center justify-center gap-2 mb-6 cursor-default shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7732A4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
            </svg>
            <span className="font-quattrocento-custom font-bold text-[12px] text-[#7732A4] uppercase tracking-wider">
              Request for RSVP Change
            </span>
          </button>

          {/* Reason textarea */}
          <div className="w-full flex flex-col items-start mb-5">
            <label className="font-quattrocento-custom font-normal text-[13px] text-[#1B3601] tracking-wider uppercase mb-1 pl-2">
              Tell us the reason
            </label>
            <textarea
              placeholder="Write the reason....."
              rows="2"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full h-[70px] bg-white border border-[#D1D1D1] text-[#7A7A7A] font-sans text-[13px] px-4 py-3 rounded-[20px] outline-none resize-none focus:border-[#7732A4]/50 transition-colors"
            />
          </div>

          {error && (
            <p className="text-[11px] text-red-600 text-center w-full mb-2">{error}</p>
          )}

          {/* Submit button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="w-[200px] h-[44px] bg-[#473284] hover:bg-[#3B286E] disabled:opacity-60 text-white font-quattrocento-custom font-bold text-[12px] uppercase tracking-widest rounded-[22px] transition-colors shadow-md flex items-center justify-center mb-5"
          >
            {submitting ? "Submitting..." : "Submit Request"}
          </button>

          {/* Disclaimer */}
          <div className="flex items-start gap-2 px-2 mb-4">
            <Lock className="w-3.5 h-3.5 text-[#473284] shrink-0 mt-0.5" strokeWidth={2} />
            <p className="font-quattrocento-custom text-[11px] text-[#473284] leading-[15px]">
              Your request will be reviewed, and RSVP access will be enabled again once approved.
            </p>
          </div>
        </>
      )}

      <div className="relative w-[150px] h-[30px] mt-2">
        <Image
          src="/invitation/page2-gold-divider.png"
          alt="Lotus"
          fill
          className="object-contain"
        />
      </div>
    </div>
  );
}
