"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Landmark } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { isPaymentsLive } from "@/lib/paymentsLive";

/**
 * Merchant payout Connect stub.
 * When PAYMENTS_LIVE is false, shows offline messaging only.
 * When true, loads /api/couple/payments and starts Stripe Connect onboarding.
 */
export default function PaymentsConnectPanel() {
  const paymentsLive = isPaymentsLive();
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [payments, setPayments] = useState(null);

  const load = useCallback(async () => {
    if (!paymentsLive) return;
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest("/api/couple/payments", { token });
      setPayments(data.payments || null);
    } catch (err) {
      setError(err?.message || "Failed to load payment status");
    } finally {
      setLoading(false);
    }
  }, [paymentsLive]);

  useEffect(() => {
    load();
  }, [load]);

  const startConnect = async () => {
    if (!paymentsLive) return;
    const token = getAccessToken();
    if (!token) return;
    setBusy(true);
    setError("");
    try {
      const data = await apiRequest("/api/couple/payments/connect", {
        method: "POST",
        token,
      });
      if (data?.onboardingUrl && typeof window !== "undefined") {
        window.location.href = data.onboardingUrl;
        return;
      }
      setPayments(data.payments || null);
      setError("Connect did not return an onboarding URL");
    } catch (err) {
      setError(err?.message || "Failed to start Connect");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border border-[#D1D5DB] rounded-2xl p-4 sm:p-5 w-full">
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#EEF2F6] flex items-center justify-center shrink-0 border border-[#E2E8F0]">
          <Landmark className="w-5 h-5 sm:w-6 sm:h-6 text-[#054380]" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-[#054380] text-sm sm:text-base leading-snug">
            Ticket payouts (Stripe Connect)
          </p>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5 leading-snug">
            Guests pay with Google Pay; funds route to your connected bank account.
            One platform Google Pay — you only connect payouts (no Google API keys).
          </p>

          {!paymentsLive ? (
            <div className="mt-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3 py-2.5 text-xs text-[#64748B]">
              <span className="font-semibold text-[#054380]">Coming soon / offline. </span>
              Marketplace payments are disabled (
              <code className="text-[11px]">PAYMENTS_LIVE=false</code>
              ). See{" "}
              <span className="font-medium text-[#054380]">
                guide files/marketplace-payments-google-pay.md
              </span>
              .
            </div>
          ) : (
            <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <p className="text-xs text-[#054380]">
                {loading
                  ? "Loading status…"
                  : payments?.chargesEnabled
                    ? "Payouts ready"
                    : payments?.connected
                      ? "Onboarding incomplete"
                      : "Not connected"}
              </p>
              <button
                type="button"
                onClick={startConnect}
                disabled={busy || loading}
                className="h-9 px-4 rounded-xl bg-[#054380] text-white text-xs font-semibold hover:bg-[#04366a] disabled:opacity-60"
              >
                {busy
                  ? "Opening…"
                  : payments?.connected
                    ? "Continue / update Connect"
                    : "Connect payouts"}
              </button>
            </div>
          )}

          {error ? (
            <div className="mt-2 flex items-start gap-1.5 text-xs text-red-600">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
