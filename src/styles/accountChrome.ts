/**
 * Tailwind stand-ins for the signed-in account area. Same language as the bag
 * and checkout: cream page, white hairline cards, copper accents, small caps
 * panel titles.
 */

export const accountTabs = "border-b border-[var(--line)] bg-[var(--cream,#faf6ee)]";

/** Nine sections do not fit below ~1100px: the row scrolls, without a scrollbar. */
export const accountTabsList =
  "flex gap-7 overflow-x-auto [scrollbar-width:none] max-[599px]:gap-5 [&::-webkit-scrollbar]:hidden";

export const accountTab =
  "relative shrink-0 py-4 text-[0.78rem] whitespace-nowrap text-[var(--ink-2,#5b5148)] no-underline transition-colors duration-[var(--dur,0.4s)] ease-[var(--ease,ease)] after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-[var(--copper,#8c4435)] after:opacity-0 after:content-[''] hover:text-[var(--ink,#241f1b)] aria-[current=page]:font-semibold aria-[current=page]:text-[var(--ink,#241f1b)] aria-[current=page]:after:opacity-100";

export const accountCrumbs = "pt-[clamp(1.25rem,3vh,2rem)]";

export const accountHead = "flex flex-wrap items-end justify-between gap-x-6 gap-y-4 pt-4 pb-7";

export const accountEyebrow =
  "m-0 mb-2.5 text-[0.68rem] font-semibold tracking-[0.18em] text-[var(--copper,#8c4435)] uppercase";

export const accountLede = "m-0 mt-3 max-w-[54ch] text-[0.82rem] leading-[1.6] text-[var(--ink-2,#5b5148)]";

export const accountSignedInAs = "m-0 mt-1 text-[0.75rem] text-[rgb(33_33_33/0.5)] [&_span]:text-[var(--ink-2,#5b5148)]";

export const accountSignOut =
  "inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-full border border-[rgb(33_33_33/0.22)] bg-transparent px-5 text-[0.78rem] font-semibold text-[var(--ink,#241f1b)] transition-colors duration-[var(--dur,0.2s)] ease-[var(--ease,ease)] [font:inherit] hover:border-[var(--ink,#241f1b)]";

export const accountLayout =
  "grid grid-cols-[minmax(0,1fr)_minmax(280px,340px)] items-start gap-[clamp(20px,3vw,32px)] pb-[clamp(2.5rem,5vw,4rem)] max-[900px]:grid-cols-1";

export const accountCol = "flex min-w-0 flex-col gap-[clamp(20px,3vw,28px)]";

export const accountPanel =
  "min-w-0 overflow-hidden rounded-[var(--radius-lg,4px)] border border-[var(--line)] bg-white shadow-[0_8px_28px_rgba(0,0,0,0.04)]";

export const accountPanelHead =
  "flex items-center justify-between gap-4 border-b border-[var(--line)] px-6 py-4 max-[599px]:px-5";

export const accountPanelTitle =
  "m-0 font-sans text-[0.75rem] font-semibold tracking-[0.1em] text-[var(--ink)] uppercase";

export const accountPanelLink =
  "inline-flex shrink-0 items-center gap-1 text-[0.78rem] font-medium text-[var(--copper,#8c4435)] no-underline hover:underline";

export const accountPanelBody = "px-6 py-5 max-[599px]:px-5";

/** Recent order: one quiet row instead of a card inside the card. */
export const accountOrder = "flex flex-wrap items-center gap-x-5 gap-y-4 px-6 py-5 max-[599px]:px-5";

export const accountOrderMark =
  "grid size-14 shrink-0 place-items-center rounded-[var(--radius-lg,4px)] bg-[var(--cream-2,#f3ebda)] text-[var(--copper,#8c4435)]";

export const accountOrderHeadline = "m-0 text-[0.92rem] leading-snug font-semibold text-[var(--ink,#241f1b)]";

export const accountOrderMeta =
  "m-0 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.76rem] text-[var(--ink-2,#5b5148)] [&_b]:font-semibold [&_b]:text-[var(--ink,#241f1b)] [&_i]:text-[var(--line,#d9ccb4)] [&_i]:not-italic";

export const accountOrderCta =
  "inline-flex h-10 shrink-0 items-center justify-center rounded-full border border-[rgb(33_33_33/0.22)] px-5 text-[0.78rem] font-semibold text-[var(--ink,#241f1b)] no-underline transition-colors duration-[var(--dur,0.2s)] ease-[var(--ease,ease)] hover:border-[var(--ink,#241f1b)]";

export const accountEmpty = "flex flex-col items-center px-6 py-9 text-center";

/** Shortcuts share one panel; the 1px gaps show the panel's line colour as hairlines. On a phone each becomes a compact row. */
export const accountTiles =
  "grid grid-cols-3 gap-px bg-[var(--line)] max-[1100px]:grid-cols-2 max-[520px]:grid-cols-1";

export const accountTile =
  "group/tile relative flex flex-col gap-3 bg-white p-6 text-start no-underline transition-colors duration-[var(--dur,0.2s)] ease-[var(--ease,ease)] hover:bg-[var(--cream,#faf6ee)] max-[599px]:p-5 max-[520px]:flex-row max-[520px]:items-center max-[520px]:gap-4 max-[520px]:py-4 max-[520px]:pe-12";

export const accountTileIcon =
  "grid size-10 shrink-0 place-items-center rounded-full bg-[rgb(140_68_53/0.08)] text-[var(--copper,#8c4435)]";

export const accountTileTitle = "m-0 text-[0.88rem] font-semibold text-[var(--ink,#241f1b)]";

export const accountTileCopy = "m-0 mt-1 text-[0.76rem] leading-[1.55] text-[var(--ink-2,#5b5148)]";

export const accountTileArrow =
  "absolute end-5 top-6 text-[rgb(33_33_33/0.3)] max-[520px]:top-1/2 max-[520px]:-translate-y-1/2 transition-[color,translate] duration-[var(--dur,0.2s)] ease-[var(--ease,ease)] group-hover/tile:translate-x-0.5 group-hover/tile:text-[var(--copper,#8c4435)] rtl:rotate-180 rtl:group-hover/tile:-translate-x-0.5";

export const accountAddressName = "m-0 text-[0.86rem] font-semibold text-[var(--ink,#241f1b)]";

export const accountAddressLines = "m-0 mt-1.5 text-[0.8rem] leading-[1.6] text-[var(--ink-2,#5b5148)]";

export const accountHelpList = "m-0 list-none p-0 [&_li+li]:border-t [&_li+li]:border-[var(--line)]";

export const accountHelpLink =
  "group/help flex items-center gap-3 px-6 py-3.5 text-[0.82rem] font-medium text-[var(--ink,#241f1b)] no-underline transition-colors duration-[var(--dur,0.2s)] ease-[var(--ease,ease)] hover:bg-[var(--cream,#faf6ee)] max-[599px]:px-5 [&>svg:first-child]:shrink-0 [&>svg:first-child]:text-[var(--copper,#8c4435)] [&>svg:last-child]:ms-auto [&>svg:last-child]:shrink-0 [&>svg:last-child]:text-[rgb(33_33_33/0.3)] rtl:[&>svg:last-child]:rotate-180";

export const accountHelpNote =
  "m-0 border-t border-[var(--line)] bg-[var(--cream,#faf6ee)] px-6 py-4 text-[0.74rem] leading-[1.6] text-[var(--ink-2,#5b5148)] max-[599px]:px-5";

/* ── Order detail and tracking ─────────────────────────────────────────────── */

export const accountPrimaryCta =
  "inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-[var(--copper,#8c4435)] px-7 text-[0.85rem] font-semibold text-white no-underline transition-colors duration-[var(--dur,0.2s)] ease-[var(--ease,ease)] hover:bg-[var(--copper-deep,#6d3428)]";

export const orderHeadMeta = "m-0 mt-3 flex flex-wrap items-center gap-x-3 gap-y-2";

/** A short notice above the panels: cancelled, needs help, could not cancel. */
export const orderNotice =
  "m-0 rounded-[var(--radius-lg,4px)] border px-5 py-3.5 text-[0.82rem] leading-[1.55]";

export const orderNoticeTone = {
  success: "border-[#b7dfc4] bg-[#eef8f1] text-[#1a7338]",
  info: "border-[var(--line)] bg-white text-[var(--ink,#241f1b)]",
  error: "border-[#e3b5a8] bg-[#fbefeb] text-[#8c3a2b]",
} as const;

export const orderCancel =
  "flex flex-wrap items-center justify-between gap-4 rounded-[var(--radius-lg,4px)] border border-[#e7d3a8] bg-[#f7efdd] px-5 py-4 text-[#6d5320]";

export const orderCancelBtn =
  "inline-flex h-10 cursor-pointer items-center justify-center rounded-full border border-[#c9a45c] bg-white px-5 text-[0.78rem] font-semibold text-[#6d5320] transition-colors [font:inherit] hover:bg-[#fbf5e8] disabled:opacity-60";

export const orderCancelConfirm =
  "inline-flex h-10 cursor-pointer items-center justify-center rounded-full border-0 bg-[#8c3a2b] px-5 text-[0.78rem] font-semibold text-white transition-opacity [font:inherit] disabled:opacity-60";

/** Progress: five numbered stops joined by a hairline that fills in copper. */
export const orderSteps = "m-0 flex list-none items-start p-0 px-6 pt-6 pb-5 max-[599px]:px-3";

export const orderStep = "flex min-w-0 flex-1 flex-col items-center gap-2.5 text-center";

export const orderStepRail = "flex w-full items-center";

export const orderStepLine = "h-px flex-1 bg-[var(--line)] data-[on=true]:bg-[var(--copper,#8c4435)] data-[edge=true]:opacity-0";

export const orderStepDot =
  "grid size-8 shrink-0 place-items-center rounded-full border border-[var(--line)] bg-white text-[0.72rem] font-semibold text-[rgb(33_33_33/0.45)] data-[state=done]:border-[var(--copper,#8c4435)] data-[state=done]:text-[var(--copper,#8c4435)] data-[state=current]:border-[var(--copper,#8c4435)] data-[state=current]:bg-[var(--copper,#8c4435)] data-[state=current]:text-white";

export const orderStepLabel =
  "text-[0.72rem] leading-tight text-[rgb(33_33_33/0.5)] data-[state=done]:text-[var(--ink,#241f1b)] data-[state=current]:font-semibold data-[state=current]:text-[var(--copper,#8c4435)]";

/** Two facts under the stepper, split by a hairline. */
export const orderFacts =
  "grid grid-cols-2 gap-px border-t border-[var(--line)] bg-[var(--line)] max-[599px]:grid-cols-1";

export const orderFact = "bg-white px-6 py-4 max-[599px]:px-5";

export const orderFactLabel =
  "m-0 text-[0.66rem] font-semibold tracking-[0.12em] text-[rgb(33_33_33/0.5)] uppercase";

export const orderFactValue = "m-0 mt-1.5 text-[0.9rem] font-semibold text-[var(--ink,#241f1b)]";

export const orderFactNote = "m-0 mt-1.5 text-[0.78rem] leading-[1.55] text-[var(--ink-2,#5b5148)]";

export const orderLines = "m-0 list-none p-0 [&_li+li]:border-t [&_li+li]:border-[var(--line)]";

export const orderLine = "flex items-center gap-4 px-6 py-4 max-[599px]:px-5";

export const orderLineThumb =
  "grid size-14 shrink-0 place-items-center overflow-hidden rounded-[var(--radius-lg,4px)] bg-[var(--cream-2,#f3ebda)] text-[var(--copper,#8c4435)] [&_img]:size-full [&_img]:object-contain";

export const orderLineName = "m-0 text-[0.86rem] leading-snug font-semibold text-[var(--ink,#241f1b)]";

export const orderLineMeta = "m-0 mt-1 text-[0.76rem] leading-[1.5] text-[var(--ink-2,#5b5148)]";

export const orderLinePrice = "m-0 shrink-0 text-[0.88rem] font-semibold whitespace-nowrap text-[var(--ink,#241f1b)]";

export const orderTotals =
  "m-0 flex flex-col gap-2.5 text-[0.82rem] [&>div]:flex [&>div]:justify-between [&>div]:gap-4 [&_dt]:text-[var(--ink-2,#5b5148)] [&_dd]:m-0 [&_dd]:font-medium [&_dd]:text-[var(--ink,#241f1b)]";

export const orderTotalRow =
  "mt-1 border-t border-[var(--line)] pt-3.5 text-[0.95rem] [&_dt]:font-semibold! [&_dt]:text-[var(--ink,#241f1b)]! [&_dd]:font-semibold!";

export const orderSave = "text-[var(--copper,#8c4435)]!";

export const orderDetailBlock = "[&+&]:mt-4 [&+&]:border-t [&+&]:border-[var(--line)] [&+&]:pt-4";

export const orderDetailText =
  "m-0 mt-1.5 text-[0.82rem] leading-[1.6] text-[var(--ink-2,#5b5148)] not-italic [&_b]:block [&_b]:font-semibold [&_b]:text-[var(--ink,#241f1b)]";

export const orderShipment = "px-6 py-5 max-[599px]:px-5 [&+&]:border-t [&+&]:border-[var(--line)]";

export const orderShipmentCta =
  "inline-flex h-9 shrink-0 items-center justify-center rounded-full border border-[rgb(33_33_33/0.22)] px-4 text-[0.74rem] font-semibold text-[var(--ink,#241f1b)] no-underline transition-colors hover:border-[var(--ink,#241f1b)]";

/** Events: a dot per entry on a hairline; the newest dot is copper. */
export const orderEvents = "m-0 flex list-none flex-col p-0";

export const orderEvent = "flex gap-4 pb-4 last:pb-0";

export const orderEventRail = "flex w-2 shrink-0 flex-col items-center";

export const orderEventDot =
  "mt-1.5 size-2 shrink-0 rounded-full bg-[var(--line)] data-[latest=true]:bg-[var(--copper,#8c4435)]";

export const orderEventLine = "mt-1 w-px flex-1 bg-[var(--line)]";

export const orderEventTitle = "m-0 text-[0.82rem] font-semibold text-[var(--ink,#241f1b)] [&_span]:font-normal [&_span]:text-[var(--ink-2,#5b5148)]";

export const orderEventTime = "m-0 mt-0.5 text-[0.72rem] text-[rgb(33_33_33/0.5)]";
