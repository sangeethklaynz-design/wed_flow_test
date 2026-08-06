"use client";

import { useEffect, useId, useRef, useState } from "react";
import clsx from "clsx";
import { ChevronDown, ChevronUp, Clock } from "lucide-react";

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);
const PERIODS = ["AM", "PM"];

function parseTime24(value) {
  if (!value || !/^\d{2}:\d{2}$/.test(value)) {
    return { hour12: 12, minute: 0, period: "AM", empty: true };
  }
  const [h, m] = value.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  let hour12 = h % 12;
  if (hour12 === 0) hour12 = 12;
  return { hour12, minute: m, period, empty: false };
}

function toTime24(hour12, minute, period) {
  let h = hour12 % 12;
  if (period === "PM") h += 12;
  if (period === "AM" && hour12 === 12) h = 0;
  if (period === "PM" && hour12 === 12) h = 12;
  return `${String(h).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function formatDisplay(value) {
  const { hour12, minute, period, empty } = parseTime24(value);
  if (empty) return "";
  return `${hour12}:${String(minute).padStart(2, "0")} ${period}`;
}

function wrap(value, min, max) {
  if (value < min) return max;
  if (value > max) return min;
  return value;
}

function TimeColumn({
  items,
  selected,
  onSelect,
  formatItem,
  onStep,
  showSelection = true,
}) {
  const listRef = useRef(null);
  const selectedRef = useRef(null);

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: "center" });
  }, [selected]);

  return (
    <div className="flex flex-col items-center flex-1 min-w-0">
      <button
        type="button"
        aria-label="Increase"
        onClick={() => onStep(1)}
        className="w-full flex items-center justify-center py-1 text-muted hover:text-navy hover:bg-cream rounded-lg transition-colors"
      >
        <ChevronUp className="w-4 h-4" strokeWidth={2.25} />
      </button>

      <div
        ref={listRef}
        className="h-[132px] w-full overflow-y-auto overscroll-contain [scrollbar-width:thin] [scrollbar-color:#e69e46_transparent]"
      >
        {items.map((item) => {
          const isSelected = showSelection && item === selected;
          return (
            <button
              key={item}
              ref={isSelected ? selectedRef : null}
              type="button"
              onClick={() => onSelect(item)}
              className={clsx(
                "w-full px-2 py-1.5 text-sm tabular-nums rounded-lg transition-colors",
                isSelected
                  ? "bg-gold text-navy font-semibold"
                  : "text-navy hover:bg-cream"
              )}
            >
              {formatItem(item)}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        aria-label="Decrease"
        onClick={() => onStep(-1)}
        className="w-full flex items-center justify-center py-1 text-muted hover:text-navy hover:bg-cream rounded-lg transition-colors"
      >
        <ChevronDown className="w-4 h-4" strokeWidth={2.25} />
      </button>
    </div>
  );
}

export default function TimePicker({
  value = "",
  onChange,
  onBlur,
  id: idProp,
  placeholder = "-- : -- --",
  hasError = false,
  "aria-label": ariaLabel,
}) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);

  const parsed = parseTime24(value);
  const display = formatDisplay(value);
  const hasValue = !parsed.empty;

  const emitChange = (hour12, minute, period) => {
    onChange?.(toTime24(hour12, minute, period));
  };

  const close = () => {
    setOpen(false);
    onBlur?.();
  };

  useEffect(() => {
    if (!open) return;

    const onDocDown = (e) => {
      if (!rootRef.current?.contains(e.target)) close();
    };

    const onKeyDown = (e) => {
      if (e.key === "Escape") close();
    };

    document.addEventListener("mousedown", onDocDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const stepHour = (delta) => {
    const idx = HOURS.indexOf(parsed.hour12);
    const next = HOURS[wrap(idx + delta, 0, HOURS.length - 1)];
    emitChange(next, parsed.minute, parsed.period);
  };

  const stepMinute = (delta) => {
    const next = wrap(parsed.minute + delta, 0, 59);
    emitChange(parsed.hour12, next, parsed.period);
  };

  const stepPeriod = (delta) => {
    const idx = PERIODS.indexOf(parsed.period);
    const next = PERIODS[wrap(idx + delta, 0, PERIODS.length - 1)];
    emitChange(parsed.hour12, parsed.minute, next);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        id={id}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className={clsx(
          "w-full px-4 py-3 rounded-xl border bg-white text-left text-navy transition-shadow flex items-center justify-between gap-2",
          hasError ? "border-red-400" : "border-border",
          open
            ? "ring-2 ring-[#e69e46]/50"
            : "focus:outline-none focus:ring-2 focus:ring-[#e69e46]/50"
        )}
      >
        <span className={clsx("tabular-nums", !display && "text-gray-300")}>
          {display || placeholder}
        </span>
        <Clock className="w-4 h-4 shrink-0 text-muted" strokeWidth={2} />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={ariaLabel}
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-[70] bg-white border border-border rounded-2xl p-3 card-shadow"
        >
          <div className="flex divide-x divide-border">
            <TimeColumn
              items={HOURS}
              selected={parsed.hour12}
              showSelection={hasValue}
              onSelect={(hour12) =>
                emitChange(hour12, parsed.minute, parsed.period)
              }
              formatItem={(h) => String(h).padStart(2, "0")}
              onStep={stepHour}
            />
            <TimeColumn
              items={MINUTES}
              selected={parsed.minute}
              showSelection={hasValue}
              onSelect={(minute) =>
                emitChange(parsed.hour12, minute, parsed.period)
              }
              formatItem={(m) => String(m).padStart(2, "0")}
              onStep={stepMinute}
            />
            <TimeColumn
              items={PERIODS}
              selected={parsed.period}
              showSelection={hasValue}
              onSelect={(period) =>
                emitChange(parsed.hour12, parsed.minute, period)
              }
              formatItem={(p) => p}
              onStep={stepPeriod}
            />
          </div>
        </div>
      )}
    </div>
  );
}
