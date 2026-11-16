import { apiGet, apiPost } from "@/lib/api/apiClient";
import type { JourneyEventsAck, JourneyEventsPull } from "../types";

/** Pending platform journey events for the signed-in customer. */
export function fetchJourneyEvents(signal?: AbortSignal) {
  return apiGet<JourneyEventsPull>("/storefront/journeys/events", { signal });
}

/** Tell the platform these events reached the browser SDK. Idempotent. */
export function acknowledgeJourneyEvents(eventIds: string[]) {
  return apiPost<JourneyEventsAck>("/storefront/journeys/events/ack", {
    eventIds,
  });
}
