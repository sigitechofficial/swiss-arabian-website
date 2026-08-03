"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

type ColorMode = "light" | "dark";

type ThemeContextValue = {
  mode: ColorMode;
  toggleMode: () => void;
  setMode: (mode: ColorMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = "sa-color-mode";
const MODE_EVENT = "sa-color-mode-change";

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(MODE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(MODE_EVENT, onStoreChange);
  };
}

function getSnapshot(): ColorMode {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "dark" || stored === "light") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getServerSnapshot(): ColorMode {
  return "light";
}

function applyDomMode(mode: ColorMode) {
  document.documentElement.classList.toggle("dark", mode === "dark");
}

function writeMode(mode: ColorMode) {
  window.localStorage.setItem(STORAGE_KEY, mode);
  applyDomMode(mode);
  window.dispatchEvent(new Event(MODE_EVENT));
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const mode = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Keep html.dark in sync after hydrate (layout script handles first paint)
  useEffect(() => {
    applyDomMode(mode);
  }, [mode]);

  const setMode = useCallback((next: ColorMode) => {
    writeMode(next);
  }, []);

  const toggleMode = useCallback(() => {
    writeMode(mode === "light" ? "dark" : "light");
  }, [mode]);

  const value = useMemo(
    () => ({ mode, toggleMode, setMode }),
    [mode, toggleMode, setMode],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useColorMode() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useColorMode must be used within ThemeProvider");
  }
  return ctx;
}
