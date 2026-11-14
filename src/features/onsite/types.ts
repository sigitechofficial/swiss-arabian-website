/** A trigger the browser should time on this page (no content). */
export type OnsiteTrigger = {
  type: "dwell" | "scroll" | "page_view";
  seconds?: number;
  scrollPercent?: number;
};

/** The one message the backend decided to show. */
export type OnsiteMessage = {
  ruleId: string;
  slot: "POPUP" | "BANNER";
  title: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
};

export type OnsiteEventType = "SHOWN" | "CLICKED" | "DISMISSED";
