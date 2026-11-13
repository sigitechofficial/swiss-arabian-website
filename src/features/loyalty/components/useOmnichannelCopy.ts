"use client";

import { useMemo } from "react";
import type { MessageKey } from "@/lib/i18n/messages";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { OMNICHANNEL_COPY } from "../types/omnichannel";

type OmnichannelCopy = { [K in keyof typeof OMNICHANNEL_COPY]: string };

/** `OMNICHANNEL_COPY` in the page's language (`loyalty.omni.<name>` in `src/messages`). */
export function useOmnichannelCopy(): OmnichannelCopy {
  const t = useShopCopy();
  return useMemo(
    () =>
      Object.fromEntries(
        Object.keys(OMNICHANNEL_COPY).map((name) => [name, t(`loyalty.omni.${name}` as MessageKey)]),
      ) as OmnichannelCopy,
    [t],
  );
}
