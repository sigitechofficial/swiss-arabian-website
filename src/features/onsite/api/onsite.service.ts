import { apiGet, apiPost } from "@/lib/api/apiClient";
import { getUserFacingErrorMessage } from "@/lib/api/userFacingErrors";
import type { OnsiteLeadPayload, OnsiteLeadResult } from "../design/OnsiteDesignView";
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

/**
 * The campaign behind an admin "preview on site" link, whatever its status. Null when the link is
 * invalid or expired.
 */
export async function fetchOnsitePreview(
  context: Pick<OnsiteContext, "path" | "locale" | "zoneCode">,
  token: string,
): Promise<OnsiteMessage | null> {
  const params = new URLSearchParams({
    token,
    path: context.path,
    locale: context.locale,
    zoneCode: context.zoneCode,
  });
  const data = await apiGet<{ message: OnsiteMessage | null }>(`/storefront/onsite/preview?${params}`);
  return data.message ?? null;
}

/**
 * A readable reason from a failed form send, for the visitor: the server words
 * each problem (email, phone, consent…) in the page's language.
 */
function leadErrorMessage(error: unknown): string {
  return getUserFacingErrorMessage(error);
}

/**
 * Sends a campaign's email form. With `previewToken` (an admin preview link) it is saved as a test
 * entry. Rejects with an Error whose message can be shown to the visitor.
 */
export async function submitOnsiteLead(
  context: OnsiteContext,
  ruleId: string,
  payload: OnsiteLeadPayload,
  previewToken?: string | null,
): Promise<OnsiteLeadResult> {
  try {
    return await apiPost<OnsiteLeadResult>("/storefront/onsite/leads", {
      ...context,
      ruleId,
      ...payload,
      phone: payload.phone || undefined,
      ...(previewToken ? { previewToken } : {}),
    });
  } catch (error) {
    throw new Error(leadErrorMessage(error));
  }
}

export async function recordOnsiteEvent(
  context: OnsiteContext,
  ruleId: string,
  type: OnsiteEventType,
): Promise<void> {
  await apiPost("/storefront/onsite/events", { ...context, ruleId, type });
}
