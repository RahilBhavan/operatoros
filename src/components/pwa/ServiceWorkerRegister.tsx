"use client";

import { useEffect } from "react";

const SW_URL = "/sw.js";

/**
 * Registers /sw.js once on mount. Unregisters stale workers when the script is
 * missing (broken deploy) so cached bad responses cannot hijack navigation.
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;
    // Off by default — enable after domain + deploy are verified (stale SW can break navigation).
    if (process.env.NEXT_PUBLIC_ENABLE_PWA !== "true") return;

    async function setup() {
      const check = await fetch(SW_URL, { method: "HEAD", cache: "no-store" });
      const regs = await navigator.serviceWorker.getRegistrations();

      if (!check.ok) {
        await Promise.all(regs.map((r) => r.unregister()));
        return;
      }

      await navigator.serviceWorker.register(SW_URL, {
        scope: "/",
        updateViaCache: "none",
      });
    }

    void setup().catch((err) => {
      console.warn("[sw] setup failed:", err);
    });
  }, []);

  return null;
}
