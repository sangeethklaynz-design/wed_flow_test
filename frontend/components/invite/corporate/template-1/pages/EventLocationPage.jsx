'use client';

import React, { useState } from 'react';
import { corporatePageGradientStyle } from '@/lib/corporatePageStyles';

export const EventLocationPage = ({
  fields = {},
  locationName = null,
  locationAddress = null,
  googleMapsLink = null,
}) => {
  const [clicked, setClicked] = useState(false);
  // Prefer event registration data; template fields are legacy fallback only.
  const name =
    locationName ||
    fields.locationName ||
    'Event venue';
  const address =
    locationAddress ||
    fields.locationAddress ||
    '';
  const addressLines = String(address || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const handleMapsClick = () => {
    setClicked(true);
    setTimeout(() => setClicked(false), 200);
    if (googleMapsLink && typeof window !== 'undefined') {
      window.open(googleMapsLink, '_blank', 'noopener,noreferrer');
      return;
    }
    if (typeof window !== 'undefined' && (name || address)) {
      const q = encodeURIComponent([name, address].filter(Boolean).join(', '));
      window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <section
      id="page-5"
      data-page="5"
      data-invite-page="location"
      className="relative w-[390px] h-[844px] min-h-[844px] flex-shrink-0 overflow-hidden snap-start snap-always bg-location-grad select-none"
      style={corporatePageGradientStyle(fields)}
    >
      <div className="relative z-[2] w-[390px] h-[844px] mx-auto select-none">
        <div className="absolute top-[44px] left-[13px] w-[364px] h-[32px] flex items-center justify-center text-center">
          <h2 className="font-petrona font-bold text-[27px] leading-[1.18] text-[var(--corp-text-primary)] tracking-[-0.01em] m-0">
            Event Location
          </h2>
        </div>

        <div className="absolute top-[94px] left-[47px] w-[296px] h-[167px] flex items-center justify-center">
          <img
            src="/assets/events/corporate-events/templates/template-1/chrome/event-location/location icon.webp"
            alt=""
            className="w-full h-full object-contain block"
            width={296}
            height={167}
          />
        </div>

        <div className="absolute top-[284px] left-[46px] w-[298px] flex flex-col">
          <h3 className="font-instrument font-bold text-[19px] leading-[23px] text-[var(--corp-text-primary)] text-center m-0 mb-6 tracking-[-0.01em]">
            {name}
          </h3>

          <div className="flex flex-col gap-5 pl-5">
            {addressLines.length ? (
              <div className="flex items-start gap-3">
                <div className="w-[20px] h-[24px] flex-shrink-0 flex items-center justify-center mt-[1px]" aria-hidden="true">
                  <svg width="18" height="22" viewBox="0 0 18 22" fill="none">
                    <path d="M9 1C4.58172 1 1 4.58172 1 9C1 14.5 9 21 9 21C9 21 17 14.5 17 9C17 4.58172 13.4183 1 9 1Z" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="9" cy="9" r="3" stroke="#2563EB" strokeWidth="1.8" />
                  </svg>
                </div>
                <div>
                  <p className="font-instrument font-medium text-[14px] leading-[20px] text-[#4B5563] m-0">
                    {addressLines.map((line, i) => (
                      <React.Fragment key={i}>
                        {i > 0 ? <br /> : null}
                        {line}
                      </React.Fragment>
                    ))}
                  </p>
                </div>
              </div>
            ) : null}

            <div className="ml-8">
              <span className="font-instrument font-bold text-[12px] leading-[15px] tracking-[0.08em] text-[#6B7280] uppercase m-0 mb-1 block">
                GET DIRECTIONS
              </span>
              <p className="font-instrument font-medium text-[14px] leading-[20px] text-[#4B5563] m-0">
                Find the fastest route to<br />
                the event
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          id="open-google-maps-btn"
          onClick={handleMapsClick}
          aria-label="Open in Google Maps"
          className={`absolute top-[568px] left-[55px] w-[280px] h-[40px] rounded-xl bg-[var(--corp-text-primary)] flex items-center justify-center gap-4 text-white cursor-pointer shadow-[0_4px_12px_rgba(8,4,128,0.2)] transition-all duration-200 hover:opacity-90 hover:-translate-y-[1px] hover:shadow-[0_8px_20px_rgba(8,4,128,0.3)] active:translate-y-[1px] z-[3] ${
            clicked ? 'scale-[0.97]' : ''
          }`}
        >
          <svg className="w-[17px] h-[17px] flex-shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M22 2L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="font-instrument font-semibold text-[14px] leading-none text-white tracking-[0.01em]">
            Open in Google Maps
          </span>
        </button>

        <div className="absolute bottom-0 left-0 w-[390px] h-[162px] pointer-events-none z-[1]" aria-hidden="true">
          <img
            src="/assets/events/corporate-events/templates/template-1/chrome/event-location/location page_bottom_background.webp"
            alt=""
            className="w-full h-full object-cover block"
            width={390}
            height={162}
          />
        </div>
      </div>
    </section>
  );
};

export default EventLocationPage;
