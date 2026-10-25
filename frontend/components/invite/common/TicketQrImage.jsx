"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { formatTicketQrText } from "@/lib/ticketQr";

/**
 * Renders a generated QR image for one ticket (plain-text payload).
 */
export default function TicketQrImage({
  guestName,
  tierName,
  ticketCode,
  qrText,
  alt = "Ticket QR code",
  className = "w-full h-full object-contain block",
  size = 220,
}) {
  const [dataUrl, setDataUrl] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const text =
      qrText ||
      formatTicketQrText({ guestName, tierName, ticketCode });
    if (!ticketCode && !qrText) {
      setDataUrl("");
      setError("Missing ticket ID");
      return undefined;
    }

    (async () => {
      try {
        const url = await QRCode.toDataURL(text, {
          errorCorrectionLevel: "M",
          margin: 1,
          width: size,
          color: { dark: "#021235", light: "#FFFFFF" },
        });
        if (!cancelled) {
          setDataUrl(url);
          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || "Failed to generate QR");
          setDataUrl("");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [guestName, tierName, ticketCode, qrText, size]);

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center text-[10px] text-red-500 text-center px-2">
        {error}
      </div>
    );
  }

  if (!dataUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400">
        Generating…
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={dataUrl} alt={alt} className={className} width={size} height={size} />
  );
}
