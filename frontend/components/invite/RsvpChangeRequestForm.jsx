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

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-4 py-6">
        <div className="relative w-[53px] h-[48px]">
          <Image
            src="/invitation/page3-small-lotus.png"
            alt="Lotus"
            fill
            className="object-contain"
          />
        </div>
        <p className="font-quattrocento-custom font-bold text-[16px] text-[#1B3601] text-center leading-relaxed">
          Your request has been submitted.<br />We will review it shortly.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-0 w-[320px]">
      <h2 className="font-cormorant-custom font-semibold text-[32px] text-[#7732A4] tracking-normal leading-tight text-center mb-1">
        NEED TO MAKE A<br />CHANGE?
      </h2>

      <div className="relative w-[53px] h-[48px] my-2">
        <Image
          src="/invitation/page3-small-lotus.png"
          alt="Lotus divider"
          fill
          className="object-contain"
        />
      </div>

      <p className="font-quattrocento-custom font-bold text-[13px] text-[#1B3601] text-center leading-[20px] mb-5">
        If you've made a mistake or need<br />
        to update your RSVP, you can<br />
        request to enable changes<br />
        again
      </p>

      {/* Read-only RSVP fields */}
      <div className="w-full flex flex-col gap-[14px] text-left mb-4">
        <div className="flex flex-col items-start">
          <label className="font-quattrocento-custom font-normal text-[13px] text-[#1B3601] tracking-normal uppercase mb-1 pl-2">
            Will you attend?
          </label>
          <div className="w-full h-[36px] bg-[#F7F4EF] border border-[#D1D1D1] text-navy font-sans text-xs px-4 rounded-[20px] flex items-center opacity-70 cursor-not-allowed">
            {attendanceLabel}
          </div>
        </div>

        <div className="flex flex-col items-start">
          <label className="font-quattrocento-custom font-normal text-[13px] text-[#1B3601] tracking-normal uppercase mb-1 pl-2">
            Number of guests
          </label>
          <input
            type="text"
            value={rsvp?.attendingCount ?? ""}
            readOnly
            className="w-full h-[36px] bg-[#F7F4EF] border border-[#D1D1D1] text-navy font-sans text-xs px-4 rounded-[20px] outline-none opacity-70 cursor-not-allowed"
          />
        </div>

        <div className="flex flex-col items-start">
          <label className="font-quattrocento-custom font-normal text-[13px] text-[#1B3601] tracking-normal uppercase mb-1 pl-2">
            Your wishes for us
          </label>
          <textarea
            value={rsvp?.wishes ?? ""}
            readOnly
            rows="2"
            className="w-full h-[80px] bg-[#F7F4EF] border border-[#D1D1D1] text-navy font-sans text-xs px-4 py-3 rounded-[20px] outline-none resize-none opacity-70 cursor-not-allowed"
          />
        </div>
      </div>

      {/* Divider button */}
      <button
        type="button"
        disabled
        className="w-full h-[44px] rounded-[22px] border-2 border-[#C6A15B] bg-transparent flex items-center justify-center gap-2 mb-5 cursor-default"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C6A15B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
        </svg>
        <span className="font-quattrocento-custom font-bold text-[12px] text-[#C6A15B] uppercase tracking-wider">
          Request for RSVP Change
        </span>
      </button>

      {/* Reason textarea */}
      <div className="w-full flex flex-col items-start mb-4">
        <label className="font-quattrocento-custom font-normal text-[13px] text-[#1B3601] tracking-normal uppercase mb-1 pl-2">
          Tell us the reason
        </label>
        <textarea
          placeholder="Write the reason....."
          rows="3"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full h-[100px] bg-white border border-[#D1D1D1] text-navy font-sans text-xs px-4 py-3 rounded-[20px] outline-none resize-none focus:border-[#7732A4]/50 transition-colors"
        />
      </div>

      {error && (
        <p className="text-xs text-red-600 text-center w-full mb-2">{error}</p>
      )}

      {/* Submit button */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        className="w-[200px] h-[44px] bg-[#1B3601] hover:bg-[#1B3601]/90 disabled:opacity-60 text-white font-quattrocento-custom font-bold text-[12px] uppercase tracking-wider rounded-[22px] transition-colors shadow-md flex items-center justify-center mb-4"
      >
        {submitting ? "Submitting..." : "Submit Request"}
      </button>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 px-2">
        <Lock className="w-3.5 h-3.5 text-[#1B3601] shrink-0 mt-0.5" strokeWidth={2} />
        <p className="font-quattrocento-custom text-[11px] text-[#1B3601] leading-[16px]">
          Your request will be reviewed, and RSVP access will be enabled once approved.
        </p>
      </div>

      <div className="relative w-[138px] h-[50px] mt-4">
        <Image
          src="/invitation/page3-small-lotus.png"
          alt="Lotus"
          fill
          className="object-contain"
        />
      </div>
    </div>
  );
}
