/** Journey event served by the platform (GET /storefront/journeys/events). */
export type JourneyEventLine = {
  productId: string | null;
  variantId: string | null;
  sku: string;
  name: string | null;
  quantity: number;
  unitPrice: string | null;
  currency: string;
  imageUrl: string | null;
};

export type JourneyEvent = {
  /** Stable id. Acknowledge with this value. */
  eventId: string;
  name: string;
  journeyCode: string;
  step: number;
  occurredAt: string;
  owner: "PLATFORM";
  brandCode: string;
  zoneCode: string;
  entity: { type: "checkout" | "cart" | "order" | "product" | "customer"; id: string };
  currency: string;
  subtotal: string;
  total: string;
  lines: JourneyEventLine[];
};

export type JourneyEventsPull = {
  events: JourneyEvent[];
  suppressed: number;
};

export type JourneyEventsAck = {
  acknowledged: number;
  ignored: number;
};
