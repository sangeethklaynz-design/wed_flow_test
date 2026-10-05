'use client';

import React from 'react';
import { corporatePageGradientStyle } from '@/lib/corporatePageStyles';

export const EventDetailsPage = ({ fields = {} }) => {
  const detailsIntro =
    'Join us for an inspiring day of innovation, networking, and knowledge sharing with industry leaders and professionals.';
  const eventDateLabel = fields.eventDateLabel || 'Thursday, 12 November 2026';
  const eventTimeLabel = fields.eventTimeLabel || '9.00 AM - 5.00PM';
  const eventVenueLabel = fields.eventVenueLabel || 'Shangri-La, Colombo';
  const dressCode = fields.dressCode || 'Smart Casual /professional Attire';

  return (
    <section
      id="page-2"
      data-page="2"
      data-invite-page="eventDetails"
      className="relative w-[390px] h-[844px] min-h-[844px] flex-shrink-0 overflow-hidden snap-start snap-always bg-event-details-grad select-none"
      style={corporatePageGradientStyle(fields)}
    >
      {/* Top Image (Screenshot 3: W: 390, H: 245, top: 0, left: 0) */}
      <div className="absolute top-0 left-0 w-[390px] h-[245px] overflow-hidden z-[1]">
        <img
          src="/assets/events/corporate-events/templates/template-1/chrome/event-details/top image.webp"
          alt="Summit Auditorium Conference"
          className="w-full h-full object-cover object-top"
          width={390}
          height={245}
        />
      </div>

      {/* Content Area */}
      <div className="relative z-[3] w-full h-full select-none">
        {/* Title: "Abount the Event" (Screenshot 3: W: 310, H: 32, X: 41, Y: 248) */}
        <h2 className="absolute top-[248px] left-[41px] w-[310px] h-[32px] font-petrona font-bold text-[28px] leading-[32px] tracking-[-0.01em] text-left">
          <span className="text-[#061A40]">Abount the</span>{' '}
          <span className="text-[#007CE6]">Event</span>
        </h2>

        {/* Description (Screenshot 4: W: 264, H: 43, X: 41, Y: 288) */}
        <p className="absolute top-[288px] left-[41px] w-[264px] h-[43px] font-instrument font-normal text-[11.5px] leading-[1.35] text-[#2D3748] tracking-[0.01em] text-left">
          {detailsIntro}
        </p>

        {/* Event Details List (Date, Time, Venue, Dress Code) */}
        <div className="absolute top-[358px] left-[41px] w-[300px] flex flex-col gap-4">
          {/* Date */}
          <div className="flex items-center gap-[15px] group">
            <div
              className="w-[38px] h-[38px] rounded-full bg-[#D9EDFE] flex items-center justify-center text-[#0B2545] flex-shrink-0 shadow-[0_2px_6px_rgba(0,35,75,0.08)] transition-transform duration-200 group-hover:scale-105"
              aria-hidden="true"
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div className="flex flex-col justify-center gap-[2px]">
              <span className="font-instrument font-bold text-[13.5px] leading-[1.15] text-[#061A40]">Date</span>
              <span className="font-instrument font-medium text-[12px] leading-[1.25] text-[#0A2540]">{eventDateLabel}</span>
            </div>
          </div>

          {/* Time */}
          <div className="flex items-center gap-[15px] group">
            <div
              className="w-[38px] h-[38px] rounded-full bg-[#D9EDFE] flex items-center justify-center text-[#0B2545] flex-shrink-0 shadow-[0_2px_6px_rgba(0,35,75,0.08)] transition-transform duration-200 group-hover:scale-105"
              aria-hidden="true"
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div className="flex flex-col justify-center gap-[2px]">
              <span className="font-instrument font-bold text-[13.5px] leading-[1.15] text-[#061A40]">Time</span>
              <span className="font-instrument font-medium text-[12px] leading-[1.25] text-[#0A2540]">{eventTimeLabel}</span>
            </div>
          </div>

          {/* Venue */}
          <div className="flex items-center gap-[15px] group">
            <div
              className="w-[38px] h-[38px] rounded-full bg-[#F7FBFF] flex items-center justify-center text-[#0B2545] flex-shrink-0 shadow-[0_2px_8px_rgba(0,35,75,0.1)] transition-transform duration-200 group-hover:scale-105"
              aria-hidden="true"
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <div className="flex flex-col justify-center gap-[2px]">
              <span className="font-instrument font-bold text-[13.5px] leading-[1.15] text-[#061A40]">Venue</span>
              <span className="font-instrument font-medium text-[12px] leading-[1.25] text-[#0A2540]">{eventVenueLabel}</span>
            </div>
          </div>

          {/* Dress Code */}
          <div className="flex items-center gap-[15px] group">
            <div
              className="w-[38px] h-[38px] rounded-full bg-[#F0F8FF] flex items-center justify-center text-[#0B2545] flex-shrink-0 shadow-[0_2px_8px_rgba(0,35,75,0.1)] transition-transform duration-200 group-hover:scale-105"
              aria-hidden="true"
            >
              <img
                src="/assets/events/corporate-events/templates/template-1/chrome/event-details/dress_code_icon.webp"
                alt=""
                className="w-[20px] h-[20px] object-contain"
                width={20}
                height={20}
              />
            </div>
            <div className="flex flex-col justify-center gap-[2px]">
              <span className="font-instrument font-bold text-[13.5px] leading-[1.15] text-[#061A40]">Dress Code</span>
              <span className="font-instrument font-medium text-[12px] leading-[1.25] text-[#0A2540]">{dressCode}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Image (Screenshot 5: W: 390, H: 310, bottom: 0, left: 0) */}
      <div className="absolute bottom-0 left-0 w-[390px] h-[310px] pointer-events-none z-[1]" aria-hidden="true">
        <img
          src="/assets/events/corporate-events/templates/template-1/chrome/event-details/bottom-image.webp"
          alt=""
          className="w-full h-full object-cover object-bottom"
          width={390}
        />
      </div>
    </section>
  );
};

export default EventDetailsPage;
