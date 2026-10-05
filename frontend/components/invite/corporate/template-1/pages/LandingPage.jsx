'use client';

import React from 'react';
import { resolveMediaUrl } from '@/lib/api';
import { corporateThemeVars } from '@/lib/corporatePageStyles';

const DEFAULTS = {
  orgName: 'NEXORA',
  orgTagline: 'BUSINESS BEYOND BORDERS',
  eventTitle: 'Annual Business\nSummit 2026',
  eventSubtitle: 'Ideas Today, A Smart Tomorrow.',
  eventDateLabel: 'Thursday, 12 November 2026',
  eventTimeLabel: '9.00 AM - 5.00PM',
  eventVenueLabel: 'Shangri-La, Colombo',
};

const DEFAULT_BG =
  "/assets/events/corporate-events/templates/template-1/chrome/landing/landing page background.webp";

export const LandingPage = ({
  onExploreClick,
  fields = {},
  backgroundUrl = null,
}) => {
  const orgName = fields.orgName || DEFAULTS.orgName;
  const orgTagline = fields.orgTagline || DEFAULTS.orgTagline;
  const eventTitle = fields.eventTitle || DEFAULTS.eventTitle;
  const eventSubtitle = fields.eventSubtitle || DEFAULTS.eventSubtitle;
  const eventDateLabel = fields.eventDateLabel || DEFAULTS.eventDateLabel;
  const eventTimeLabel = fields.eventTimeLabel || DEFAULTS.eventTimeLabel;
  const eventVenueLabel = fields.eventVenueLabel || DEFAULTS.eventVenueLabel;
  const titleLines = String(eventTitle).split('\n');
  const bgSrc = resolveMediaUrl(backgroundUrl) || DEFAULT_BG;

  return (
    <section
      id="page-1"
      data-page="1"
      data-invite-page="landing"
      className="relative w-[390px] h-[844px] min-h-[844px] flex-shrink-0 overflow-hidden snap-start snap-always bg-[#031430] select-none"
      style={corporateThemeVars(fields)}
    >
      <div
        className="absolute inset-0 bg-cover bg-top bg-no-repeat z-[1]"
        style={{ backgroundImage: `url('${bgSrc}')` }}
        aria-hidden="true"
      />

      <div className="relative z-[2] w-full h-full">
        <div className="absolute top-[33px] left-[88px] w-[214px] h-[102.45px] flex flex-col items-center justify-start text-center">
          <div className="w-[44px] h-[44px] flex items-center justify-center mb-[5px]">
            <img
              src="/assets/events/corporate-events/templates/template-1/chrome/landing/organization logo.webp"
              alt={`${orgName} logo`}
              className="w-[42px] h-[42px] object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.25)]"
              width={54}
              height={50}
            />
          </div>
          <h2 className="font-inter font-semibold text-[21px] leading-[1.25] text-white tracking-[0.35em] ml-[0.35em] uppercase">
            {orgName}
          </h2>
          <p className="font-inter font-medium text-[8px] leading-[1.2] text-[#E1EEFF]/90 tracking-[0.32em] ml-[0.32em] uppercase mt-1">
            {orgTagline}
          </p>
        </div>

        <div className="absolute top-[168px] left-0 w-full px-8 flex items-center justify-center gap-3">
          <span className="flex-1 h-[1px] bg-white/60" aria-hidden="true" />
          <span className="font-inter font-normal text-[14px] leading-[17px] text-white tracking-[0.16em] ml-[0.16em] uppercase whitespace-nowrap">
            YOU ARE INVITED
          </span>
          <span className="flex-1 h-[1px] bg-white/60" aria-hidden="true" />
        </div>

        <h1 className="absolute top-[217px] left-[27px] w-[337px] h-[82px] font-petrona font-bold text-[36px] leading-[1.14] text-white text-center tracking-[-0.01em] drop-shadow-[0_2px_12px_rgba(0,20,60,0.4)]">
          {titleLines.map((line, i) => (
            <React.Fragment key={i}>
              {i > 0 ? <br /> : null}
              {line}
            </React.Fragment>
          ))}
        </h1>

        <p className="absolute top-[302px] left-[30px] w-[330px] h-[25px] font-instrument font-normal text-[13px] leading-[25px] text-[#F0F6FF]/95 text-center tracking-[0.05em] drop-shadow-[0_1px_6px_rgba(0,15,45,0.4)]">
          {eventSubtitle}
        </p>

        <div className="absolute top-[398px] left-[72px] w-[263px] h-[120px] flex flex-col justify-between">
          <div className="flex items-center h-[35px] group">
            <div
              className="w-[35px] h-[35px] rounded-full flex items-center justify-center text-white flex-shrink-0 shadow-[0_3px_8px_rgba(0,30,80,0.25)] bg-[#0051AF] transition-transform duration-200 group-hover:scale-105"
              aria-hidden="true"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <span className="font-instrument font-normal text-[12px] leading-[11px] text-white ml-[17px] w-[211px] h-[11px] flex items-center whitespace-nowrap tracking-[0.02em] drop-shadow-[0_1px_4px_rgba(0,15,45,0.35)]">
              {eventDateLabel}
            </span>
          </div>

          <div className="flex items-center h-[35px] group">
            <div
              className="w-[35px] h-[35px] rounded-full flex items-center justify-center text-white flex-shrink-0 shadow-[0_3px_8px_rgba(0,30,80,0.25)] bg-[#156FD7] transition-transform duration-200 group-hover:scale-105"
              aria-hidden="true"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <span className="font-instrument font-normal text-[12px] leading-[11px] text-white ml-[17px] w-[211px] h-[11px] flex items-center whitespace-nowrap tracking-[0.02em] drop-shadow-[0_1px_4px_rgba(0,15,45,0.35)]">
              {eventTimeLabel}
            </span>
          </div>

          <div className="flex items-center h-[35px] group">
            <div
              className="w-[35px] h-[35px] rounded-full flex items-center justify-center text-white flex-shrink-0 shadow-[0_3px_8px_rgba(0,30,80,0.25)] bg-[#1E80DF] transition-transform duration-200 group-hover:scale-105"
              aria-hidden="true"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <span className="font-instrument font-normal text-[12px] leading-[11px] text-white ml-[17px] w-[211px] h-[11px] flex items-center whitespace-nowrap tracking-[0.02em] drop-shadow-[0_1px_4px_rgba(0,15,45,0.35)]">
              {eventVenueLabel}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onExploreClick}
          className="absolute bottom-[48px] left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 cursor-pointer group"
        >
          <span className="w-[117px] h-[11px] font-instrument font-normal text-[8px] leading-[11px] text-white tracking-[0.22em] text-center uppercase">
            Explore Invitation
          </span>
          <svg
            className="animate-chevron-float text-white/90 group-hover:text-white"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>
    </section>
  );
};

export default LandingPage;
