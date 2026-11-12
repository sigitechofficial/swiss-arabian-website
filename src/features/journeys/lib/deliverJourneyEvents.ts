import type { JourneyEvent, JourneyEventsAck, JourneyEventsPull } from "../types";

type Deps = {
  fetchEvents: () => Promise<JourneyEventsPull>;
  acknowledge: (eventIds: string[]) => Promise<JourneyEventsAck>;
  /** Hands one event to the Insider SDK. Returns false when it could not be queued. */
  fire: (event: JourneyEvent) => boolean;
  /** Event ids already handed to the SDK in this browser session. */
  seen: Set<string>;
};

export type DeliverResult = {
  fired: number;
  acknowledged: number;
  skippedSeen: number;
};

/**
 * Event name + parameters for the Insider SDK. Names must exist in Insider Attributes & Events
 * with matching types: journey_code (string), step (number), entity_type (string),
 * entity_id (string), event_id (string), total (number), currency (string), item_count (number).
 */
export function toInsiderJourneyEvent(event: JourneyEvent): {
  name: string;
  custom: Record<string, string | number>;
} {
  const total = Number(event.total);
  return {
    name: event.name,
    custom: {
      journey_code: event.journeyCode,
      step: event.step,
      entity_type: event.entity.type,
      entity_id: event.entity.id,
      event_id: event.eventId,
      total: Number.isFinite(total) ? total : 0,
      currency: event.currency,
      item_count: event.lines.reduce((sum, line) => sum + line.quantity, 0),
    },
  };
}

/**
 * Pull -> fire into the SDK -> acknowledge. An event is acknowledged only after the SDK accepted
 * it, and is never fired twice in one session even if the acknowledgement call fails (it is
 * retried on the next run; the platform deduplicates).
 */
export async function deliverJourneyEvents(deps: Deps): Promise<DeliverResult> {
  const result: DeliverResult = { fired: 0, acknowledged: 0, skippedSeen: 0 };
  const pull = await deps.fetchEvents();
  const toAck: string[] = [];

  for (const event of pull.events) {
    if (deps.seen.has(event.eventId)) {
      result.skippedSeen += 1;
      toAck.push(event.eventId);
      continue;
    }
    let fired = false;
    try {
      fired = deps.fire(event);
    } catch {
      fired = false;
    }
    if (!fired) continue;
    deps.seen.add(event.eventId);
    result.fired += 1;
    toAck.push(event.eventId);
  }

  if (toAck.length > 0) {
    const ack = await deps.acknowledge(toAck);
    result.acknowledged = ack.acknowledged;
  }
  return result;
}
