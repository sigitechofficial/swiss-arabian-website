/** Tailwind stand-ins for the bag drawer, bag page, and shared summary chrome. */

export const drawerPanel =
  "relative flex h-full w-full flex-col overflow-hidden rounded-[18px_0_0_18px] bg-[var(--cream,#faf6ee)] text-[var(--ink,#1a1512)] [transform:translateZ(0)] [will-change:transform] max-[599px]:rounded-none [body[data-gift-reveal]_&]:animate-cart-whoop-flash motion-reduce:[body[data-gift-reveal]_&]:animate-none";

export const drawerPanelFlash = "animate-cart-whoop-flash motion-reduce:animate-none";

export const confettiLayer =
  "pointer-events-none absolute inset-0 z-40 overflow-visible motion-reduce:hidden!";

export const confettiPiece =
  "absolute top-[var(--y)] left-[var(--x)] h-[var(--h)] w-[var(--w)] bg-[var(--c)] opacity-0 [animation-delay:var(--d)] [will-change:transform,opacity] animate-cart-confetti";

/** Party popper icon that bursts open when a bundle completes; --flip mirrors the right one. */
export const partyPopper =
  "absolute top-[var(--y)] left-[var(--x)] grid size-10 place-items-center rounded-full bg-white text-[var(--copper,#8c4435)] opacity-0 shadow-[0_6px_18px_rgba(140,68,53,0.28)] animate-cart-popper";

export const confettiCircle = "rounded-full";
export const confettiRibbon = "rounded-[1px]";
export const confettiDiamond = "[clip-path:polygon(50%_0,100%_50%,50%_100%,0_50%)]";

export const drawerHead =
  "flex items-center justify-between gap-3 border-b border-[rgb(33_33_33/0.08)] px-[22px] pt-5 pb-3 [&_h2]:m-0 [&_h2]:font-[family-name:var(--font-display)] [&_h2]:text-[1.15rem] [&_h2]:font-semibold [&_h2]:tracking-[0.01em] [&_h2]:text-[var(--ink,#1a1512)]";

export const drawerClose =
  "grid size-10 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-inherit transition-colors duration-[var(--dur,0.2s)] ease-[var(--ease,ease)] hover:bg-[rgb(33_33_33/0.06)]";

/** Bundle / promotion progress, pinned between the header and the scrolling lines. */
export const drawerRail = "relative z-[1] shrink-0 pb-2 empty:hidden";

export const drawerBody =
  "min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-0 pt-2 pb-4 [scrollbar-color:rgb(26_21_18/0.22)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[rgb(26_21_18/0.22)] [&::-webkit-scrollbar-track]:bg-transparent hover:[&::-webkit-scrollbar-thumb]:bg-[rgb(26_21_18/0.36)]";

export const drawerItems = "flex flex-col";

/** Direct-child empty copy and the shop link. Nested recommendation links stay plain. */
/** Empty bag: a short centred message + CTA, then left-aligned recovery rails. */
export const drawerEmpty = "flex flex-col pb-2";

export const drawerEmptyHero =
  "mx-[22px] mt-2 mb-1 flex flex-col items-center border-b border-[rgb(33_33_33/0.08)] pt-6 pb-7 text-center";

export const drawerEmptyIcon =
  "mb-3 grid size-14 place-items-center rounded-full bg-[rgb(140_68_53/0.08)] text-[var(--copper,#8c4435)]";

export const drawerEmptyTitle =
  "m-0 font-[family-name:var(--font-display)] text-[1.05rem] font-semibold text-[var(--ink,#1a1512)]";

export const drawerEmptyCopy = "mt-1.5 mb-5 max-w-[30ch] text-[0.82rem] leading-snug text-[rgb(33_33_33/0.6)]";

export const drawerEmptyCta =
  "inline-flex h-11 items-center justify-center rounded-full bg-[var(--copper,#8c4435)] px-7 text-[0.85rem] font-semibold text-white no-underline transition-colors duration-[var(--dur,0.2s)] hover:bg-[var(--copper-deep,#6d3428)]";

/**
 * Drawer rails: one card with the next peeking in, until lg (drawer 520px)
 * fits exactly two across the swiper's content box. The rest swipe in.
 */
export const emptyBagCardFit = "w-[78%]! lg:w-[calc(50%-5px)]!";

export const drawerLine =
  "grid min-w-0 grid-cols-[76px_minmax(0,1fr)] items-start gap-3.5 overflow-hidden border-b border-[rgb(33_33_33/0.06)] px-[22px] py-4";

export const drawerLineImg =
  "grid size-[76px] place-items-center overflow-hidden rounded-[12px] bg-white [&_img]:block [&_img]:size-full [&_img]:object-contain";

/**
 * Two columns so the first bundle tag and the quantity stepper share a width:
 * tags and actions flatten into the grid (display: contents). The 7.25rem floor
 * matches the "Part of bundle" tag, so lines without a tag get the same stepper.
 */
export const drawerLineBody = "grid min-w-0 grid-cols-[minmax(7.25rem,max-content)_minmax(0,1fr)] items-center gap-1.5";

export const drawerLineTop = "col-span-2 flex min-w-0 items-start justify-between gap-3";

export const drawerLineName =
  "m-0 min-w-0 text-[0.8rem] leading-[1.35] font-semibold break-words text-[var(--ink,#1a1512)] line-clamp-2";

export const drawerLineMeta =
  "col-span-2 m-0 text-[0.75rem] leading-snug text-[rgb(33_33_33/0.55)]";

export const drawerLineNote = "contents";

/** One segment of a bundle label ("Part of bundle"). */
export const drawerLineTag =
  "inline-flex items-center justify-center justify-self-stretch rounded-full bg-[rgb(140_68_53/0.1)] px-2 py-0.5 text-[0.68rem] leading-[1.4] font-semibold tracking-[0.02em] text-[var(--copper,#8c4435)]";

/** The discount segment of a bundle label ("25% off"). */
export const drawerLineTagStrong =
  "inline-flex items-center justify-self-start rounded-full bg-[var(--copper,#8c4435)] px-2 py-0.5 text-[0.68rem] leading-[1.4] font-semibold tracking-[0.02em] text-white";

export const drawerLineActions = "contents";

export const drawerLineQty =
  "mt-1 inline-flex items-center justify-between justify-self-stretch overflow-hidden rounded-full border border-[rgb(33_33_33/0.14)] [&_button]:inline-flex [&_button]:h-8 [&_button]:w-8 [&_button]:cursor-pointer [&_button]:items-center [&_button]:justify-center [&_button]:border-0 [&_button]:bg-transparent [&_button]:text-base [&_button]:text-inherit [&_button]:[font:inherit] [&_button:disabled]:cursor-not-allowed [&_button:disabled]:opacity-35 [&_span]:min-w-6 [&_span]:flex-1 [&_span]:text-center [&_span]:text-[0.85rem]";

export const drawerLinePrice =
  "m-0 shrink-0 text-[0.9rem] leading-none font-semibold whitespace-nowrap text-[var(--copper,#8c4435)]";

export const drawerLineRemove =
  "mt-1 cursor-pointer justify-self-end border-0 bg-transparent p-0 text-[0.75rem] text-[rgb(33_33_33/0.5)] underline [font:inherit]";

export const cartRecs = "px-0 pt-4 pb-1";

export const cartRecsTitle =
  "mx-[22px] mt-0 mb-3 text-[0.72rem] font-semibold tracking-[0.14em] text-[var(--ink,#241f1b)] uppercase";

export const cartRecsSwiper =
  "flex gap-2.5 overflow-x-auto scroll-px-[22px] px-[22px] pt-0 pb-2 [scrollbar-width:none] snap-x snap-mandatory [&::-webkit-scrollbar]:hidden";

export const cartRec =
  "relative grid min-h-[108px] w-[min(78%,280px)] shrink-0 snap-start grid-cols-[92px_1fr] items-stretch gap-2.5 border border-[rgb(33_33_33/0.06)] bg-[var(--cream,#faf6ee)] p-2.5 [&_img]:size-[92px] [&_img]:self-center [&_img]:rounded-none [&_img]:bg-white [&_img]:object-contain";

/** Empty-bag suggestions. White so they read against the cream drawer. */
export const emptyBagCard =
  "relative grid h-[104px] w-[248px] shrink-0 snap-start grid-cols-[72px_minmax(0,1fr)] items-center gap-2.5 overflow-hidden rounded-xl border border-[rgb(28_25_23/0.1)] bg-white p-2.5 text-start shadow-[0_1px_2px_rgb(28_25_23/0.04)] [&_img]:size-[72px] [&_img]:shrink-0 [&_img]:self-center [&_img]:rounded-lg [&_img]:bg-[#f3ebe0] [&_img]:object-contain";

export const emptyBagName =
  "m-0 line-clamp-2 text-[0.68rem] leading-[1.3] font-medium tracking-[0.04em] text-[var(--ink,#1a1512)] uppercase";

export const emptyBagAdd =
  "absolute top-1/2 right-2.5 grid size-8 -translate-y-1/2 cursor-pointer place-items-center rounded-full border border-[var(--ink,#241f1b)] bg-white p-0 text-[var(--ink,#241f1b)]! hover:bg-[var(--ink,#241f1b)]! hover:text-white! disabled:cursor-wait disabled:opacity-50";

export const cartRecPh = "block size-[92px] self-center rounded-none bg-[#f3ebe0]";

export const cartRecCopy = "flex min-w-0 flex-col pr-[52px]";

export const cartRecName =
  "m-0 text-[0.68rem] leading-[1.3] font-medium tracking-[0.04em] text-[var(--ink,#1a1512)] uppercase";

export const cartRecPrice = "mt-1 mb-0 text-[0.68rem] font-normal text-[var(--ink,#1a1512)]";

export const cartRecSize =
  "mt-auto pt-2 text-[0.62rem] tracking-[0.08em] text-[rgb(33_33_33/0.55)] uppercase";

export const cartRecAdd =
  "absolute right-2 bottom-2 grid size-11 cursor-pointer place-items-center border border-[var(--ink,#241f1b)] bg-transparent p-0 text-[var(--ink,#241f1b)]! hover:bg-[var(--ink,#241f1b)]! hover:text-white! aria-pressed:border-[var(--copper,#8c4435)] aria-pressed:bg-[var(--copper,#8c4435)]! aria-pressed:text-white!";

export const drawerFoot =
  "shrink-0 border-t border-[rgb(33_33_33/0.08)] bg-[var(--cream,#faf6ee)] px-[22px] pt-3 pb-[max(16px,env(safe-area-inset-bottom))]";

export const drawerTotalRow =
  "mb-2.5 flex items-baseline justify-between text-base text-[var(--ink,#1a1512)]";

/** View bag + Checkout on one row to keep the footer short. */
export const drawerActions = "grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-2.5";

export const drawerCheckout =
  "flex h-11 w-full cursor-pointer items-center justify-center rounded-full border-0 bg-[var(--copper,#8c4435)] font-semibold text-white no-underline transition-colors duration-[var(--dur,0.2s)] ease-[var(--ease,ease)] hover:bg-[var(--copper-deep,#6d3428)] aria-disabled:pointer-events-none aria-disabled:cursor-not-allowed aria-disabled:opacity-45";

export const drawerViewLink =
  "flex h-11 items-center justify-center rounded-full border border-[rgb(33_33_33/0.22)] text-[0.85rem] font-semibold text-[var(--ink,#1a1512)] no-underline transition-colors duration-[var(--dur,0.2s)] ease-[var(--ease,ease)] hover:border-[var(--ink,#1a1512)]";

export const cartPageHead = "mt-3 mb-6 flex flex-wrap items-baseline gap-x-3 gap-y-1";

export const cartPageCount = "text-[0.82rem] text-[var(--ink-2,#5b5148)]";

export const cartLayout =
  "grid grid-cols-[minmax(0,1fr)_minmax(300px,360px)] items-start gap-[clamp(20px,3vw,32px)] pb-[clamp(2.5rem,5vw,4rem)] max-[860px]:grid-cols-1 [body[data-gift-reveal]_&]:animate-cart-whoop-flash motion-reduce:[body[data-gift-reveal]_&]:animate-none";

/** min-w-0 so the sideways product rails scroll instead of widening the page. */
export const cartItemsCol = "relative flex min-w-0 flex-col gap-6";

/** Bag lines in one card — same row rhythm as the drawer and checkout summary. */
export const cartLinesCard =
  "overflow-hidden rounded-[var(--radius-lg,4px)] border border-[var(--line)] bg-white pb-1 shadow-[0_8px_28px_rgba(0,0,0,0.04)]";

export const cartRow =
  "grid min-w-0 grid-cols-[88px_minmax(0,1fr)] items-start gap-4 border-b border-[rgb(33_33_33/0.06)] px-[22px] py-5 max-[767px]:grid-cols-[72px_minmax(0,1fr)] max-[767px]:gap-3.5";

export const cartRowMedia =
  "block aspect-square overflow-hidden rounded-[12px] bg-[var(--cream-2,#f3ebda)] [&_img]:block [&_img]:size-full [&_img]:object-contain";

/**
 * Two columns so the "Part of bundle" tag and the quantity stepper share a width
 * (tags and actions flatten into the grid). The 7.25rem floor matches the tag,
 * so lines without one get the same stepper — same as the bag drawer.
 */
export const cartRowBody =
  "grid min-w-0 grid-cols-[minmax(7.25rem,max-content)_minmax(0,1fr)] items-center gap-x-1.5 gap-y-2";

export const cartRowTop = "col-span-2 flex min-w-0 items-start justify-between gap-4";

export const cartRowName =
  "m-0 min-w-0 text-[0.85rem] leading-[1.35] font-semibold text-[var(--ink,#1a1512)] [&_a]:text-inherit [&_a]:no-underline [&_a:hover]:text-[var(--copper,#8c4435)]";

export const cartRowPrice =
  "m-0 shrink-0 text-right text-[0.95rem] leading-tight font-semibold whitespace-nowrap text-[var(--copper,#8c4435)]";

export const cartRowMeta = "col-span-2 m-0 text-[0.75rem] leading-snug text-[rgb(33_33_33/0.55)]";

export const cartRowTags = "contents";

export const cartRowActions = "contents";

export const cartRowQty =
  "mt-1 inline-flex items-center justify-between justify-self-stretch overflow-hidden rounded-full border border-[var(--line)] [&_button]:inline-flex [&_button]:size-[34px] [&_button]:cursor-pointer [&_button]:items-center [&_button]:justify-center [&_button]:border-0 [&_button]:bg-transparent [&_button]:text-[var(--ink)]! [&_button]:[font:inherit]! [&_button]:hover:bg-[var(--cream-2,#f3ebda)] [&_span]:min-w-7 [&_span]:flex-1 [&_span]:text-center [&_span]:text-[0.78rem] [&_span]:font-semibold";

export const cartRowRemove =
  "mt-1 ml-3 cursor-pointer justify-self-start border-0 bg-transparent p-0 text-[0.78rem] text-[rgb(33_33_33/0.55)] underline [font:inherit] hover:text-[var(--ink,#1a1512)]";

export const cartMiss = "mb-[18px]";

export const cline =
  "grid grid-cols-[96px_1fr] gap-4 rounded-[var(--radius-lg,4px)] border border-[var(--line)] bg-white px-[1.1rem] py-[0.9rem] shadow-none max-[767px]:grid-cols-[88px_1fr] max-[767px]:gap-3.5 max-[767px]:px-[1.125rem] max-[767px]:py-4 [&_h3]:m-0 [&_h3]:font-[family-name:var(--font-display)] [&_h3]:text-[0.78rem] [&_h3]:font-medium [&_h3]:tracking-[0.02em] [&_h3]:text-[var(--ink)] [&_h3]:uppercase [&_h3_a]:text-inherit [&_h3_a]:no-underline [&_h3_a]:hover:text-[var(--copper)]";

export const clineMedia =
  "block aspect-square overflow-hidden rounded-lg bg-[var(--cream-2,#f3ebda)] [&_img]:block [&_img]:size-full [&_img]:object-contain";

export const clineBody = "flex min-w-0 flex-col justify-between py-1";

export const clineRow =
  "flex items-baseline justify-between gap-4 max-[767px]:flex-col max-[767px]:items-start max-[767px]:gap-1.5";

export const clinePrice = "text-[0.8rem] font-medium whitespace-nowrap text-[var(--copper)]";

export const clineMeta =
  "mt-1.5 mb-3.5 text-[0.66rem] tracking-[0.14em] text-[var(--ink-2)] uppercase";

export const clineActions = "flex flex-wrap items-center justify-between gap-4";

export const clineQty =
  "inline-flex items-center overflow-hidden rounded-full border border-[var(--line)] [&_button]:inline-flex [&_button]:size-[34px] [&_button]:cursor-pointer [&_button]:items-center [&_button]:justify-center [&_button]:border-0 [&_button]:bg-transparent [&_button]:text-[var(--ink)]! [&_button]:[font:inherit]! [&_button]:hover:bg-[var(--cream-2,#f3ebda)] [&_span]:min-w-7 [&_span]:text-center [&_span]:text-[0.78rem] [&_span]:font-semibold";

export const clineRemove =
  "cursor-pointer border-0 border-b border-[var(--line)] bg-transparent px-0 py-1.5 text-[0.66rem] tracking-[0.12em] text-[var(--ink-2)] uppercase [font:inherit]! hover:border-[var(--ink)] hover:text-[var(--ink)]";

/** Scrolls with the page, like the checkout summary. */
export const cartSummary =
  "flex min-w-0 flex-col gap-0 rounded-[var(--radius-lg,4px)] border border-[var(--line)] bg-white p-7 shadow-[0_8px_28px_rgba(0,0,0,0.04)] max-[860px]:static max-[767px]:p-5";

export const cartSummaryTitle =
  "m-0 mb-[18px] border-b border-[var(--line)] pb-3.5 font-sans text-[0.75rem] font-semibold tracking-[0.1em] text-[var(--ink)] uppercase";

export const cartTotals =
  "m-0 mb-5 border-b border-[var(--line)] pb-[18px] [&>div]:flex [&>div]:items-baseline [&>div]:justify-between [&>div]:gap-3 [&>div]:py-2 [&>div]:text-[0.875rem] [&>div]:leading-[1.4] [&_dt]:m-0 [&_dt]:font-medium [&_dt]:text-[var(--ink-2)] [&_dd]:m-0 [&_dd]:font-semibold [&_dd]:text-[var(--ink)] [&_dd]:[font-variant-numeric:tabular-nums]";

export const cartTotalsLine =
  "mt-1 border-t border-[var(--line)] pt-3! [&_dt]:font-sans [&_dt]:text-[0.75rem] [&_dt]:font-semibold! [&_dt]:tracking-[0.08em] [&_dt]:text-[var(--ink)]! [&_dt]:uppercase [&_dd]:text-[1.0625rem] [&_dd]:font-bold!";

export const cartCta =
  "mt-1 mb-3 box-border flex w-full max-w-full min-h-12 cursor-pointer items-center justify-center gap-2 self-stretch overflow-hidden rounded-full border-0 bg-[var(--copper)]! px-5 py-0 font-sans! text-[0.8125rem]! leading-[1.2]! font-semibold! tracking-[0.04em] whitespace-nowrap text-white! uppercase no-underline transition-colors duration-[var(--dur,0.2s)] ease-[var(--ease,ease)] hover:bg-[var(--copper-deep)]! hover:text-white!";

export const cartCtaDisabled = "pointer-events-none opacity-45";

export const cartCtaInline = "mx-auto max-w-[320px]";

export const cartCtaGlyph = "shrink-0 text-[0.95em] leading-none font-normal";

export const cartContinue =
  "mb-4 box-border inline-flex min-h-11 w-full items-center justify-center self-stretch rounded-full border border-[var(--line)] bg-transparent px-4 py-0 font-sans! text-[0.8125rem]! leading-[1.2]! font-semibold! tracking-[0.02em] text-[var(--ink)]! no-underline hover:border-[var(--copper)] hover:text-[var(--copper)]!";

export const cartHint =
  "my-1.5 text-[0.8125rem] leading-[1.5] text-[var(--ink-2)] [&_strong]:text-[var(--ink)]";

export const cartBadges =
  "mt-[18px] flex flex-wrap items-center gap-x-2.5 gap-y-2 border-t border-[var(--line)] pt-[18px] text-[0.6875rem] tracking-[0.06em] text-[var(--ink-2)] uppercase";

/** Empty bag page: the drawer's empty message in a card, then left-aligned rails. */
export const cartEmptyState = "flex flex-col gap-2 pb-[clamp(2.5rem,5vw,4rem)]";

export const cartEmptyHero =
  "mb-2 flex flex-col items-center rounded-[var(--radius-lg,4px)] border border-[var(--line)] bg-white px-6 py-10 text-center shadow-[0_8px_28px_rgba(0,0,0,0.04)]";

/** Recovery rails carry the drawer's 22px gutter; pull them flush with the page column. */
export const cartEmptyRails = "-ml-[22px] min-w-0";

export const cartEmptyNote = "m-0 mb-3 text-[0.85rem] text-[rgb(33_33_33/0.62)]";

export const couponBox = "mb-[18px] min-w-0 border-b border-[var(--line)] pb-4";

export const couponLabel =
  "m-0 mb-2 font-sans text-[0.75rem] font-semibold tracking-[0.08em] text-[var(--ink)] uppercase";

export const couponForm =
  "flex min-w-0 items-stretch gap-2 [&_button]:min-h-[42px] [&_button]:shrink-0 [&_button]:cursor-pointer [&_button]:rounded-full [&_button]:border-0 [&_button]:bg-[var(--copper)]! [&_button]:px-4 [&_button]:py-0 [&_button]:font-sans! [&_button]:text-[0.75rem]! [&_button]:leading-none! [&_button]:font-semibold! [&_button]:tracking-[0.06em] [&_button]:whitespace-nowrap [&_button]:text-white! [&_button]:uppercase [&_button:disabled]:cursor-not-allowed [&_button:disabled]:opacity-55 [&_input]:box-border [&_input]:h-auto [&_input]:min-h-[42px] [&_input]:w-auto [&_input]:min-w-0 [&_input]:flex-1 [&_input]:rounded-lg [&_input]:border [&_input]:border-[var(--line)] [&_input]:bg-[#fffdf8] [&_input]:px-3 [&_input]:text-[0.875rem] [&_input]:text-[var(--ink)] [&_input]:[font:inherit] [&_input]:outline-none focus:[&_input]:border-[var(--line)] [&_input[aria-invalid=true]]:border-[#b42318]";

export const couponApplied =
  "mb-2.5 grid grid-cols-[1fr_auto] items-center gap-x-2.5 gap-y-1.5";

export const couponAppliedName = "m-0 text-[0.875rem] font-semibold text-[var(--ink)]";

export const couponAppliedCode =
  "mt-0.5 mb-0 text-[0.75rem] tracking-[0.04em] text-[var(--ink-2)] uppercase";

export const couponAppliedAmt = "text-[0.875rem] font-semibold text-[var(--copper)]";

export const couponAppliedRemove =
  "col-span-2 justify-self-start cursor-pointer border-0 bg-transparent p-0 text-[0.75rem] text-[var(--ink-2)] underline [font:inherit]!";

export const couponError = "mt-2 mb-0 text-[0.75rem] text-[#b42318]";

export const couponHint = "mt-2 mb-0 text-[0.75rem] text-[var(--ink-2)]";

export const couponCheck =
  "mt-2 inline-block cursor-pointer border-0 bg-transparent p-0 text-[0.75rem] text-[var(--ink)] underline [font:inherit]! disabled:cursor-wait disabled:opacity-55";

export const promoAppliedList = "m-0 mb-3 list-none p-0";

export const promoAppliedRow =
  "flex justify-between gap-2.5 py-1 text-[0.82rem] text-[var(--ink)] [&>span:last-child]:shrink-0 [&>span:last-child]:whitespace-nowrap";

export const promoGifts = "mt-1 mb-2 flex flex-col gap-3";

export const promoGiftsAwarded = "flex flex-col gap-3";

/** Bag drawer: gifts sit in the line gutter instead of the full cart-page card. */
export const promoGiftsDrawer = "flex flex-col gap-2 px-[22px] py-3";

export const giftDrawerLine =
  "grid min-w-0 grid-cols-[56px_minmax(0,1fr)] items-center gap-3 rounded-[12px] border border-[rgb(33_33_33/0.08)] bg-white p-2.5";

export const giftDrawerMedia =
  "grid size-14 place-items-center overflow-hidden rounded-[8px] bg-[var(--cream,#faf6ee)] [&_img]:block [&_img]:size-full [&_img]:object-contain";

export const giftDrawerBody = "flex min-w-0 flex-col gap-1.5";

export const giftDrawerMeta = "flex items-center gap-2 text-[0.72rem] text-[rgb(33_33_33/0.55)]";

export const promoGiftsTitle = "m-0 mb-[0.35rem] text-[0.85rem] font-semibold text-[var(--ink)]";

export const promoGiftsPrompt =
  "flex items-center justify-between gap-3 rounded-[var(--radius-lg,4px)] border border-[rgba(201,162,39,0.45)] bg-[#fffdf8] px-4 py-[0.85rem]";

export const promoGiftsChoose =
  "cursor-pointer rounded-full border-0 bg-[#8c4435]! px-[0.9rem] py-[0.45rem] font-sans! text-[0.78rem]! font-[650]! text-white!";

export const promoGiftsChange =
  "mt-[0.35rem] cursor-pointer self-start border-0 bg-transparent px-0 py-[0.2rem] text-[0.78rem] font-[650] text-[#8c4435] [font:inherit]!";

export const giftChoiceRoot =
  "fixed inset-0 z-[1500] grid place-items-center px-4 py-6";

export const giftChoiceBackdrop =
  "absolute inset-0 cursor-pointer border-0 bg-[rgba(24,20,17,0.46)]";

export const giftChoiceDialog =
  "relative max-h-[min(82vh,640px)] w-[min(440px,100%)] overflow-auto rounded-[18px] bg-[#fffdf8] px-[22px] pt-7 pb-5 text-[var(--ink,#212121)] shadow-[0_24px_60px_rgba(24,20,17,0.22)] [&_h2]:m-0 [&_h2]:text-[1.65rem] [&_h2]:leading-[1.1]";

export const giftChoiceReveal =
  "animate-gift-choice-rise motion-reduce:animate-none";

export const giftChoiceKicker =
  "m-0 mb-1.5 text-[0.72rem] font-bold tracking-[0.16em] text-[#8c4435] uppercase";

export const giftChoiceLede = "mt-2 mb-4 text-[0.92rem] text-[rgba(33,33,33,0.72)]";

export const giftChoiceList =
  "m-0 flex list-none flex-col gap-2.5 p-0 [&_button]:cursor-pointer [&_button]:rounded-full [&_button]:border-0 [&_button]:bg-[#8c4435]! [&_button]:px-[0.85rem] [&_button]:py-2 [&_button]:text-[0.78rem] [&_button]:font-[650]! [&_button]:text-white! [&_button]:[font:inherit]! [&_button:disabled]:cursor-not-allowed [&_button:disabled]:opacity-55 [&_img]:size-16 [&_img]:rounded-[10px] [&_img]:bg-[#f4ead8] [&_img]:object-contain [&_li]:grid [&_li]:animate-gift-choice-card [&_li]:grid-cols-[64px_1fr_auto] [&_li]:items-center [&_li]:gap-3 [&_li]:rounded-[14px] [&_li]:border [&_li]:border-[rgba(33,33,33,0.08)] [&_li]:bg-white [&_li]:p-2.5 motion-reduce:[&_li]:animate-none";

export const giftChoicePh = "block size-16 rounded-[10px] bg-[#f4ead8]";

export const giftChoiceName =
  "flex flex-col gap-0.5 text-[0.95rem] font-[650] [&_small]:text-[0.75rem] [&_small]:font-medium [&_small]:text-[rgba(33,33,33,0.55)]";

export const giftChoiceLater =
  "mx-auto mt-4 block cursor-pointer border-0 bg-transparent text-[0.85rem] text-[rgba(33,33,33,0.66)] underline [font:inherit]!";

export const promoMarks =
  "m-0 mb-2.5 flex list-none gap-2 overflow-x-auto p-0";

export const promoMark =
  "w-auto max-w-40 min-w-[92px] shrink-0 border border-[rgb(33_33_33/0.12)] bg-transparent px-2.5 py-2 [&_strong]:mt-0.5 [&_strong]:block [&_strong]:text-[0.82rem] [&_strong]:font-semibold";

export const promoMarkComplete = "border-[#2f7d4a]";

export const promoMarkCurrent = "border-[var(--copper,#8c4435)] bg-white";

export const promoMarkState =
  "block text-[0.68rem] tracking-[0.04em] text-[rgb(33_33_33/0.62)] uppercase";

const shipCopyDrawer =
  "m-0 mb-2 block text-[0.95rem] leading-[1.4] [overflow-wrap:anywhere] text-[var(--ink,#1a1512)]";

const shipCopyBanner = "m-0 mb-1.5 text-[0.75rem] font-normal text-[var(--ink-2)]";

const shipCopyCheckout =
  "m-0 mb-2 text-[0.72rem] font-normal tracking-normal text-[var(--ink-2)]";

export const shipBarDrawer =
  "group/ship relative overflow-visible px-[22px] pt-3.5 pb-0";

export const shipBarBanner =
  "group/ship m-0 mb-[18px] rounded-[var(--radius-lg,4px)] border border-[var(--line)] bg-white px-3.5 py-3";

export const shipBarCheckout =
  "group/ship m-0 mb-4 border-b border-[var(--line)] px-0 pt-0 pb-3.5";

export const shipCopy = {
  drawer: shipCopyDrawer,
  banner: shipCopyBanner,
  checkout: shipCopyCheckout,
} as const;

export const shipCopyFree = {
  drawer:
    "flex items-center gap-2 text-[0.98rem] font-[650] tracking-[0.01em] text-[#2f7d4a] group-data-[whoop]/ship:animate-ship-whoop-msg motion-reduce:animate-none",
  banner: "font-medium text-[#2f7d4a]",
  checkout: "font-medium text-[#2f7d4a]",
} as const;

export const shipTrack = {
  drawer:
    "relative h-1.5 overflow-hidden rounded-full bg-[rgb(33_33_33/0.08)] group-data-[whoop]/ship:animate-ship-whoop-track motion-reduce:animate-none",
  banner: "h-1.5 overflow-hidden rounded-full bg-[rgba(36,31,27,0.08)]",
  checkout: "h-[5px] overflow-hidden rounded-full bg-[rgba(36,31,27,0.08)]",
} as const;

export const shipFill = {
  drawer:
    "relative h-full w-0 origin-left rounded-[inherit] bg-[var(--copper,#8c4435)] transition-[width,background-color] duration-[350ms] ease-[ease] group-data-[free]/ship:bg-[linear-gradient(90deg,#1e6a3c_0%,#3aa05a_48%,#c9a227_78%,#2f7d4a_100%)] group-data-[whoop]/ship:animate-ship-whoop-bar group-data-[whoop]/ship:after:absolute group-data-[whoop]/ship:after:inset-0 group-data-[whoop]/ship:after:animate-ship-whoop-shine group-data-[whoop]/ship:after:rounded-[inherit] group-data-[whoop]/ship:after:bg-[linear-gradient(105deg,transparent_28%,rgba(255,248,230,0.7)_50%,transparent_72%)] motion-reduce:animate-none motion-reduce:after:hidden",
  banner:
    "h-full w-0 rounded-[inherit] bg-[var(--copper)] transition-[width] duration-[350ms] ease-[var(--ease,ease)] group-data-[free]/ship:bg-[#2f7d4a]",
  checkout:
    "h-full rounded-[inherit] bg-[var(--copper)] transition-[width,background-color] duration-[350ms] ease-[var(--ease,ease)] group-data-[free]/ship:bg-[#2f7d4a]",
} as const;

export const shipWhoopCheck =
  "inline-grid size-[18px] shrink-0 place-items-center rounded-full bg-[#2f7d4a] text-white shadow-[0_0_0_3px_rgba(47,125,74,0.16)] before:h-1 before:w-2 before:translate-x-px before:-translate-y-px before:-rotate-45 before:border-b-2 before:border-l-2 before:border-white before:content-[''] group-data-[whoop]/ship:animate-ship-whoop-check motion-reduce:animate-none";

export type ShipVariant = keyof typeof shipCopy;

export function shipVariant(surface: string): ShipVariant {
  if (surface === "checkout") return "checkout";
  if (surface === "drawer") return "drawer";
  return "banner";
}

export function shipBarClass(variant: ShipVariant): string {
  if (variant === "drawer") return shipBarDrawer;
  if (variant === "checkout") return shipBarCheckout;
  return shipBarBanner;
}
