"use client";

import { useState } from "react";

/**
 * Tabby's official logo, used exactly as downloaded from Tabby's brand pack
 * (https://docs.tabby.ai/marketing/toolkit): no recolouring, no redrawing.
 * Tabby QA (Nov 2026) rejected our own "tabby" text badge.
 *
 * The file lives at {@link TABBY_LOGO_SRC}. Until it is added, nothing is
 * drawn: no logo is better than an unofficial one.
 */
export const TABBY_LOGO_SRC = "/assets/payments/tabby/tabby-logo.svg";

export function TabbyLogo({ className = "h-6 w-auto" }: { className?: string }) {
  const [missing, setMissing] = useState(false);
  if (missing) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- Tabby's file as downloaded, never re-encoded
    <img
      src={TABBY_LOGO_SRC}
      alt="Tabby"
      className={`shrink-0 ${className}`}
      onError={() => setMissing(true)}
    />
  );
}
