'use client';

import React from 'react';
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

export const EventAgendaPage = ({ fields = {} }) => {
  const agendaItems =
    Array.isArray(fields.agendaItems) && fields.agendaItems.length
      ? fields.agendaItems
      : AGENDA_ITEMS;
  const pageHeight = computeAgendaHeight(agendaItems);
  const listH =
    agendaItems.length === 0
      ? 0
      : agendaItems.length * AGENDA_ITEM_H +
        Math.max(0, agendaItems.length - 1) * AGENDA_ITEM_GAP;

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
