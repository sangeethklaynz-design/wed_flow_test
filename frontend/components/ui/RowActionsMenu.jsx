"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MoreVertical } from "lucide-react";
import clsx from "clsx";

function getUiScale() {
  if (typeof document === "undefined") return 1;
  const zoom = parseFloat(getComputedStyle(document.documentElement).zoom || "");
  if (Number.isFinite(zoom) && zoom > 0) return zoom;
  return 1;
}

/**
 * Row action menu rendered in a portal so it is not clipped by table overflow.
 * Same alignment as before: left of the trigger (mr-2), vertically centered.
 */
export default function RowActionsMenu({
  id,
  openId,
  setOpenId,
  label,
  items = [],
}) {
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const [coords, setCoords] = useState(null);
  const isOpen = openId === id;

  useLayoutEffect(() => {
    if (!isOpen || !triggerRef.current) {
      setCoords(null);
      return;
    }

    const updatePosition = () => {
      const trigger = triggerRef.current;
      const menu = menuRef.current;
      if (!trigger) return;

      const scale = getUiScale();
      const rect = trigger.getBoundingClientRect();
      const menuHeight = menu?.offsetHeight ?? 132;
      const menuWidth = menu?.offsetWidth ?? 224;
      const gap = 8; // matches mr-2

      // getBoundingClientRect is visual; fixed `left`/`top` under html zoom are pre-zoom CSS px
      let visualLeft = rect.left - menuWidth * scale - gap;
      let visualTop = rect.top + rect.height / 2 - (menuHeight * scale) / 2;

      const viewportPad = 8;
      if (visualLeft < viewportPad) visualLeft = viewportPad;
      if (visualTop < viewportPad) visualTop = viewportPad;
      const maxTop = window.innerHeight - menuHeight * scale - viewportPad;
      if (visualTop > maxTop) visualTop = maxTop;

      setCoords({
        left: visualLeft / scale,
        top: visualTop / scale,
      });
    };

    updatePosition();
    const raf = requestAnimationFrame(updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen, items.length]);

  useEffect(() => {
    if (!isOpen) return;

    const onDocDown = (event) => {
      if (
        triggerRef.current?.contains(event.target) ||
        menuRef.current?.contains(event.target)
      ) {
        return;
      }
      setOpenId(null);
    };

    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, [isOpen, setOpenId]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-expanded={isOpen}
        className="inline-flex w-10 h-10 items-center justify-center text-navy hover:bg-cream rounded-xl transition-colors"
        onClick={() => setOpenId(isOpen ? null : id)}
      >
        <MoreVertical className="w-5 h-5" strokeWidth={2.25} />
      </button>

      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{
              position: "fixed",
              top: coords?.top ?? -9999,
              left: coords?.left ?? -9999,
              visibility: coords ? "visible" : "hidden",
            }}
            className="z-[100] w-56 bg-white border border-border rounded-2xl p-2 card-shadow"
          >
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpenId(null);
                    item.onClick?.();
                  }}
                  className={clsx(
                    "w-full text-left px-3 py-2 rounded-xl text-sm transition-colors flex items-center gap-2.5",
                    item.destructive
                      ? "text-red-500 hover:bg-red-50"
                      : "text-navy hover:bg-cream"
                  )}
                >
                  {Icon ? (
                    <Icon className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                  ) : null}
                  {item.label}
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </>
  );
}
