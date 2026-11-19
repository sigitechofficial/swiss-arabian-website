/** A trigger the browser should time on this page (no content). */
export type OnsiteTrigger = {
  type: "dwell" | "scroll" | "page_view";
  seconds?: number;
  scrollPercent?: number;
};

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
