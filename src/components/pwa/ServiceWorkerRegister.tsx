"use client";

import { useEffect } from "react";

/**
 * Registers /sw.js once on mount. Idempotent — re-registers cheaply on the
 * client. No-op in browsers without ServiceWorker. WS-3.5 scaffolding.
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    // Only register in production. In dev, HMR can fight an active SW and
    // surface confusing cached responses.
    if (process.env.NODE_ENV !== "production") return;

    const onLoad = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .catch((err) => {
          console.warn("[sw] registration failed:", err);
        });
    };

    if (document.readyState === "complete") {
      onLoad();
    } else {
      window.addEventListener("load", onLoad);
      return () => window.removeEventListener("load", onLoad);
    }
  }, []);

  return null;
}
