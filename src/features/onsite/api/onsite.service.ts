import { apiGet, apiPost } from "@/lib/api/apiClient";
import type { OnsiteEventType, OnsiteMessage, OnsiteTrigger } from "../types";

export type OnsiteContext = {
  path: string;
  locale: string;
  zoneCode: string;
  visitorId: string;
  sessionId: string;
};

function query(context: OnsiteContext): string {
  const params = new URLSearchParams({
    path: context.path,
    locale: context.locale,
    zoneCode: context.zoneCode,
    visitorId: context.visitorId,
  });
  return params.toString();
}

/** Thresholds to watch on this page. The backend leaves out rules that cannot apply here. */
export async function fetchOnsiteTriggers(context: OnsiteContext): Promise<OnsiteTrigger[]> {
  const data = await apiGet<{ triggers: OnsiteTrigger[] }>(
    `/storefront/onsite/triggers?${query(context)}`,
  );
  return data.triggers ?? [];
}

/** "What should I show now?" Returns one message or null. */
export async function decideOnsiteMessage(
  context: OnsiteContext,
  trigger: OnsiteTrigger,
): Promise<OnsiteMessage | null> {
  const data = await apiPost<{ message: OnsiteMessage | null }>("/storefront/onsite/decide", {
    ...context,
    trigger,
  });
  return data.message ?? null;
}

export async function recordOnsiteEvent(
  context: OnsiteContext,
  ruleId: string,
  type: OnsiteEventType,
): Promise<void> {
  await apiPost("/storefront/onsite/events", { ...context, ruleId, type });
}
