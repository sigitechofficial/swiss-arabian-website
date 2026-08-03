"use client";

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";

type LocaleContextValue = {
  locale: string;
  currency: string;
};

const LocaleContext = createContext<LocaleContextValue>({
  locale: "en",
  currency: "AED",
});

export function LocaleProvider({
  children,
  locale = "en",
  currency = "AED",
}: {
  children: ReactNode;
  locale?: string;
  currency?: string;
}) {
  const value = useMemo(() => ({ locale, currency }), [locale, currency]);
  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
