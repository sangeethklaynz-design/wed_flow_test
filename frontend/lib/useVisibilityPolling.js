import { useEffect } from "react";

/** Re-run `fn` on an interval while the document tab is visible. */
export function useVisibilityPolling(fn, intervalMs = 2500) {
  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const maybePoll = () => {
      if (document.visibilityState === "visible") fn();
    };

    const intervalId = window.setInterval(maybePoll, intervalMs);
    document.addEventListener("visibilitychange", maybePoll);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", maybePoll);
    };
  }, [fn, intervalMs]);
}
