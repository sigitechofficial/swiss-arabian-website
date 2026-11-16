"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

type ToastTone = "success" | "error" | "info" | "warning";

type ToastState = {
  open: boolean;
  message: string;
  tone: ToastTone;
};

type ToastApi = {
  toast: (message: string, tone?: ToastTone) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

const toastListeners = new Set<(message: string, tone: ToastTone) => void>();

export function toast(message: string, tone: ToastTone = "info") {
  toastListeners.forEach((listener) => listener(message, tone));
}

/* A brand shell can show toasts in its own design: while one is mounted, the default Toaster draws nothing. */
let brandHosts = 0;
const hostListeners = new Set<() => void>();
function subscribeHosts(listener: () => void) {
  hostListeners.add(listener);
  return () => {
    hostListeners.delete(listener);
  };
}
const brandHostClaimed = () => brandHosts > 0;
const noBrandHost = () => false;

const TOAST_MS = 4000;

export type ToastFeed = ToastState & { dismiss: () => void };

/**
 * For a brand's own toast host: the current toast (same `toast()` calls as the
 * default Toaster, which stays hidden while this hook is mounted).
 */
export function useToastFeed(): ToastFeed {
  const [state, setState] = useState<ToastState>({ open: false, message: "", tone: "info" });
  useEffect(() => {
    const show = (message: string, tone: ToastTone) => setState({ open: true, message, tone });
    toastListeners.add(show);
    brandHosts += 1;
    hostListeners.forEach((l) => l());
    return () => {
      toastListeners.delete(show);
      brandHosts -= 1;
      hostListeners.forEach((l) => l());
    };
  }, []);
  useEffect(() => {
    if (!state.open) return;
    const id = window.setTimeout(() => setState((prev) => ({ ...prev, open: false })), TOAST_MS);
    return () => window.clearTimeout(id);
  }, [state.open, state.message, state.tone]);
  const dismiss = useCallback(() => setState((prev) => ({ ...prev, open: false })), []);
  return { ...state, dismiss };
}

export function Toaster() {
  const claimed = useSyncExternalStore(subscribeHosts, brandHostClaimed, noBrandHost);
  const [state, setState] = useState<ToastState>({
    open: false,
    message: "",
    tone: "info",
  });

  const show = useCallback((message: string, tone: ToastTone = "info") => {
    setState({ open: true, message, tone });
  }, []);

  useEffect(() => {
    toastListeners.add(show);
    return () => {
      toastListeners.delete(show);
    };
  }, [show]);

  const api = useMemo(() => ({ toast: show }), [show]);

  useEffect(() => {
    if (!state.open) return;
    const id = window.setTimeout(() => setState((prev) => ({ ...prev, open: false })), 4000);
    return () => window.clearTimeout(id);
  }, [state.open, state.message, state.tone]);

  const toneClass = {
    success: "bg-[#2e7d4f]",
    error: "bg-[#c0392b]",
    info: "bg-ink",
    warning: "bg-gold",
  }[state.tone];

  return (
    <ToastContext.Provider value={api}>
      {state.open && !claimed ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[1400] flex justify-center px-4">
          <div
            className={`pointer-events-auto flex max-w-md items-start gap-3 rounded-md px-4 py-3 text-sm text-white shadow-[0_12px_32px_rgba(44,36,29,0.18)] ${toneClass}`}
            role="status"
          >
            <p className="m-0">{state.message}</p>
            <button
              type="button"
              className="cursor-pointer border-0 bg-transparent p-0 text-white/80"
              aria-label="Dismiss"
              onClick={() => setState((prev) => ({ ...prev, open: false }))}
            >
              ×
            </button>
          </div>
        </div>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return { toast };
  }
  return ctx;
}
