"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
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

export function Toaster() {
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
      {state.open ? (
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
