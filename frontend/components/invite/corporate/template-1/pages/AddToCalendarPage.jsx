'use client';

import React, { useState } from 'react';
import { corporatePageGradientStyle } from '@/lib/corporatePageStyles';

export const AddToCalendarPage = ({ onCloseClick, fields = {} }) => {
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const downloadIcs = () => {
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Nexora//Annual Business Summit 2026//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      'UID:nexora-summit-2026@nexora.com',
      'DTSTAMP:20260923T180000Z',
      'DTSTART:20261112T033000Z',
      'DTEND:20261112T113000Z',
      'SUMMARY:Nexora Annual Business Summit 2026',
      'DESCRIPTION:Nexora Annual Business Summit 2026 - Ideas Today, A Smart Tomorrow. Keynotes, panel discussions, and executive networking.',
      'LOCATION:Shangri-La Hotel, 1 Galle Face, Colombo 02, Sri Lanka',
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Nexora-Summit-2026.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleGoogleCalendar = () => {
    showToast('Opening Google Calendar...');
    const googleUrl =
      'https://calendar.google.com/calendar/render?action=TEMPLATE' +
      '&text=' +
      encodeURIComponent('Nexora Annual Business Summit 2026') +
      '&dates=20261112T033000Z/20261112T113000Z' +
      '&details=' +
      encodeURIComponent(
        'Nexora Annual Business Summit 2026 - Ideas Today, A Smart Tomorrow. Keynotes, panel discussions, and networking.'
      ) +
      '&location=' +
      encodeURIComponent('Shangri-La Hotel Colombo, 1 Galle Face, Colombo 02, Sri Lanka');
    window.open(googleUrl, '_blank', 'noopener,noreferrer');
  };

  const handleAppleCalendar = () => {
    showToast('Downloading Apple Calendar invite (.ics)...');
    downloadIcs();
  };

  const handleOutlook = () => {
    showToast('Opening Outlook Calendar...');
    const eventName = fields?.eventTitle || 'Nexora Annual Business Summit 2026';
    const eventDescription =
      'Nexora Annual Business Summit 2026 - Ideas Today, A Smart Tomorrow. Keynotes, panel discussions, and networking.';
    const eventLocation =
      fields?.eventVenueLabel ||
      'Shangri-La Hotel Colombo, 1 Galle Face, Colombo 02, Sri Lanka';
    const isoStart = '2026-11-12T03:30:00Z';
    const isoEnd = '2026-11-12T11:30:00Z';

    const outlookUrl = `https://outlook.live.com/calendar/0/deeplink/compose?path=%2Fcalendar%2Faction%2Fcompose&rru=addevent&subject=${encodeURIComponent(
      eventName
    )}&startdt=${encodeURIComponent(isoStart)}&enddt=${encodeURIComponent(
      isoEnd
    )}&body=${encodeURIComponent(
      eventDescription
    )}&location=${encodeURIComponent(eventLocation)}`;
    window.open(outlookUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <section
      id="page-7"
      data-page="7"
      data-invite-page="addToCalendar"
      className="relative w-[390px] h-[844px] min-h-[844px] flex-shrink-0 overflow-hidden snap-start snap-always bg-calendar-grad select-none"
      style={corporatePageGradientStyle(fields)}
    >
      <div className="relative z-[2] w-[390px] h-[844px] mx-auto select-none">
        {/* Header "Save the Date" (W: 235, H: 53, X: 77.5, Y: 37) */}
        <div className="absolute top-[37px] left-[77.5px] w-[235px] h-[53px] flex items-center justify-center text-center z-[5]">
          <h2 className="font-jakarta font-bold text-[30px] leading-[1.2] text-[var(--corp-text-primary)] tracking-[-0.02em] m-0">
            Save the Date
          </h2>
        </div>

        {/* Calendar Illustration (Reduced compact size) */}
        <div className="absolute top-[104px] left-[143px] w-[104px] h-[92px] flex items-center justify-center z-[5]" aria-hidden="true">
          <div className="relative w-[104px] h-[92px] bg-white border-[4.5px] border-[#0174EF] rounded-[18px] shadow-[0_4px_14px_rgba(1,116,239,0.12)]">
            {/* Top Binder Rings */}
            <div className="absolute -top-[10px] left-[22px] w-[7px] h-[16px] bg-[#0174EF] rounded-[4px]" />
            <div className="absolute -top-[10px] right-[22px] w-[7px] h-[16px] bg-[#0174EF] rounded-[4px]" />

            {/* Header bar divider line */}
            <div className="absolute top-[19px] left-0 w-full h-[4px] bg-[#0174EF]" />

            {/* Body area with centered tick image */}
            <div className="absolute top-[23px] left-0 w-full h-[65px] flex items-center justify-center">
              <img
                src="/assets/events/corporate-events/templates/template-1/chrome/save-to-calendar/tick-icon.webp"
                alt="Checkmark"
                className="w-[44px] h-[28px] object-contain block"
                width={44}
                height={28}
              />
            </div>
          </div>
        </div>

        {/* Subtitle Text (W: 295, H: 44, X: 47.5, Y: 247) */}
        <div className="absolute top-[247px] left-[47.5px] w-[295px] h-[44px] flex items-center justify-center text-center z-[5]">
          <p className="font-inter font-normal text-[16px] leading-[22px] text-[#374151] m-0">
            Add to the event to your<br />
            calendar so you don’t miss it!
          </p>
        </div>

        {/* 4 Action Buttons */}
        <div className="absolute top-[339px] left-[41px] w-[308px] flex flex-col gap-[14px] z-[6]">
          {/* 1. Google Calendar */}
          <button
            type="button"
            onClick={handleGoogleCalendar}
            aria-label="Add to Google Calendar"
            className="w-[308px] h-[58px] min-h-[58px] bg-white/76 backdrop-blur-md border-[1.2px] border-[#BED7F5]/85 rounded-xl flex items-center px-5 gap-[14px] cursor-pointer shadow-[0_3px_10px_rgba(0,40,100,0.05)] transition-all duration-150 hover:bg-white/95 hover:border-[#0174EF] hover:shadow-[0_6px_18px_rgba(1,116,239,0.15)] hover:-translate-y-[1px] active:scale-98"
          >
            <div className="w-[63px] h-[58px] flex items-center justify-center flex-shrink-0">
              <img
                src="/assets/events/corporate-events/templates/template-1/chrome/save-to-calendar/google-calendar-logo.webp"
                alt="Google Calendar"
                className="w-[63px] h-[58px] object-contain block"
                width={63}
                height={61}
              />
            </div>
            <span className="font-inter font-semibold text-[17px] leading-6 text-[#0174EF] tracking-[-0.01em]">
              Google Calendar
            </span>
          </button>

          {/* 2. Apple Calendar */}
          <button
            type="button"
            onClick={handleAppleCalendar}
            aria-label="Add to Apple Calendar"
            className="w-[308px] h-[58px] min-h-[58px] bg-white/76 backdrop-blur-md border-[1.2px] border-[#BED7F5]/85 rounded-xl flex items-center px-5 gap-[14px] cursor-pointer shadow-[0_3px_10px_rgba(0,40,100,0.05)] transition-all duration-150 hover:bg-white/95 hover:border-[#0174EF] hover:shadow-[0_6px_18px_rgba(1,116,239,0.15)] hover:-translate-y-[1px] active:scale-98"
          >
            <div className="w-[63px] h-[58px] flex items-center justify-center flex-shrink-0">
              <img
                src="/assets/events/corporate-events/templates/template-1/chrome/save-to-calendar/apple-logo.webp"
                alt="Apple Calendar"
                className="w-[48px] h-[44px] object-contain block"
                width={48}
                height={44}
              />
            </div>
            <span className="font-inter font-semibold text-[17px] leading-6 text-[#0174EF] tracking-[-0.01em]">
              Apple Calendar
            </span>
          </button>

          {/* 3. Outlook */}
          <button
            type="button"
            onClick={handleOutlook}
            aria-label="Add to Outlook Calendar"
            className="w-[308px] h-[58px] min-h-[58px] bg-white/76 backdrop-blur-md border-[1.2px] border-[#BED7F5]/85 rounded-xl flex items-center px-5 gap-[14px] cursor-pointer shadow-[0_3px_10px_rgba(0,40,100,0.05)] transition-all duration-150 hover:bg-white/95 hover:border-[#0174EF] hover:shadow-[0_6px_18px_rgba(1,116,239,0.15)] hover:-translate-y-[1px] active:scale-98"
          >
            <div className="w-[63px] h-[58px] flex items-center justify-center flex-shrink-0">
              <img
                src="/assets/events/corporate-events/templates/template-1/chrome/save-to-calendar/outlook-logo.webp"
                alt="Outlook"
                className="w-[59px] h-[48px] object-contain block"
                width={59}
                height={48}
              />
            </div>
            <span className="font-inter font-semibold text-[17px] leading-6 text-[#0174EF] tracking-[-0.01em]">
              Outlook
            </span>
          </button>

          {/* 4. Close Button */}
          <button
            type="button"
            onClick={onCloseClick}
            aria-label="Close"
            className="w-[308px] h-[58px] min-h-[58px] bg-white/76 backdrop-blur-md border-[1.2px] border-[#BED7F5]/85 rounded-xl flex items-center justify-center cursor-pointer shadow-[0_3px_10px_rgba(0,40,100,0.05)] transition-all duration-150 hover:bg-white/95 hover:border-[#0174EF] hover:shadow-[0_6px_18px_rgba(1,116,239,0.15)] hover:-translate-y-[1px] active:scale-98 -mt-1"
          >
            <span className="font-inter font-bold text-[17px] leading-6 text-[#0174EF]">
              Close
            </span>
          </button>
        </div>

        {/* Bottom Image (W: 390, H: 260, top: 454px) */}
        <div className="absolute top-[454px] left-0 w-[390px] h-[260px] z-[1] pointer-events-none overflow-hidden" aria-hidden="true">
          <img
            src="/assets/events/corporate-events/templates/template-1/chrome/save-to-calendar/bottom-image.webp"
            alt=""
            className="w-[390px] h-[260px] object-cover block"
            width={390}
            height={260}
          />
        </div>

        {/* Bottom Slogan */}
        <div className="absolute top-[715px] left-[19px] w-[335px] h-[90px] z-[5] text-left pointer-events-none flex items-center">
          <p className="font-petrona font-extrabold text-[25px] leading-[30px] text-white m-0 tracking-[-0.01em] drop-shadow-[0_2px_8px_rgba(0,10,40,0.6)]">
            TOGETHER<br />
            TOWARDS<br />
            A SMARTER TOMORROW
          </p>
        </div>

        {/* Calendar Toast Notification */}
        {toastMessage && (
          <div
            className="absolute bottom-[120px] left-1/2 -translate-x-1/2 bg-[var(--corp-text-primary)] text-white font-instrument text-[12.5px] font-semibold py-[10px] px-5 rounded-[20px] shadow-[0_8px_24px_rgba(8,4,128,0.35)] pointer-events-none z-10 whitespace-nowrap transition-all duration-200"
            aria-live="polite"
          >
            {toastMessage}
          </div>
        )}
      </div>
    </section>
  );
};

export default AddToCalendarPage;
