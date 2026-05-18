"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type ToastTone = "ground" | "mark";

export type Toast = {
  id: string;
  tone: ToastTone;
  title: ReactNode;
  body?: ReactNode;
  /** Auto-dismiss after this many ms. 0 to keep open until dismissed. */
  duration?: number;
};

type ToastInput = Omit<Toast, "id">;

type ToastCtx = {
  toasts: Toast[];
  pushToast: (t: ToastInput) => string;
  dismissToast: (id: string) => void;
};

const Context = createContext<ToastCtx | null>(null);

let counter = 0;
function genId() {
  counter += 1;
  return `t-${counter}-${Date.now()}`;
}

/**
 * ToastProvider — mount once near the app root. Renders a fixed bottom-right
 * stack of doctrine-pure toasts (sharp corners, solid surfaces, no opacity).
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismissToast = useCallback((id: string) => {
    const t = timers.current.get(id);
    if (t) {
      clearTimeout(t);
      timers.current.delete(id);
    }
    setToasts((all) => all.filter((x) => x.id !== id));
  }, []);

  const pushToast = useCallback(
    (input: ToastInput) => {
      const id = genId();
      const toast: Toast = {
        ...input,
        id,
        duration: input.duration ?? 4500,
        tone: input.tone ?? "ground",
      };
      setToasts((all) => [...all, toast]);
      if (toast.duration && toast.duration > 0) {
        const handle = setTimeout(() => dismissToast(id), toast.duration);
        timers.current.set(id, handle);
      }
      return id;
    },
    [dismissToast],
  );

  // Clear any pending timers on unmount.
  useEffect(() => {
    const map = timers.current;
    return () => {
      for (const handle of map.values()) clearTimeout(handle);
      map.clear();
    };
  }, []);

  const ctx = useMemo<ToastCtx>(
    () => ({ toasts, pushToast, dismissToast }),
    [toasts, pushToast, dismissToast],
  );

  return (
    <Context.Provider value={ctx}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-[calc(100vw-32px)] sm:max-w-[380px] pointer-events-none"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.tone === "mark" ? "alert" : "status"}
            className={`pointer-events-auto border-2 ${
              t.tone === "mark"
                ? "border-[var(--color-mark)] bg-[var(--color-mark)] text-[var(--color-field)]"
                : "border-[var(--color-ground)] bg-[var(--color-ground)] text-[var(--color-field)]"
            }`}
          >
            <div className="px-4 py-3 flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <div className="t-utility" style={{ color: "var(--color-field)" }}>
                  {t.title}
                </div>
                {t.body ? (
                  <div
                    className="mt-1 text-[13px]"
                    style={{
                      fontFamily: "var(--font-index)",
                      color: "var(--color-field)",
                    }}
                  >
                    {t.body}
                  </div>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => dismissToast(t.id)}
                aria-label="Dismiss notification"
                className="t-utility shrink-0"
                style={{ color: "var(--color-field)" }}
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </Context.Provider>
  );
}

/**
 * useToast — hook returning helpers for showing toasts. If the provider
 * isn't mounted (server context, tests without provider), the helpers
 * become no-ops so callers don't blow up.
 */
export function useToast() {
  const ctx = useContext(Context);
  return {
    toast: (input: ToastInput) => ctx?.pushToast(input) ?? "",
    success: (title: ReactNode, body?: ReactNode) =>
      ctx?.pushToast({ tone: "ground", title, body }) ?? "",
    error: (title: ReactNode, body?: ReactNode) =>
      ctx?.pushToast({ tone: "mark", title, body, duration: 7000 }) ?? "",
    dismiss: (id: string) => ctx?.dismissToast(id),
  };
}
