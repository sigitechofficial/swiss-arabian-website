import { formatMessage, type MessageValues } from "@/lib/i18n/messages";
import { routeLocale } from "@/lib/i18n/routeLocale";
import type { SapilCopyKey } from "./catalog";
import { loadSapilMessages } from "./load";

/** Server components: Sapil's translator for the route's language. */
export async function sapilTranslator() {
  const locale = await routeLocale();
  const messages = await loadSapilMessages(locale);
  return {
    locale,
    messages,
    t: (key: SapilCopyKey, values?: MessageValues) => formatMessage(locale, messages, key, values),
  };
}
