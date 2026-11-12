"use client";

import type { MessageKey } from "./messages";
import { useShopTranslator } from "./ShopLocaleProvider";

export type ShopCopyKey = MessageKey;

/** `copy(key, values?)` in the page's language (see `src/messages/*.json`). */
export function useShopCopy() {
  return useShopTranslator();
}
