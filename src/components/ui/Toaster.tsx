"use client";

import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
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

  return (
    <ToastContext.Provider value={api}>
      <Snackbar
        open={state.open}
        autoHideDuration={4000}
        onClose={() => setState((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={state.tone}
          variant="filled"
          onClose={() => setState((prev) => ({ ...prev, open: false }))}
        >
          {state.message}
        </Alert>
      </Snackbar>
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
