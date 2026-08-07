"use client";

import { useEffect, useRef, useState } from "react";
import { resolveMediaUrl } from "@/lib/api";

/** Match invitation cover frame */
export const INVITE_FRAME_W = 390;
export const INVITE_FRAME_H = 844;

function paintCoverFrame(video, canvas) {
  const dpr = Math.min(
    typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1,
    2
  );
  canvas.width = Math.round(INVITE_FRAME_W * dpr);
  canvas.height = Math.round(INVITE_FRAME_H * dpr);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = "#FAF6F0";
  ctx.fillRect(0, 0, INVITE_FRAME_W, INVITE_FRAME_H);

  const vw = video.videoWidth || INVITE_FRAME_W;
  const vh = video.videoHeight || INVITE_FRAME_H;
  // Same math as CSS object-cover / object-center
  const scale = Math.max(INVITE_FRAME_W / vw, INVITE_FRAME_H / vh);
  const dw = vw * scale;
  const dh = vh * scale;
  const dx = (INVITE_FRAME_W - dw) / 2;
  const dy = (INVITE_FRAME_H - dh) / 2;
  ctx.drawImage(video, dx, dy, dw, dh);

  try {
    return canvas.toDataURL("image/jpeg", 0.95);
  } catch {
    return null;
  }
}

/**
 * Intro video locked to invitation cover size (390×844).
 * On end: capture last frame and hand it to the parent as the permanent cover
 * (pixel-identical cut — no fade onto a different HTML cover).
 */
export default function InvitationVideoIntro({
  videoUrl,
  onComplete,
  autoPlay = true,
}) {
  const resolvedUrl = resolveMediaUrl(videoUrl);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const completedRef = useRef(false);

  const finish = (coverDataUrl) => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete?.(coverDataUrl || null);
  };

  const captureAndHandoff = () => {
    if (completedRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) {
      finish(null);
      return;
    }

    const paint = () => {
      if (completedRef.current) return;
      try {
        video.pause();
      } catch {
        // ignore
      }
      const dataUrl = paintCoverFrame(video, canvas);
      finish(dataUrl);
    };

    try {
      if (Number.isFinite(video.duration) && video.duration > 0) {
        video.currentTime = Math.max(0, video.duration - 0.05);
      }
    } catch {
      // ignore
    }

    if (video.readyState >= 2) {
      requestAnimationFrame(paint);
    } else {
      const onSeeked = () => {
        video.removeEventListener("seeked", onSeeked);
        paint();
      };
      video.addEventListener("seeked", onSeeked);
      window.setTimeout(paint, 100);
    }
  };

  useEffect(() => {
    if (!resolvedUrl) {
      finish(null);
      return;
    }
    if (!autoPlay) return;

    let cancelled = false;
    const el = videoRef.current;
    if (!el) return;

    (async () => {
      try {
        el.muted = false;
        await el.play();
      } catch {
        try {
          if (cancelled) return;
          el.muted = true;
          await el.play();
        } catch {
          if (cancelled) return;
          try {
            await el.play();
          } catch {
            if (!cancelled) captureAndHandoff();
          }
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedUrl, autoPlay]);

  if (!resolvedUrl) return null;

  return (
    <div
      className="absolute top-0 left-0 z-30 w-[390px] h-[844px] bg-[#FAF6F0] overflow-hidden pointer-events-none"
      aria-hidden
    >
      <video
        ref={videoRef}
        src={resolvedUrl}
        className="absolute inset-0 w-full h-full object-cover object-center bg-[#FAF6F0] select-none"
        playsInline
        autoPlay
        preload="auto"
        controls={false}
        disablePictureInPicture
        controlsList="nodownload nofullscreen noremoteplayback"
        onContextMenu={(e) => e.preventDefault()}
        onEnded={captureAndHandoff}
      />
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
