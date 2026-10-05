'use client';

import React, { useState } from 'react';
import {
  computeAgendaHeight,
  AGENDA_ITEM_H,
  AGENDA_ITEM_GAP,
} from '@/lib/corporateLayoutMetrics';
import { corporatePageGradientStyle } from '@/lib/corporatePageStyles';

const AGENDA_ITEMS = [
  { time: '09:00 AM', title: 'Registration & Welcome Tea', location: 'Ocean View Lobby' },
  { time: '09:30 AM', title: 'Opening Remarks', location: 'Grand Ballroom' },
  { time: '10:00 AM', title: 'Keynote Session', location: 'The Future of Business' },
  { time: '11:30 AM', title: 'Panel Discussion', location: 'Industry Trends' },
  { time: '01:00 PM', title: 'Networking Lunch', location: 'Sapphire Lawn' },
  { time: '02:30 PM', title: 'Breakout Sessions', location: 'Multiple Rooms' },
  { time: '04:00 PM', title: 'Closing Ceremony', location: 'Main Ballroom' },
  { time: '05:00 PM', title: 'Cocktail & Networking', location: 'Garden View' },
];

function escapePdfText(str) {
  return String(str || '').replace(/[\\()]/g, '\\$&');
}

/** Fallback client-side PDF generation if server API is unavailable or preview mode */
function generateClientAgendaPdf(fields, agendaItems) {
  const org = fields.orgName || 'NEXORA';
  const title = (fields.eventTitle || 'Annual Business Summit').replace(/[\r\n]+/g, ' ');
  const dateVenue = [fields.eventDateLabel, fields.eventVenueLabel].filter(Boolean).join(' | ');

  const textOps = [];
  textOps.push('BT');
  textOps.push('/F2 18 Tf');
  textOps.push('50 780 Td');
  textOps.push(`(${escapePdfText(org)}) Tj`);
  textOps.push('ET');

  textOps.push('BT');
  textOps.push('/F1 14 Tf');
  textOps.push('50 755 Td');
  textOps.push(`(${escapePdfText(title)}) Tj`);
  textOps.push('ET');

  if (dateVenue) {
    textOps.push('BT');
    textOps.push('/F1 10 Tf');
    textOps.push('50 735 Td');
    textOps.push(`(${escapePdfText(dateVenue)}) Tj`);
    textOps.push('ET');
  }

  textOps.push('BT');
  textOps.push('/F2 13 Tf');
  textOps.push('50 700 Td');
  textOps.push('(EVENT AGENDA) Tj');
  textOps.push('ET');

  let y = 670;
  agendaItems.forEach((item) => {
    if (!item.time && !item.title) return;
    textOps.push('BT');
    textOps.push('/F2 10 Tf');
    textOps.push(`50 ${y} Td`);
    textOps.push(`(${escapePdfText(item.time || '')}) Tj`);
    textOps.push('ET');

    textOps.push('BT');
    textOps.push('/F1 10 Tf');
    textOps.push(`140 ${y} Td`);
    textOps.push(`(${escapePdfText(item.title || '')}) Tj`);
    textOps.push('ET');

    if (item.location) {
      y -= 13;
      textOps.push('BT');
      textOps.push('/F1 8.5 Tf');
      textOps.push(`140 ${y} Td`);
      textOps.push(`(${escapePdfText(item.location)}) Tj`);
      textOps.push('ET');
    }
    y -= 22;
  });

  const streamContent = textOps.join('\n');
  const streamLength = streamContent.length;

  const pdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>
endobj
4 0 obj
<< /Length ${streamLength} >>
stream
${streamContent}
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
6 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>
endobj
xref
0 7
0000000000 65535 f 
0000000010 00000 n 
0000000059 00000 n 
0000000116 00000 n 
0000000244 00000 n 
0000000300 00000 n 
0000000371 00000 n 
trailer
<< /Size 7 /Root 1 0 R >>
startxref
444
%%EOF`;

  return new Blob([pdf], { type: 'application/pdf' });
}

function formatTime12(time24) {
  if (!time24) return '';
  const [hStr, mStr] = String(time24).slice(0, 5).split(':');
  let hours = Number(hStr);
  const minutes = mStr || '00';
  const period = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;
  return `${hours}:${minutes} ${period}`;
}

export const EventAgendaPage = ({
  fields = {},
  isRsvpConfirmed = false,
  guestToken = null,
  scheduleEvents = null,
}) => {
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');

  const agendaItems = React.useMemo(() => {
    if (Array.isArray(scheduleEvents) && scheduleEvents.length > 0) {
      return scheduleEvents.map((ev) => ({
        time: ev.startTime
          ? formatTime12(ev.startTime) + (ev.endTime ? ` - ${formatTime12(ev.endTime)}` : '')
          : ev.time || '',
        title: ev.title || '',
        location: ev.location || ev.specialNotes || '',
      }));
    }
    if (Array.isArray(fields.agendaItems) && fields.agendaItems.length > 0) {
      return fields.agendaItems;
    }
    return AGENDA_ITEMS;
  }, [scheduleEvents, fields.agendaItems]);
  const pageHeight = computeAgendaHeight(agendaItems, isRsvpConfirmed);
  const listH =
    agendaItems.length === 0
      ? 0
      : agendaItems.length * AGENDA_ITEM_H +
        Math.max(0, agendaItems.length - 1) * AGENDA_ITEM_GAP;

  const handleDownloadAgenda = async () => {
    setDownloading(true);
    setDownloadError('');
    try {
      let blob = null;
      if (guestToken) {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        const res = await fetch(
          `${apiUrl}/api/public/invite/${encodeURIComponent(guestToken)}/schedule/download`
        );
        if (res.ok) {
          blob = await res.blob();
        }
      }

      if (!blob) {
        blob = generateClientAgendaPdf(fields, agendaItems);
      }

      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = 'event-agenda.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      setDownloadError(err?.message || 'Failed to download agenda. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <section
      id="page-4"
      data-page="4"
      data-invite-page="agenda"
      className="relative w-[390px] flex-shrink-0 overflow-hidden snap-start snap-always bg-agenda-grad select-none"
      style={{ height: pageHeight, minHeight: pageHeight, ...corporatePageGradientStyle(fields) }}
    >
      <div
        className="relative z-[2] w-[390px] mx-auto select-none flex flex-col"
        style={{ minHeight: pageHeight }}
      >
        <div className="pt-[28px] px-[13px] w-full flex flex-col items-center justify-center text-center shrink-0">
          <h2 className="font-petrona font-bold text-[27px] leading-[1.15] text-[var(--corp-text-primary)] tracking-[-0.01em] m-0">
            Event Agenda
          </h2>
          <p className="font-instrument font-medium text-[11.5px] leading-[1.25] text-[var(--corp-text-primary)] mt-1 tracking-[0.02em]">
            A day of insights and connection.
          </p>
        </div>

        <div className="relative mt-5 ml-[54px] w-[323px] shrink-0" style={{ minHeight: listH }}>
          {agendaItems.length > 0 ? (
            <div
              className="absolute left-[8px] top-[9px] w-[2px] bg-[#5B61EA] z-[1]"
              style={{ height: Math.max(0, listH - 40) }}
              aria-hidden="true"
            />
          ) : null}

          <div className="relative z-[2] flex flex-col gap-[25px] w-full">
            {agendaItems.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-[44px] h-[52px] cursor-pointer group transition-transform duration-200 hover:translate-x-[3px]"
              >
                <div
                  className="w-[18px] h-[18px] rounded-full border-[2.5px] border-[#5B61EA] bg-white flex-shrink-0 shadow-[0_0_0_2px_rgba(255,255,255,0.95)] transition-all duration-250 group-hover:scale-120 group-hover:border-[#3539C2] group-hover:shadow-[0_0_0_4px_rgba(91,97,234,0.25)]"
                  aria-hidden="true"
                />
                <div className="flex flex-col justify-start w-[261px] flex-shrink-0">
                  <span className="font-instrument font-bold text-[13.5px] leading-[16px] text-[var(--corp-text-primary)] tracking-[0.01em]">
                    {item.time}
                  </span>
                  <h3 className="font-instrument font-semibold text-[12.5px] leading-[16px] text-[var(--corp-text-primary)] my-[2px] transition-colors duration-200 group-hover:text-[#1914A3]">
                    {item.title}
                  </h3>
                  <p className="font-instrument font-normal text-[11px] leading-[14px] text-[#7A8797] m-0">
                    {item.location}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Save the Agenda Button (Visible only after confirming RSVP) */}
        {isRsvpConfirmed ? (
          <div className="mt-5 w-full flex flex-col items-center justify-center z-[3] shrink-0 px-4">
            <button
              type="button"
              id="save-agenda-btn"
              onClick={handleDownloadAgenda}
              disabled={downloading}
              className="w-full max-w-[280px] h-[42px] px-5 bg-[var(--corp-text-primary)] hover:opacity-90 active:translate-y-[1px] transition-all duration-150 text-white rounded-lg font-jakarta font-bold text-[13.5px] flex items-center justify-center gap-2.5 cursor-pointer shadow-[0_4px_14px_rgba(8,4,128,0.25)] hover:shadow-[0_6px_18px_rgba(8,4,128,0.32)]"
            >
              {downloading ? (
                <>
                  <svg className="animate-spin w-4 h-4 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>Downloading Agenda…</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-[18px] h-[18px] flex-shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  <span>Save the Agenda</span>
                </>
              )}
            </button>
            {downloadError ? (
              <p className="text-red-500 font-instrument text-xs text-center mt-2">
                {downloadError}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-6 w-full flex items-center justify-center text-center z-[3] shrink-0 px-4">
          <p className="font-petrona font-semibold text-[15.5px] leading-[1.35] text-[var(--corp-text-primary)] m-0 tracking-[0.01em]">
            <span className="font-petrona text-[24px] leading-[0.8] text-[var(--corp-text-highlight)] font-bold inline-block align-[-2px]">“</span>{' '}
            A Greater Tomorrow<br />
            At A Brighter Together{' '}
            <span className="font-petrona text-[24px] leading-[0.8] text-[var(--corp-text-highlight)] font-bold inline-block align-[-2px]">”</span>
          </p>
        </div>

        <div className="mt-auto w-[390px] h-[162px] pointer-events-none z-[1] shrink-0" aria-hidden="true">
          <img
            src="/assets/events/corporate-events/templates/template-1/chrome/event-schedule/event-schedule_background.webp"
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

export default EventAgendaPage;
