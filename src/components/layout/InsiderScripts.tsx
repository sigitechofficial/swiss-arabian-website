"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { env } from "@/lib/config/env";
import { insiderOtherPage, startInsiderSdk } from "@/lib/insider";

/**
 * Replay identify/track calls queued before ins.js finished.
 * The tag itself is a native <script> in root layout <head>.
 * PDP sends product + init; every other route sends other + init.
 */
export function InsiderScripts() {
  const pathname = usePathname();

  useEffect(() => {
    if (!env.insider.enabled || !env.insider.accountId) return;
    startInsiderSdk();
  }, []);

  useEffect(() => {
    if (!env.insider.enabled || !env.insider.accountId) return;
    if (pathname.startsWith("/products/")) return;
    insiderOtherPage();
  }, [pathname]);

  return null;
}
