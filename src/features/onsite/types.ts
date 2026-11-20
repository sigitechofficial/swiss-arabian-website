/** A trigger the browser should time on this page (no content). */
export type OnsiteTrigger = {
  type: "dwell" | "scroll" | "page_view" | "exit_intent" | "idle";
  seconds?: number;
  scrollPercent?: number;
  /** idle: wait for a bag with items in it. */
  cartNotEmpty?: boolean;
  /** Reported with an idle moment: how many items the bag holds. */
  cartItems?: number;
};

/** A button link that opens the shopping assistant instead of leaving the page. */
export const ASSISTANT_LINK = "assistant:open";
/** The window event the assistant widget listens for. */
export const ASSISTANT_OPEN_EVENT = "sa:assistant-open";

import type { ResolvedDesign } from "./design/onsiteDesign";

/** The one message the backend decided to show. */
export type OnsiteMessage = {
  ruleId: string;
  slot: "POPUP" | "BANNER";
  title: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
  /** Designed in the admin playground: drawn instead of the plain title and text. */
  design?: ResolvedDesign;
};

export type OnsiteEventType = "SHOWN" | "CLICKED" | "DISMISSED";
