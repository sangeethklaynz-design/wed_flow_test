"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { apiRequest, resolveMediaUrl } from "@/lib/api";
import {
  normalizeInvitationTemplate,
  splitSpecialText,
} from "@/lib/inviteTemplate";

const JOURNEY_FALLBACKS = [
  "/invitation/7.2.png",
  "/invitation/7.3.png",
  "/invitation/7.4.png",
  "/invitation/7.5.png",
];

/**
 * Full visual invitation template.
 *
 * API data:
 * - Couple preview: pass `data` from GET /api/couple/invitation-template
 * - Guest invite: pass `data` from GET /api/public/invite/:token/invitation-template
 * - RSVP submit: POST /api/public/invite/:token/rsvp (when guestToken + interactive)
 * - Our Journey images: static.images[] → /assets/couple_images/<slug>/...
 */
export default function InvitationPage({
  data = null,
  guestToken = null,
  interactive = true,
  /** When true, omit outer border/shadow — parent phone shell owns chrome */
  embedded = false,
}) {
  const t = useMemo(() => normalizeInvitationTemplate(data), [data]);
  const specialLines = useMemo(() => splitSpecialText(t.specialText), [t.specialText]);
  const journeyImages = useMemo(() => {
    const fromApi = (t.images || [])
      .map((img) => resolveMediaUrl(img.url))
      .filter(Boolean);
    return [0, 1, 2, 3].map(
      (i) => fromApi[i] || JOURNEY_FALLBACKS[i]
    );
  }, [t.images]);
  const router = useRouter();

  const [attendance, setAttendance] = useState("");
  const [attendanceOpen, setAttendanceOpen] = useState(false);
  const [guests, setGuests] = useState("");
  const [wishes, setWishes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [rsvpError, setRsvpError] = useState("");
  const dropdownRef = useRef(null);
  const rsvpLocked = Boolean(guestToken && t.rsvp?.hasSubmitted);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setAttendanceOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!t.rsvp) return;
    if (t.rsvp.attendingStatus === "declined") {
      setAttendance("no");
      setGuests("0");
    } else if (t.rsvp.attendingStatus === "attending") {
      setAttendance("yes");
      setGuests(String(t.rsvp.attendingCount || 1));
    }
    setWishes(t.rsvp.wishes || "");
  }, [t.rsvp]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setRsvpError("");

    if (!interactive || !guestToken) {
      router.push("/invitation/thank-you");
      return;
    }

    if (rsvpLocked) {
      setRsvpError("Your RSVP has already been submitted.");
      return;
    }

    if (!attendance) {
      setRsvpError("Please select whether you will attend.");
      return;
    }

    const status = attendance === "yes" ? "ATTENDING" : "DECLINED";
    let attendingCount = status === "DECLINED" ? 0 : Number(guests);

    if (status === "ATTENDING") {
      if (!Number.isInteger(attendingCount) || attendingCount < 1) {
        setRsvpError("Enter a valid number of guests.");
        return;
      }
      if (attendingCount > t.maxGuests) {
        setRsvpError(`You may RSVP for up to ${t.maxGuests} guests.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      // API: POST /api/public/invite/:token/rsvp
      await apiRequest(`/api/public/invite/${encodeURIComponent(guestToken)}/rsvp`, {
        method: "POST",
        body: {
          status,
          attendingCount,
          wishes: wishes.trim(),
        },
      });
      router.push(`/invitation/thank-you?token=${encodeURIComponent(guestToken)}`);
    } catch (err) {
      setRsvpError(err.message || "Could not save RSVP");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`relative w-[390px] h-[7020px] mx-auto bg-[#FAF6F0] overflow-hidden select-none ${
      embedded ? "" : "shadow-2xl border border-gray-200"
    }`}>
      
      {/* =========================================================
          PAGE 1 (Y: 1085 -> Y: 1960)
          ========================================================= */}

      {/* Top Flower Decoration (Width: 390px, Height: 175px, Y: 0) */}
      <div className="absolute top-0 left-0 w-[390px] h-[175px] pointer-events-none select-none z-0">
        <Image 
          src="/invitation/top-flower.png" 
          alt="Top floral decoration" 
          fill 
          className="object-contain object-center"
          priority
        />
      </div>

      {/* Bottom Flower Decoration (Width: 389px, Height: 592px, Y: 283px) */}
      <div className="absolute top-[283px] left-[0.5px] w-[389px] h-[592px] pointer-events-none select-none z-0">
        <Image 
          src="/invitation/bottom-flower.png" 
          alt="Bottom floral decoration" 
          fill 
          className="object-contain object-bottom"
          priority
        />
      </div>

      {/* Page 1 Text Content */}
      <span className="absolute top-[175px] left-0 w-[390px] font-serif font-semibold text-[14px] text-[#B54AB6] uppercase tracking-[0.05em] leading-none flex items-center justify-center text-center z-10">
        Together, we begin
      </span>

      <div className="absolute top-[214px] left-[182.5px] w-[25px] h-[40px] z-10">
        <Image 
          src="/invitation/heart.png" 
          alt="Heart" 
          fill 
          className="object-contain"
        />
      </div>

      <div className="absolute top-[277px] left-0 w-[390px] h-[178px] flex flex-col items-center justify-center z-10">
        <h2 className="font-script-custom text-[68px] text-[#7732A4] leading-none mb-1">
          {t.groomName}
        </h2>
        <span className="font-script-custom text-[42px] text-[#7732A4] leading-none my-1">
          &
        </span>
        <h2 className="font-script-custom text-[68px] text-[#7732A4] leading-none mt-1">
          {t.brideName}
        </h2>
      </div>

      <div className="absolute top-[478px] left-0 w-[390px] h-[66px] flex items-center justify-center z-10">
        <p className="font-serif text-[28px] font-extrabold text-[#7732A4] tracking-wider leading-none">
          {t.formattedDate}
        </p>
      </div>

      <div className="absolute top-[527px] left-[126.5px] w-[137px] h-[91px] z-10">
        <Image 
          src="/invitation/gold-lotus.png" 
          alt="Gold lotus divider" 
          fill 
          className="object-contain"
        />
      </div>


      {/* =========================================================
          PAGE 2 (Y: 1960 -> Y: 2780)
          ========================================================= */}

      {/* Card Header Frame (Width: 390px, Height: 276px, Y: 867px) */}
      <div className="absolute top-[867px] left-0 w-[390px] h-[276px] z-0">
        <Image 
          src="/invitation/page2-card-header.png" 
          alt="Page 2 card header decoration" 
          fill 
          className="object-contain"
        />
      </div>

      {/* "TOGETHER WITH OUR FAMILIES" */}
      <span className="absolute top-[1025px] left-0 w-[390px] font-serif font-semibold text-[14px] text-[#B54AB6] uppercase tracking-[0.05em] leading-tight flex items-center justify-center text-center z-10">
        Together with our families
      </span>

      {/* Guest invitation note (or dotted placeholders in couple preview) */}
      <div className="absolute top-[1065px] left-0 w-[390px] h-[75px] flex flex-col items-center justify-center z-10">
        <p className="font-greatvibes-custom text-[32px] text-[#7732A4] leading-none mb-1">
          {t.invitationNoteLine1}
        </p>
        <p className="font-greatvibes-custom text-[32px] text-[#7732A4] leading-none mt-1">
          {t.invitationNoteLine2}
        </p>
      </div>

      {/* Lotus Divider (Width: 175px, Height: 34px, Y: 1143px) */}
      <div className="absolute top-[1143px] left-[107.5px] w-[175px] h-[34px] z-0">
        <Image 
          src="/invitation/page2-lotus-divider.png" 
          alt="Lotus divider" 
          fill 
          className="object-contain"
        />
      </div>

      {/* Main Paragraph */}
      <div className="absolute top-[1205px] left-[20px] w-[350px] font-quattrocento-custom font-bold text-[13px] text-[#1B3601] tracking-[0.05em] leading-[24px] text-center z-10">
        {specialLines.map((line, index) => (
          <React.Fragment key={`${line}-${index}`}>
            {line}
            {index < specialLines.length - 1 ? <br /> : null}
          </React.Fragment>
        ))}
      </div>

      {/* Pearl Divider (Width: 158px, Height: 17px, Y: 1351px) */}
      <div className="absolute top-[1351px] left-[116px] w-[158px] h-[17px] z-0">
        <Image 
          src="/invitation/page2-pearl-divider.png" 
          alt="Pearl divider" 
          fill 
          className="object-contain"
        />
      </div>

      {/* "Your presence will be" */}
      <span className="absolute top-[1395px] left-0 w-[390px] font-quattrocento-custom font-bold text-[13px] text-[#1B3601] tracking-[0.05em] leading-[24px] text-center z-10">
        Your presence will be
      </span>

      {/* "Our greatest gift." */}
      <p className="absolute top-[1428px] left-0 w-[390px] font-pinyon-custom text-[40px] text-[#7732A4] leading-none text-center z-10">
        Our greatest gift.
      </p>

      {/* Bottom Left Floral Bouquet */}
      <div className="absolute top-[1393px] left-0 w-[127px] h-[254px] z-0">
        <Image 
          src="/invitation/page2-left-flower.png" 
          alt="Bottom left bouquet" 
          fill 
          className="object-fill"
        />
      </div>

      {/* Bottom Right Floral Bouquet */}
      <div className="absolute top-[1393px] right-0 w-[127px] h-[254px] z-0">
        <Image 
          src="/invitation/page2-right-flower.png" 
          alt="Bottom right bouquet" 
          fill 
          className="object-fill"
        />
      </div>

      {/* Gold Lotus Divider */}
      <div className="absolute top-[1625px] left-[130px] w-[130px] h-[33px] z-0">
        <Image 
          src="/invitation/page2-gold-divider.png" 
          alt="Gold lotus divider bottom" 
          fill 
          className="object-contain"
        />
      </div>


      {/* =========================================================
          PAGE 3 (RSVP Section, Y: 2780 -> Y: 3626)
          ========================================================= */}

      {/* "BE OUR GUEST" (Cormorant Garamond SemiBold 38px, Color: #7732A4, Y: 1719px) */}
      <h1 className="absolute top-[1719px] left-0 w-[390px] font-cormorant-custom font-semibold text-[38px] text-[#7732A4] tracking-normal leading-none text-center z-10">
        BE OUR GUEST
      </h1>

      {/* "RSVP" (Cormorant Garamond Bold 38px, Color: #B54AB6, Y: 1780px) */}
      <h1 className="absolute top-[1780px] left-0 w-[390px] font-cormorant-custom font-bold text-[38px] text-[#B54AB6] tracking-normal leading-none text-center z-10">
        RSVP
      </h1>

      {/* Lotus Divider (Width: 175px, Height: 34px, Y: 1840px) */}
      <div className="absolute top-[1840px] left-[107.5px] w-[175px] h-[34px] z-0">
        <Image 
          src="/invitation/page3-lotus-divider.png" 
          alt="Page 3 lotus divider" 
          fill 
          className="object-contain"
        />
      </div>

      {/* "We'd love to celebrate with you!" (Quattrocento Bold 20px, Line Height: 25px, Color: #1B3601, Y: 1895px) */}
      <div className="absolute top-[1895px] left-[20px] w-[350px] font-quattrocento-custom font-bold text-[20px] text-[#1B3601] tracking-[0.05em] leading-[25px] text-center z-10">
        We'd love to celebrate<br />with you!
      </div>

      {/* Small Lotus (Width: 53px, Height: 48px, Y: 1951px) */}
      <div className="absolute top-[1951px] left-[168.5px] w-[53px] h-[48px] z-0">
        <Image 
          src="/invitation/page3-small-lotus.png" 
          alt="Page 3 small lotus" 
          fill 
          className="object-contain"
        />
      </div>

      {/* RSVP Form Inputs container (Y: 2010px -> Y: 2240px, centered at left-[35px] with W: 320px) */}
      <form onSubmit={handleSubmit} className="absolute top-[2010px] left-[35px] w-[320px] z-10 flex flex-col gap-[18px] text-left">
        
        {/* Will You Attend */}
        <div className="flex flex-col items-start" ref={dropdownRef}>
          <label className="font-quattrocento-custom font-normal text-[15px] text-[#1B3601] tracking-normal uppercase mb-1.5 text-left w-full pl-2">
            Will you attend?
          </label>
          <div className="relative w-[320px]">
            <div 
              className={`w-full h-[36px] bg-white border border-[#D1D1D1] text-navy font-sans text-xs px-4 rounded-[20px] outline-none flex items-center justify-between transition-colors ${
                rsvpLocked
                  ? "opacity-70 cursor-not-allowed bg-[#F7F4EF]"
                  : "cursor-pointer focus:border-[#7732A4]/50"
              }`}
              onClick={() => {
                if (rsvpLocked || !interactive) return;
                setAttendanceOpen(!attendanceOpen);
              }}
              aria-disabled={rsvpLocked}
            >
              <span>
                {attendance === "yes" 
                  ? "Yes, I will attend" 
                  : attendance === "no" 
                    ? "No, I cannot attend" 
                    : "Please Select"}
              </span>
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 292.4 292.4" fill="#1b3601" className={`transition-transform duration-200 ${attendanceOpen ? 'rotate-180' : ''}`}>
                <path d="M287 69.4a17.6 17.6 0 0 0-13-5.4H18.4c-5 0-9.3 1.8-12.9 5.4A17.6 17.6 0 0 0 0 82.2c0 5 1.8 9.3 5.4 12.9l128 127.9c3.6 3.6 7.8 5.4 12.8 5.4s9.2-1.8 12.8-5.4L287 95c3.5-3.5 5.4-7.8 5.4-12.8 0-5-1.9-9.2-5.5-12.8z"/>
              </svg>
            </div>

            {attendanceOpen && !rsvpLocked && (
              <div className="absolute top-[42px] left-0 w-full bg-white border border-[#D1D1D1] rounded-[16px] shadow-lg z-[100] overflow-hidden font-sans text-xs divide-y divide-[#F0F0F0]">
                <div 
                  className={`px-4 py-3 cursor-pointer hover:bg-[#FAF6F0] transition-colors ${attendance === "" ? "font-bold text-[#7732A4] bg-[#FAF6F0]" : "text-navy"}`}
                  onClick={() => { setAttendance(""); setAttendanceOpen(false); }}
                >
                  Please Select
                </div>
                <div 
                  className={`px-4 py-3 cursor-pointer hover:bg-[#FAF6F0] transition-colors ${attendance === "yes" ? "font-bold text-[#7732A4] bg-[#FAF6F0]" : "text-navy"}`}
                  onClick={() => { setAttendance("yes"); setAttendanceOpen(false); }}
                >
                  Yes, I will attend
                </div>
                <div 
                  className={`px-4 py-3 cursor-pointer hover:bg-[#FAF6F0] transition-colors ${attendance === "no" ? "font-bold text-[#7732A4] bg-[#FAF6F0]" : "text-navy"}`}
                  onClick={() => { setAttendance("no"); setAttendanceOpen(false); }}
                >
                  No, I cannot attend
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Number of Guests */}
        <div className="flex flex-col items-start">
          <label className="font-quattrocento-custom font-normal text-[15px] text-[#1B3601] tracking-normal uppercase mb-1.5 text-left w-full pl-2">
            Number of guests
          </label>
          <input 
            type="text" 
            placeholder="e.g. 2"
            value={guests}
            onChange={(e) => setGuests(e.target.value)}
            disabled={rsvpLocked || !interactive}
            className="w-[320px] h-[36px] bg-white border border-[#D1D1D1] text-navy font-sans text-xs px-4 rounded-[20px] outline-none focus:border-[#7732A4]/50 transition-colors disabled:opacity-70 disabled:cursor-not-allowed disabled:bg-[#F7F4EF]"
          />
        </div>

        {/* Your Wishes For Us */}
        <div className="flex flex-col items-start">
          <label className="font-quattrocento-custom font-normal text-[15px] text-[#1B3601] tracking-normal uppercase mb-1.5 text-left w-full pl-2">
            Your wishes for us
          </label>
          <textarea 
            placeholder="Write your wishes....."
            rows="3"
            value={wishes}
            onChange={(e) => setWishes(e.target.value)}
            disabled={rsvpLocked || !interactive}
            className="w-[320px] h-[126px] bg-white border border-[#D1D1D1] text-navy font-sans text-xs px-4 py-3 rounded-[20px] outline-none resize-none focus:border-[#7732A4]/50 transition-colors disabled:opacity-70 disabled:cursor-not-allowed disabled:bg-[#F7F4EF]"
          />
        </div>

        {/* Hidden submit trigger */}
        <button type="submit" className="hidden" id="rsvp-submit-hidden-btn" disabled={rsvpLocked} />
        {rsvpLocked ? (
          <p className="text-xs text-[#7732A4] text-center w-full font-medium">
            Your RSVP has been confirmed. Fields are locked.
          </p>
        ) : null}
        {rsvpError ? (
          <p className="text-xs text-red-600 text-center w-full">{rsvpError}</p>
        ) : null}
      </form>

      {/* Decorative Bottom Frame (Width: 390px, Height: 287px, Y: 2254px) */}
      <div className="absolute top-[2254px] left-0 w-[390px] h-[287px] z-0">
        <Image 
          src="/invitation/page3-bottom-frame.png" 
          alt="Page 3 bottom floral frame" 
          fill 
          className="object-contain"
        />
      </div>

      {/* RSVP Button (Width: 108px, Height: 48px, Y: 2379px, centered) */}
      <button 
        type="button"
        disabled={submitting || rsvpLocked || !interactive}
        onClick={() => document.getElementById("rsvp-submit-hidden-btn")?.click()}
        className="absolute top-[2379px] left-[141px] w-[108px] h-[48px] bg-[#7732A4] hover:bg-[#5C2383] disabled:opacity-60 disabled:cursor-not-allowed text-white font-serif font-bold text-xs uppercase tracking-wider rounded-[24px] z-10 transition-colors shadow-md flex items-center justify-center"
      >
        {rsvpLocked ? "Submitted" : submitting ? "Sending…" : "Send RSVP"}
      </button>

      {/* =========================================================
          PAGE 4 (Y: 2750 -> Y: 3459)
          ========================================================= */}

      {/* ALL THE DETAILS Text */}
      <div className="absolute top-[2609px] left-0 w-full h-[98px] flex items-center justify-center z-10">
        <h1 className="font-cormorant-custom font-semibold text-[38px] text-[#7732A4] tracking-wider uppercase text-center leading-none whitespace-nowrap">
          ALL THE DETAILS
        </h1>
      </div>

      {/* 4.1 Lotus Divider */}
      <div className="absolute top-[2690px] left-1/2 -translate-x-1/2 w-[175px] h-[34px] z-0">
        <Image src="/invitation/4.1.png" alt="Page 4 lotus divider" fill className="object-contain" />
      </div>

      {/* CIRCLE 1 & ICON 4.2 & TEXT */}
      <div className="absolute top-[2811px] left-[37px] w-[60px] h-[60px] rounded-full bg-[#473284] border-[2px] border-[#C6A15B] z-0"></div>
      <div className="absolute top-[2823px] left-[46px] w-[43px] h-[35px] z-10">
        <Image src="/invitation/4.2.png" alt="Table number icon" fill className="object-contain" />
      </div>
      <div className="absolute top-[2811px] left-[160px] h-[60px] flex flex-col justify-center z-10 w-[210px]">
        <h3 className="font-cormorant-custom font-bold text-[18px] text-[#B54AB6] tracking-widest uppercase leading-none mb-1.5">TABLE NUMBER</h3>
        <p className="font-quattrocento-custom font-bold text-[16px] text-[#1B3601] leading-none">{t.tableNumber}</p>
      </div>

      {/* CIRCLE 2 & ICON 4.3 & TEXT */}
      <div className="absolute top-[2913px] left-[37px] w-[60px] h-[60px] rounded-full bg-[#473284] border-[2px] border-[#C6A15B] z-0"></div>
      <div className="absolute top-[2923px] left-[46px] w-[42px] h-[42px] z-10">
        <Image src="/invitation/4.3.png" alt="Sun icon" fill className="object-contain" />
      </div>
      <div className="absolute top-[2913px] left-[160px] h-[60px] flex flex-col justify-center z-10 w-[210px]">
        <h3 className="font-cormorant-custom font-bold text-[18px] text-[#B54AB6] tracking-widest uppercase leading-none mb-1.5">WEATHER NOTE</h3>
        <p className="font-quattrocento-custom font-bold text-[16px] text-[#1B3601] leading-none">{t.weatherNote}</p>
      </div>

      {/* CIRCLE 3 & ICON 4.4 & TEXT */}
      <div className="absolute top-[3008px] left-[37px] w-[60px] h-[60px] rounded-full bg-[#473284] border-[2px] border-[#C6A15B] z-0"></div>
      <div className="absolute top-[3022px] left-[45px] w-[43px] h-[32px] z-10">
        <Image src="/invitation/4.4.png" alt="Car icon" fill className="object-contain" />
      </div>
      <div className="absolute top-[3008px] left-[160px] h-[60px] flex flex-col justify-center z-10 w-[200px]">
        <h3 className="font-cormorant-custom font-bold text-[18px] text-[#B54AB6] tracking-widest uppercase leading-none mb-1.5">PARKING</h3>
        <p className="font-quattrocento-custom font-bold text-[16px] text-[#1B3601] leading-snug">{t.parkingNote}</p>
      </div>

      {/* 4.6 Bottom Floral Frame */}
      <div className="absolute top-[3110px] left-[0px] w-[390px] h-[287px] z-0">
        <Image src="/invitation/4.6.png" alt="Page 4 bottom frame" fill className="object-contain" />
      </div>

      {/* CIRCLE 4 & ICON 4.5 & TEXT */}
      <div className="absolute top-[3110px] left-[37px] w-[60px] h-[60px] rounded-full bg-[#473284] border-[2px] border-[#C6A15B] z-10"></div>
      <div className="absolute top-[3125px] left-[50px] w-[34px] h-[31px] z-20">
        <Image src="/invitation/4.5.png" alt="Phone icon" fill className="object-contain" />
      </div>
      <div className="absolute top-[3110px] left-[160px] h-[60px] flex flex-col justify-center z-10 w-[210px]">
        <h3 className="font-cormorant-custom font-bold text-[18px] text-[#B54AB6] tracking-widest leading-none mb-1.5">Contact</h3>
        {t.contacts.slice(0, 2).map((contact) => (
          <p
            key={`${contact.name}-${contact.phone}`}
            className="font-quattrocento-custom font-bold text-[16px] text-[#1B3601] leading-tight mb-1"
          >
            {contact.name} - {contact.phone}
          </p>
        ))}
      </div>

      {/* =========================================================
          PAGE 5 (Y: 3450 -> Y: 4500)
          ========================================================= */}

      {/* OUR STORY Text */}
      <div className="absolute top-[3460px] left-0 w-full flex items-center justify-center z-10">
        <h1 className="font-cormorant-custom font-semibold text-[38px] text-[#7732A4] tracking-wider uppercase text-center leading-none whitespace-nowrap">
          OUR STORY
        </h1>
      </div>

      {/* 5.1 Lotus Divider */}
      <div className="absolute top-[3510px] left-1/2 -translate-x-1/2 w-[175px] h-[34px] z-0">
        <Image src="/invitation/5.1.png" alt="Our story lotus divider" fill className="object-contain" />
      </div>

      {/* Every love story... Text */}
      <div className="absolute top-[3570px] w-full flex flex-col items-center justify-center z-10">
        <p className="font-quattrocento-custom font-bold text-[18px] text-[#1B3601] text-center leading-relaxed">
          Every <span className="font-greatvibes-custom text-[30px] text-[#B54AB6] font-normal mx-1">love story</span><br/>
          is beautiful,<br/>
          but ours is<br/>
          my favourite.
        </p>
      </div>

      {/* 5.2 Small Lotus */}
      <div className="absolute top-[3690px] left-1/2 -translate-x-1/2 w-[138px] h-[92px] z-0">
        <Image src="/invitation/5.2.png" alt="Small lotus" fill className="object-contain" />
      </div>

      {/* 5.7 Background Floral */}
      <div className="absolute top-[3861px] left-[0px] w-[390px] h-[442px] z-0 pointer-events-none">
        <Image src="/invitation/5.7.png" alt="Page 5 floral background" fill className="object-contain" />
      </div>

      {/* Vertical Timeline Line */}
      <div className="absolute top-[3840px] left-[119px] w-[2px] h-[270px] bg-[#B54AB6] z-0"></div>

      {/* Timeline Items */}
      {/* 2019 */}
      <div className="absolute top-[3810px] left-[90px] w-[60px] h-[60px] rounded-full border border-[#B54AB6] bg-white z-10 flex items-center justify-center shadow-sm">
        <div className="relative w-[45px] h-[45px]">
          <Image src="/invitation/5.3.png" alt="2019" fill className="object-contain" />
        </div>
      </div>
      <div className="absolute top-[3810px] left-[200px] h-[60px] flex flex-col justify-center z-10">
        <h3 className="font-cormorant-custom font-bold text-[20px] text-[#B54AB6] leading-none mb-1">2019</h3>
        <p className="font-quattrocento-custom font-bold text-[16px] text-[#1B3601] leading-tight">The day<br/>we met</p>
      </div>

      {/* 2021 */}
      <div className="absolute top-[3900px] left-[90px] w-[60px] h-[60px] rounded-full border border-[#B54AB6] bg-white z-10 flex items-center justify-center shadow-sm">
        <div className="relative w-[45px] h-[45px]">
          <Image src="/invitation/5.4.png" alt="2021" fill className="object-contain" />
        </div>
      </div>
      <div className="absolute top-[3900px] left-[200px] h-[60px] flex flex-col justify-center z-10">
        <h3 className="font-cormorant-custom font-bold text-[20px] text-[#B54AB6] leading-none mb-1">2021</h3>
        <p className="font-quattrocento-custom font-bold text-[16px] text-[#1B3601] leading-tight">We fell<br/>in love</p>
      </div>

      {/* 2023 */}
      <div className="absolute top-[3990px] left-[90px] w-[60px] h-[60px] rounded-full border border-[#B54AB6] bg-white z-10 flex items-center justify-center shadow-sm">
        <div className="relative w-[45px] h-[45px]">
          <Image src="/invitation/5.5.png" alt="2023" fill className="object-contain" />
        </div>
      </div>
      <div className="absolute top-[3990px] left-[200px] h-[60px] flex flex-col justify-center z-10">
        <h3 className="font-cormorant-custom font-bold text-[20px] text-[#B54AB6] leading-none mb-1">2023</h3>
        <p className="font-quattrocento-custom font-bold text-[16px] text-[#1B3601] leading-tight">The proposal</p>
      </div>

      {/* 2026 */}
      <div className="absolute top-[4080px] left-[90px] w-[60px] h-[60px] rounded-full border border-[#B54AB6] bg-white z-10 flex items-center justify-center shadow-sm">
        <div className="relative w-[45px] h-[45px]">
          <Image src="/invitation/5.6.png" alt="2026" fill className="object-contain" />
        </div>
      </div>
      <div className="absolute top-[4080px] left-[200px] h-[60px] flex flex-col justify-center z-10">
        <h3 className="font-cormorant-custom font-bold text-[20px] text-[#B54AB6] leading-none mb-1">2026</h3>
        <p className="font-quattrocento-custom font-bold text-[16px] text-[#1B3601] leading-tight">Forever<br/>starts here</p>
      </div>

      {/* =========================================================
          PAGE 6 (Y: 4420 -> Y: 5300)
          ========================================================= */}

      {/* THE BIG DAY Text */}
      <div className="absolute top-[4390px] left-0 w-full flex items-center justify-center z-10">
        <h1 className="font-cormorant-custom font-semibold text-[38px] text-[#7732A4] tracking-wider uppercase text-center leading-none whitespace-nowrap">
          THE BIG DAY
        </h1>
      </div>

      {/* 6.1 Lotus Divider */}
      <div className="absolute top-[4466px] left-1/2 -translate-x-1/2 w-[175px] h-[34px] z-0">
        <Image src="/invitation/6.1.png" alt="The big day lotus divider" fill className="object-contain" />
      </div>

      {/* We can't wait... Text */}
      <div className="absolute top-[4520px] w-full flex flex-col items-center justify-center z-10">
        <p className="font-quattrocento-custom font-bold text-[18px] text-[#1B3601] text-center leading-relaxed">
          We can&apos;t wait to<br/>
          celebrate with you!
        </p>
      </div>

      {/* 6.2 Small Lotus */}
      <div className="absolute top-[4579px] left-1/2 -translate-x-1/2 w-[51px] h-[43px] z-0">
        <Image src="/invitation/6.2.png" alt="Small lotus decoration" fill className="object-contain" />
      </div>

      {/* 6.7 Background Floral */}
      <div className="absolute top-[4691px] left-[0px] w-[390px] h-[523px] z-0 pointer-events-none">
        <Image src="/invitation/6.7.png" alt="Page 6 floral background" fill className="object-contain object-bottom" />
      </div>

      {/* Event Block 1: Wednesday */}
      <div className="absolute top-[4648px] left-1/2 -translate-x-1/2 w-[206px] h-[129px] z-10 flex flex-col items-center pt-[24px]">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <Image src="/invitation/6.4.png" alt="Event frame" fill className="object-contain" />
        </div>
        <div className="relative z-10 w-[36px] h-[36px] bg-[#473284] rounded-full flex items-center justify-center mb-1">
          <div className="relative w-[18px] h-[18px]">
            <Image src="/invitation/6.3.png" alt="Calendar icon" fill className="object-contain" />
          </div>
        </div>
        <h3 className="relative z-10 font-cormorant-custom font-bold text-[15px] text-[#1B3601] tracking-widest uppercase leading-none mb-1.5 text-center">{t.weekday}</h3>
        <p className="relative z-10 font-quattrocento-custom font-bold text-[16px] text-[#1B3601] text-center leading-none">{t.longDate}</p>
      </div>

      {/* Event Block 2: Poruwa Ceremony */}
      <div className="absolute top-[4795px] left-1/2 -translate-x-1/2 w-[206px] h-[129px] z-10 flex flex-col items-center pt-[24px]">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <Image src="/invitation/6.4.png" alt="Event frame" fill className="object-contain" />
        </div>
        <div className="relative z-10 w-[36px] h-[36px] bg-[#473284] rounded-full flex items-center justify-center mb-1">
          <div className="relative w-[18px] h-[18px]">
            <Image src="/invitation/6.5.png" alt="Clock icon" fill className="object-contain" />
          </div>
        </div>
        <h3 className="relative z-10 font-cormorant-custom font-bold text-[14px] text-[#1B3601] tracking-widest uppercase leading-none mb-1.5 text-center px-2">PORUWA CEREMONY</h3>
        <p className="relative z-10 font-quattrocento-custom font-bold text-[16px] text-[#1B3601] text-center leading-none">{t.poruwaTime}</p>
      </div>

      {/* Event Block 3: Granbell Hotel */}
      <div className="absolute top-[4941px] left-1/2 -translate-x-1/2 w-[206px] h-[129px] z-10 flex flex-col items-center pt-[18px]">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <Image src="/invitation/6.4.png" alt="Event frame" fill className="object-contain" />
        </div>
        <div className="relative z-10 w-[36px] h-[36px] bg-[#473284] rounded-full flex items-center justify-center mb-1">
          <div className="relative w-[18px] h-[18px]">
            <Image src="/invitation/6.6.png" alt="Location icon" fill className="object-contain" />
          </div>
        </div>
        <h3 className="relative z-10 font-cormorant-custom font-bold text-[14px] text-[#1B3601] tracking-widest uppercase leading-none mb-1.5 text-center px-2">{t.hotelName}</h3>
        {t.googleMapsLink ? (
          <a
            href={t.googleMapsLink}
            target="_blank"
            rel="noreferrer"
            className="relative z-10 bg-[#473284] text-white font-quattrocento-custom text-[10px] font-bold py-2 px-8 rounded-full tracking-wider hover:bg-[#342461] transition-colors leading-none shadow-md"
          >
            VIEW MAP
          </a>
        ) : (
          <button
            type="button"
            className="relative z-10 bg-[#473284] text-white font-quattrocento-custom text-[10px] font-bold py-2 px-8 rounded-full tracking-wider leading-none shadow-md"
          >
            VIEW MAP
          </button>
        )}
      </div>

      {/* =========================================================
          PAGE 7 (Y: 5400 -> Y: 6200)
          ========================================================= */}

      {/* OUR JOURNEY Text */}
      <div className="absolute top-[5280px] left-0 w-full flex items-center justify-center z-10">
        <h1 className="font-cormorant-custom font-semibold text-[38px] text-[#7732A4] tracking-wider uppercase text-center leading-none whitespace-nowrap">
          OUR JOURNEY
        </h1>
      </div>

      {/* 7.1 Lotus Divider */}
      <div className="absolute top-[5350px] left-1/2 -translate-x-1/2 w-[175px] h-[34px] z-0">
        <Image src="/invitation/7.1.png" alt="Our journey lotus divider" fill className="object-contain" />
      </div>

      {/* Journey 1 — couple_images[0] */}
      <div className="absolute top-[5403px] left-[21px] w-[103px] h-[155px] z-10 overflow-hidden rounded-[12px] shadow-md">
        <Image src={journeyImages[0]} alt="Journey 1" fill className="object-cover" unoptimized={journeyImages[0].startsWith("http")} />
      </div>
      <div className="absolute top-[5440px] left-[155px] w-[198px] flex items-center justify-center z-10">
        <p className="font-greatvibes-custom text-[28px] text-[#B54AB6] text-center leading-snug">
          Two souls<br/>One promise.
        </p>
      </div>

      {/* Journey 2 — couple_images[1] */}
      <div className="absolute top-[5558px] right-[26px] w-[103px] h-[155px] z-10 overflow-hidden rounded-[12px] shadow-md">
        <Image src={journeyImages[1]} alt="Journey 2" fill className="object-cover" unoptimized={journeyImages[1].startsWith("http")} />
      </div>
      <div className="absolute top-[5593px] left-[40px] w-[198px] flex items-center justify-center z-10">
        <p className="font-greatvibes-custom text-[28px] text-[#B54AB6] text-center leading-snug">
          Little moments<br/>big memories.
        </p>
      </div>

      {/* Journey 3 — couple_images[2] */}
      <div className="absolute top-[5713px] left-[21px] w-[103px] h-[155px] z-10 overflow-hidden rounded-[12px] shadow-md">
        <Image src={journeyImages[2]} alt="Journey 3" fill className="object-cover" unoptimized={journeyImages[2].startsWith("http")} />
      </div>
      <div className="absolute top-[5733px] left-[155px] w-[198px] flex items-center justify-center z-10">
        <p className="font-greatvibes-custom text-[28px] text-[#B54AB6] text-center leading-snug">
          Different<br/>chapters,<br/>one love story.
        </p>
      </div>

      {/* Journey 4 — couple_images[3] */}
      <div className="absolute top-[5868px] right-[26px] w-[103px] h-[155px] z-10 overflow-hidden rounded-[12px] shadow-md">
        <Image src={journeyImages[3]} alt="Journey 4" fill className="object-cover" unoptimized={journeyImages[3].startsWith("http")} />
      </div>
      <div className="absolute top-[5926px] left-[40px] w-[198px] flex items-center justify-center z-10">
        <p className="font-greatvibes-custom text-[28px] text-[#B54AB6] text-center leading-snug">
          And the best<br/>is yet to come...
        </p>
      </div>

      {/* 7.6 Background Floral */}
      <div className="absolute top-[5886px] left-[0px] w-[390px] h-[287px] z-20 pointer-events-none">
        <Image src="/invitation/7.6.png" alt="Page 7 floral background" fill className="object-contain" />
      </div>

      {/* =========================================================
          PAGE 8 (Y: 6200 -> Y: 6920)
          ========================================================= */}

      {/* OUR HEARTS ARE FULL Text */}
      <div className="absolute top-[6220px] left-0 w-full flex items-center justify-center z-10">
        <h1 className="font-cormorant-custom font-semibold text-[38px] text-[#7732A4] tracking-wider uppercase text-center leading-[1.2]">
          OUR HEARTS ARE<br/>FULL
        </h1>
      </div>

      {/* 8.1 Lotus Divider */}
      <div className="absolute top-[6330px] left-1/2 -translate-x-1/2 w-[175px] h-[34px] z-0">
        <Image src="/invitation/8.1.png" alt="Our hearts lotus divider" fill className="object-contain" />
      </div>

      {/* Paragraph Text */}
      <div className="absolute top-[6390px] w-full flex flex-col items-center justify-center z-10 px-8">
        <p className="font-quattrocento-custom font-bold text-[17px] text-[#1B3601] text-center leading-[1.6]">
          As we step into this dream<br/>
          together, we carry your love<br/>
          with us.<br/>
          Thank you for witnessing two<br/>
          hearts become one.<br/>
          Forever & Always,
        </p>
      </div>

      {/* Kasun & Hiruni */}
      <div className="absolute top-[6565px] w-full flex items-center justify-center z-10">
        <p className="font-greatvibes-custom text-[34px] text-[#B54AB6] text-center">
          {t.coupleNames}
        </p>
      </div>

      {/* 8.2 Thank you! Text and Image */}
      <div className="absolute top-[6680px] w-full flex flex-col items-center justify-center z-10 gap-2">
        <p className="font-greatvibes-custom font-bold text-[30px] text-[#7732A4] text-center leading-none">
          Thank you!
        </p>
        <div className="relative w-[138px] h-[92px]">
          <Image src="/invitation/8.2.png" alt="Small lotus" fill className="object-contain" />
        </div>
      </div>

      {/* 8.3 Background Floral */}
      <div className="absolute top-[6760px] left-[0px] w-[390px] h-[260px] z-0 pointer-events-none origin-bottom scale-[1.15]">
        <Image src="/invitation/8.3.png" alt="Page 8 floral background" fill className="object-contain object-bottom" />
      </div>

    </div>
  );
}
