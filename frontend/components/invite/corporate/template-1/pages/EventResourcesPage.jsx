'use client';

import React, { useState } from 'react';
import { computeResourcesHeight } from '@/lib/corporateLayoutMetrics';
import { getApiBaseUrl } from '@/lib/api';
import { corporatePageGradientStyle } from '@/lib/corporatePageStyles';

const RESOURCES = [
  {
    name: 'Event Agenda.pdf',
    desc: 'Detailed schedule of the event sessions, timings and activities',
    size: '1.2 MB',
  },
  {
    name: 'Venue & Directions.pdf',
    desc: 'Venue details, map, parking informations.',
    size: '1.1 MB',
  },
  {
    name: 'Speaker Profiles.pdf',
    desc: 'Learn more about our keynote speakers and panelists.',
    size: '1.8 MB',
  },
  {
    name: 'Event Information.pdf',
    desc: 'Important guidelines, venue policies & useful informations.',
    size: '900 KB',
  },
];

const CARD_BG = [
  'rgba(210, 228, 247, 0.15)',
  'rgba(210, 228, 247, 0.22)',
  'rgba(210, 228, 247, 0.28)',
  'rgba(210, 228, 247, 0.18)',
];

function resolveDocUrl(res) {
  if (res?.url) {
    if (/^https?:\/\//i.test(res.url)) return res.url;
    return `${getApiBaseUrl()}${res.url.startsWith('/') ? res.url : `/${res.url}`}`;
  }
  return null;
}

export const EventResourcesPage = ({ fields = {}, documentFiles = [] }) => {
  const [toastMessage, setToastMessage] = useState(null);
  const resources =
    Array.isArray(fields.resourcesList) && fields.resourcesList.length
      ? fields.resourcesList
      : RESOURCES;
  const pageHeight = computeResourcesHeight(resources);

  const handleDownload = (res) => {
    const url = resolveDocUrl(res);
    if (url && typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
    // Resolve from uploaded pack by filename
    const match = (documentFiles || []).find(
      (f) => f.filename === res.filename || f.filename === res.name
    );
    if (match?.url) {
      const full = /^https?:\/\//i.test(match.url)
        ? match.url
        : `${getApiBaseUrl()}${match.url.startsWith('/') ? match.url : `/${match.url}`}`;
      window.open(full, '_blank', 'noopener,noreferrer');
      return;
    }
    setToastMessage(`Downloading ${res.name || 'file'}...`);
    setTimeout(() => setToastMessage(null), 2400);
  };

  return (
    <section
      id="page-6"
      data-page="6"
      data-invite-page="resources"
      className="relative w-[390px] flex-shrink-0 overflow-hidden snap-start snap-always bg-resources-grad select-none"
      style={{ height: pageHeight, minHeight: pageHeight, ...corporatePageGradientStyle(fields) }}
    >
      <div
        className="relative z-[2] w-[390px] mx-auto select-none flex flex-col"
        style={{ minHeight: pageHeight }}
        data-dynamic-field="resourcesList"
      >
        <div className="pt-[39px] px-[13px] w-full flex items-center justify-center text-center shrink-0">
          <h2 className="font-petrona font-bold text-[27px] leading-[1.18] text-[var(--corp-text-primary)] tracking-[-0.01em] m-0">
            Event Resources
          </h2>
        </div>

        <div className="mt-2 px-[53.5px] w-full flex items-center justify-center text-center shrink-0">
          <p className="font-inter font-normal text-[14px] leading-[17px] tracking-[0.08em] text-[var(--corp-text-primary)] m-0">
            Everything you need for this event,<br />
            in one place.
          </p>
        </div>

        <div className="mt-8 mx-[24px] w-[345px] flex flex-col shrink-0">
          <h3 className="font-petrona font-bold text-[19px] leading-[20px] text-[var(--corp-text-primary)] m-0 mb-1 tracking-[-0.01em]">
            Important Documents
          </h3>
          <p className="font-inter font-normal text-[9px] leading-[12px] tracking-[0.08em] text-[var(--corp-text-primary)] m-0 w-[345px]">
            Download the resources below to get event details, schedules and other important information.
          </p>
        </div>

        <div className="mt-5 mx-[22.5px] w-[345px] flex flex-col gap-[21px] z-[2] shrink-0">
          {resources.map((res, idx) => (
            <div
              key={`${res.filename || res.name || 'doc'}-${idx}`}
              style={{ backgroundColor: CARD_BG[idx % CARD_BG.length] }}
              className="flex items-center p-[10px_14px] w-[345px] h-[92px] rounded-[10px] border border-[#0174EF] shadow-[0_2px_8px_rgba(1,116,239,0.06)] transition-all duration-200 hover:-translate-y-[2px] hover:border-[#0056B3] hover:shadow-[0_6px_16px_rgba(1,116,239,0.18)]"
            >
              <div className="w-[32px] h-[38px] flex-shrink-0 flex items-center justify-center mr-3">
                <img
                  src="/assets/events/corporate-events/templates/template-1/chrome/resources/pdf-icon.webp"
                  alt=""
                  className="w-full h-full object-contain block"
                  width={32}
                  height={38}
                />
              </div>

              <div className="flex flex-col justify-center flex-1 min-w-0 pr-2">
                <h4 className="font-instrument font-bold text-[13.5px] leading-[17px] text-[var(--corp-text-primary)] m-0 mb-[2px] truncate">
                  {res.name}
                </h4>
                <p className="font-instrument font-normal text-[10.5px] leading-[13.5px] text-[#4B5563] m-0 mb-[3px] line-clamp-2">
                  {res.desc}
                </p>
                <span className="font-instrument font-bold text-[11.5px] leading-[14px] text-[var(--corp-text-primary)]">
                  {res.size || '—'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleDownload(res)}
                aria-label={`Download ${res.name}`}
                className="bg-[var(--corp-text-primary)] text-white rounded-xl py-2 px-[14px] flex items-center gap-[7px] cursor-pointer flex-shrink-0 shadow-[0_3px_8px_rgba(8,4,128,0.22)] transition-all duration-150 hover:opacity-90 hover:-translate-y-[1px] hover:shadow-[0_5px_12px_rgba(8,4,128,0.35)] active:scale-95"
              >
                <svg className="w-[13px] h-[13px] flex-shrink-0" viewBox="0 0 24 24" fill="none">
                  <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M7 10L12 15L17 10" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 15V3" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="font-instrument font-semibold text-[12px] leading-none text-white">
                  Download
                </span>
              </button>
            </div>
          ))}
        </div>

        <div className="mt-auto w-[390px] h-[162px] pointer-events-none z-[1] shrink-0" aria-hidden="true">
          <img
            src="/assets/events/corporate-events/templates/template-1/chrome/resources/location page_bottom_background.webp"
            alt=""
            className="w-[390px] h-[162px] object-cover block"
            width={390}
            height={162}
          />
        </div>

        {toastMessage ? (
          <div
            className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[var(--corp-text-primary)] text-white font-instrument text-[12.5px] font-semibold py-[10px] px-5 rounded-[20px] shadow-[0_8px_24px_rgba(8,4,128,0.35)] pointer-events-none z-10 whitespace-nowrap transition-all duration-200"
            aria-live="polite"
          >
            {toastMessage}
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default EventResourcesPage;
