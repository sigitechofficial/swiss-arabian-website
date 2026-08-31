"use client";

import { useEffect } from "react";
import { env } from "@/lib/config/env";
import { startInsiderSdk } from "@/lib/insider";

/**
 * Replay identify/track calls queued before ins.js finished.
 * The tag itself is a native <script> in root layout <head>.
 */
export function InsiderScripts() {
  useEffect(() => {
    if (!env.insider.enabled || !env.insider.accountId) return;
    startInsiderSdk();
  }, []);

  return null;
}
