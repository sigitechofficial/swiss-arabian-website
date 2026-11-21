"use client";
import { useLocaleConfig } from "@/lib/i18n/ShopLocaleProvider";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { fetchAssistantEnabled } from "@/features/assistant/api/assistant.service";
import { AssistantWidget } from "@/features/assistant/components/AssistantWidget";
import { env } from "@/lib/config/env";
import { localeFromPathname } from "@/lib/i18n/localePath";
import { useUiStore } from "@/stores/useUiStore";

/** Pages where a chat window would get in the way of paying. */
const HIDDEN_ON = /\/(checkout|payment)(\/|$)/;

/**
 * Shows the shopping assistant window when the backend has switched it on for this brand. The
 * window is opened by the shopper, so nothing is sent before they write. A guest's chat is not saved
 * anywhere and nothing identifies them; a signed-in customer's chat is saved and comes back.
 */
export function AssistantHost() {
  const pathname = usePathname() || "/";
  const localeConfig = useLocaleConfig();
  const zoneCode = useUiStore((state) => state.catalogContext?.zoneCode) ?? "";
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (!env.assistant.enabled || !zoneCode) return;
    let cancelled = false;
    void fetchAssistantEnabled().then((value) => {
      if (!cancelled) setEnabled(value);
    });
    return () => {
      cancelled = true;
    };
  }, [zoneCode]);

  if (!enabled || !zoneCode || HIDDEN_ON.test(pathname)) return null;
  return <AssistantWidget zoneCode={zoneCode} locale={localeFromPathname(pathname, localeConfig)} />;
}
