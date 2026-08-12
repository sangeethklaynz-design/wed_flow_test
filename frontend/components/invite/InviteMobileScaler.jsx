"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { INVITE_FRAME_H, INVITE_FRAME_W } from "./InvitationVideoIntro";

const MOBILE_MAX = 767;

function useInviteNoUiScale() {
  useEffect(() => {
    document.documentElement.classList.add("invite-no-ui-scale");
    return () => document.documentElement.classList.remove("invite-no-ui-scale");
  }, []);
}

function useInviteMobileScale(mode = "width") {
  const [layout, setLayout] = useState({
    scale: 1,
    isMobile: false,
    viewportHeight: INVITE_FRAME_H,
  });

  const update = useCallback(() => {
    const isMobile = window.matchMedia(`(max-width: ${MOBILE_MAX}px)`).matches;
    if (!isMobile) {
      setLayout({ scale: 1, isMobile: false, viewportHeight: INVITE_FRAME_H });
      return;
    }

    const scaleX = window.innerWidth / INVITE_FRAME_W;
    const scaleY = window.innerHeight / INVITE_FRAME_H;
    const scale = mode === "cover" ? Math.max(scaleX, scaleY) : scaleX;

    setLayout({
      scale,
      isMobile: true,
      viewportHeight: window.innerHeight,
    });
  }, [mode]);

  useEffect(() => {
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [update]);

  return layout;
}

/**
 * Scales the fixed 390px invitation design to fill mobile webviews.
 * - width: scale to viewport width (scrollable invitation pages)
 * - cover: scale to cover viewport (intro video)
 */
export default function InviteMobileScaler({
  children,
  mode = "width",
  fixedHeight,
  className = "",
}) {
  useInviteNoUiScale();
  const { scale, isMobile, viewportHeight } = useInviteMobileScale(mode);
  const contentRef = useRef(null);
  const [measuredHeight, setMeasuredHeight] = useState(fixedHeight ?? 0);

  useEffect(() => {
    if (!isMobile || fixedHeight != null) return;
    const el = contentRef.current;
    if (!el) return;

    const measure = () => setMeasuredHeight(el.offsetHeight);
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [fixedHeight, isMobile, children]);

  if (!isMobile) {
    return <div className={className}>{children}</div>;
  }

  const contentHeight = fixedHeight ?? measuredHeight;
  const scaledHeight = contentHeight > 0 ? contentHeight * scale : undefined;
  const wrapperHeight =
    mode === "cover" && scaledHeight
      ? Math.max(scaledHeight, viewportHeight)
      : scaledHeight;

  return (
    <div
      className={`w-full overflow-x-hidden ${mode === "cover" ? "overflow-y-hidden" : ""} ${className}`}
      style={{
        height: wrapperHeight,
        minHeight: mode === "cover" ? "100dvh" : undefined,
      }}
    >
      <div
        ref={contentRef}
        style={{
          width: INVITE_FRAME_W,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        {children}
      </div>
    </div>
  );
}
