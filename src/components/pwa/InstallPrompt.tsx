"use client";

import { useEffect, useState } from "react";

const SESSION_COUNT_KEY = "operatoros_pwa_sessions";
const DISMISSED_KEY = "operatoros_pwa_dismissed";
const SESSIONS_BEFORE_PROMPT = 3;

type DeferredPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/**
 * Soft install affordance — appears after 3 sessions on supported browsers.
 * iOS Safari fires no beforeinstallprompt; we still surface a hint with
 * Share → Add to Home Screen instructions there.
 *
 * Dismissal is sticky in localStorage. Authenticated routes only mount this
 * via the (app) layout, so the marketing site stays uncluttered.
 */
export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<DeferredPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Reading immutable browser capabilities at mount — equivalent to a
    // lazy initializer but unavailable for client-only state in an SSR
    // tree without hydration mismatches. The set-state-in-effect rule
    // doesn't cover this pattern cleanly.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsStandalone(
      window.matchMedia("(display-mode: standalone)").matches ||
        // iOS legacy flag
        (navigator as unknown as { standalone?: boolean }).standalone === true
    );
    setIsIOS(
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
        !(window as unknown as { MSStream?: unknown }).MSStream
    );

    // Bump session counter
    try {
      const dismissed = window.localStorage.getItem(DISMISSED_KEY);
      if (dismissed === "1") return;
      const prev = Number(
        window.localStorage.getItem(SESSION_COUNT_KEY) ?? "0"
      );
      const next = Number.isFinite(prev) ? prev + 1 : 1;
      window.localStorage.setItem(SESSION_COUNT_KEY, String(next));
      if (next >= SESSIONS_BEFORE_PROMPT) setShow(true);
    } catch {
      // localStorage may be blocked (Safari private mode); silently skip.
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as DeferredPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function dismiss() {
    setShow(false);
    try {
      window.localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // ignore
    }
  }

  async function install() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    if (choice.outcome === "accepted") dismiss();
  }

  if (isStandalone) return null;
  if (!show) return null;

  // iOS path: no programmatic install; show share-icon instruction
  if (isIOS) {
    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[min(92vw,520px)] z-50 border-2 border-[var(--color-ground)] bg-[var(--color-field)] shadow-lg">
        <div className="bg-[var(--color-ground)] text-[var(--color-field)] px-4 py-2 flex items-center justify-between">
          <span className="t-utility" style={{ color: "var(--color-field)" }}>
            Install OperatorOS
          </span>
          <button
            type="button"
            onClick={dismiss}
            className="t-utility"
            style={{ color: "var(--color-field)" }}
            aria-label="Dismiss install prompt"
          >
            ✕
          </button>
        </div>
        <div className="px-4 py-3 text-[14px]" style={{ fontFamily: "var(--font-index)" }}>
          Tap <span aria-hidden>⎋</span> Share → <strong>Add to Home Screen</strong>
          {" "}to install this app on your device.
        </div>
      </div>
    );
  }

  // Chromium / others: only show if beforeinstallprompt fired.
  if (!deferredPrompt) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[min(92vw,520px)] z-50 border-2 border-[var(--color-ground)] bg-[var(--color-field)] shadow-lg">
      <div className="bg-[var(--color-ground)] text-[var(--color-field)] px-4 py-2 flex items-center justify-between">
        <span className="t-utility" style={{ color: "var(--color-field)" }}>
          Install OperatorOS
        </span>
        <button
          type="button"
          onClick={dismiss}
          className="t-utility"
          style={{ color: "var(--color-field)" }}
          aria-label="Dismiss install prompt"
        >
          ✕
        </button>
      </div>
      <div
        className="px-4 py-3 text-[14px] flex items-center justify-between gap-3"
        style={{ fontFamily: "var(--font-index)" }}
      >
        <span>Install OperatorOS for offline access to your last view.</span>
        <button
          type="button"
          onClick={install}
          className="t-utility text-[var(--color-mark)] underline underline-offset-4 shrink-0"
        >
          Install →
        </button>
      </div>
    </div>
  );
}
