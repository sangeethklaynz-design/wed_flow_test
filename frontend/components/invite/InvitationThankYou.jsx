"use client";

import { useState } from "react";
import Image from "next/image";
import { getAccessToken } from "@/lib/auth";

export default function InvitationThankYou({ guestToken, onContinue }) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  const handleDownload = async () => {
    setDownloading(true);
    setError("");
    try {
      let url = "";
      let headers = {};

      if (guestToken) {
        url = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/public/invite/${encodeURIComponent(guestToken)}/schedule/download`;
      } else {
        const token = getAccessToken();
        if (!token) throw new Error("Unable to authenticate.");
        url = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/couple/schedule/download`;
        headers = { Authorization: `Bearer ${token}` };
      }

      const res = await fetch(url, { headers });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to download schedule");
      }

      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = "wedding-schedule.pdf";
      a.click();
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      setError(err.message || "Failed to download schedule");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="relative w-[390px] h-[841px] mx-auto bg-[#FAF6F0] overflow-hidden select-none">
      <div className="absolute top-[0px] left-[0px] w-[79px] h-[294px] z-10 pointer-events-none">
        <Image src="/invitation/9.1.png" alt="" fill className="object-contain" />
      </div>
      <div className="absolute top-[-1px] left-[312px] w-[79px] h-[294px] z-10 pointer-events-none">
        <Image src="/invitation/9.2.png" alt="" fill className="object-contain" />
      </div>

      <div className="absolute top-[120px] w-full flex flex-col items-center justify-center z-10">
        <h2 className="font-serif text-[28px] text-[#7732A4] uppercase font-semibold leading-[1.2] text-center tracking-wide">
          Thank you for<br />
          <span className="text-[#B54AB6]">your RSVP</span>
        </h2>
      </div>

      <div className="absolute top-[203px] left-[107px] w-[175px] h-[34px] z-10 pointer-events-none">
        <Image src="/invitation/9.3.png" alt="Divider" fill className="object-contain" />
      </div>

      <div className="absolute top-[280px] left-[30px] w-[330px] z-10">
        <p className="font-quattrocento-custom font-bold text-[17px] text-[#1B3601] text-center leading-[1.4] tracking-wide">
          Thank you for confirming your presence on our special day.<br />
          Your love and blessings mean the world to us as we begin this new chapter together.
        </p>
      </div>

      <div className="absolute top-[440px] left-[99px] w-[191px] h-[48px] z-10 pointer-events-none">
        <Image src="/invitation/9.4.png" alt="Divider" fill className="object-contain" />
      </div>

      <div className="absolute top-[540px] w-full flex items-center justify-center z-10">
        <p className="font-greatvibes-custom text-[28px] text-[#7732A4] text-center">
          Keep the day's events close at hand
        </p>
      </div>

      <div className="absolute top-[590px] w-full flex flex-col items-center justify-center z-20 gap-3">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="bg-[#4C2D88] hover:bg-[#623bab] disabled:opacity-70 transition-colors text-white font-sans text-[15px] font-medium w-[220px] h-[48px] rounded-[24px] flex items-center justify-center cursor-pointer shadow-md active:scale-95"
        >
          {downloading ? "Downloading..." : "Save the Schedule"}
        </button>
        {error && (
          <p className="text-red-500 text-xs text-center w-full">{error}</p>
        )}
        {onContinue && (
          <button
            type="button"
            onClick={onContinue}
            className="text-[#7732A4] font-quattrocento-custom font-bold text-[13px] underline underline-offset-2 mt-2"
          >
            View Full Invitation
          </button>
        )}
      </div>

      <div className="absolute top-[581px] left-[1px] w-[390px] h-[260px] z-0 pointer-events-none">
        <Image src="/invitation/9.5.png" alt="" fill className="object-contain object-bottom" />
      </div>
    </div>
  );
}
