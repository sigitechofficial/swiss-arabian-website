/** Tailwind classes for checkout, confirmation, tracking, and form fields. */

export const checkoutHead = "mt-5 mb-9";

export const checkoutSteps =
  "m-0 flex list-none flex-wrap gap-3 pt-3.5 pb-0 text-[0.68rem] font-normal tracking-[0.04em] text-[var(--ink-2,#5b5148)] uppercase [&_a]:text-inherit [&_a]:no-underline [&_a]:transition-colors [&_a]:hover:text-copper";

export const checkoutStepCurrent = "font-medium text-copper";

export const checkoutSummaryToggle =
  "group mb-4 hidden w-full cursor-pointer items-center justify-between gap-3 rounded-[var(--radius-lg,4px)] border border-[var(--line,#d9ccb4)] bg-white px-4 py-3.5 text-[0.8rem]! font-medium! text-[var(--ink,#241f1b)]! aria-expanded:mb-0 aria-expanded:rounded-b-none aria-expanded:border-copper max-[860px]:flex max-[860px]:order-1 max-[860px]:box-border";

export const checkoutSummaryToggleTotal =
  "ms-auto inline-flex items-center gap-2 tabular-nums";

export const checkoutSummaryChevron =
  "inline-block size-[0.55rem] translate-y-[-0.1em] rotate-45 border-e-[1.5px] border-b-[1.5px] border-current transition-transform duration-200 ease-linear group-aria-expanded:translate-y-[0.15em] group-aria-expanded:rotate-[225deg]";

export const checkoutLayout =
  "grid grid-cols-[minmax(0,1.4fr)_minmax(280px,420px)] items-start gap-[clamp(28px,4vw,48px)] pt-[clamp(1.5rem,3vw,2.5rem)] pb-[clamp(3rem,6vw,5rem)] max-[860px]:flex max-[860px]:flex-col max-[860px]:items-stretch max-[860px]:gap-0";

export const checkoutForm =
  "flex flex-col gap-5 max-[860px]:order-3 max-[860px]:w-full";

export const stripePayForm = "gap-4";

export const cbox =
  "rounded-[var(--radius-lg,4px)] border border-[var(--line,#d9ccb4)] bg-white p-[26px] max-[767px]:p-5";

export const cboxHead =
  "mb-[18px] flex items-center gap-3.5 border-b border-[var(--line,#d9ccb4)] pb-3.5 [&_h2]:m-0 [&_h2]:font-[family-name:var(--font-display)] [&_h2]:text-[0.82rem] [&_h2]:font-medium [&_h2]:tracking-[0.02em] [&_h2]:text-[var(--ink,#241f1b)] [&_h2]:uppercase";

export const stripePayHead = "flex-wrap";

export const cboxNum =
  "grid size-7 shrink-0 place-items-center rounded-full bg-copper font-[family-name:var(--font-display)] text-[0.68rem] font-medium text-white!";

export const stripePayNum = "text-[0px]";

export const cboxBody = "flex flex-col gap-3.5";

export const cboxGrid =
  "grid grid-cols-2 gap-x-4 gap-y-3.5 max-[767px]:grid-cols-1";

export const fld =
  "flex flex-col gap-1.5 text-[0.8125rem] font-normal text-[var(--ink,#241f1b)] [&>span]:text-[0.62rem] [&>span]:font-normal [&>span]:tracking-[0.04em] [&>span]:text-[var(--ink-2,#5b5148)] [&>span]:uppercase [&_input]:min-h-[46px] [&_input]:rounded-lg [&_input]:border [&_input]:border-[var(--line,#d9ccb4)] [&_input]:bg-[#fffdf8] [&_input]:px-3.5 [&_input]:text-[0.875rem] [&_input]:font-normal [&_input]:text-[var(--ink,#241f1b)] [&_input]:[font-family:inherit] [&_input]:outline-none focus:[&_input]:border-[var(--line,#d9ccb4)] focus:[&_input]:outline-none focus-visible:[&_input]:outline-none [&_select]:min-h-[46px] [&_select]:rounded-lg [&_select]:border [&_select]:border-[var(--line,#d9ccb4)] [&_select]:bg-[#fffdf8] [&_select]:px-3.5 [&_select]:text-[0.875rem] [&_select]:font-normal [&_select]:text-[var(--ink,#241f1b)] [&_select]:[font-family:inherit] [&_select]:outline-none focus:[&_select]:outline-none [&_textarea]:min-h-[46px] [&_textarea]:rounded-lg [&_textarea]:border [&_textarea]:border-[var(--line,#d9ccb4)] [&_textarea]:bg-[#fffdf8] [&_textarea]:px-3.5 [&_textarea]:text-[0.875rem] [&_textarea]:font-normal [&_textarea]:text-[var(--ink,#241f1b)] [&_textarea]:[font-family:inherit] [&_textarea]:outline-none focus:[&_textarea]:outline-none [&_input[aria-invalid=true]]:border-[#b42318] [&_select[aria-invalid=true]]:border-[#b42318] [&_input[type=checkbox]]:size-[18px] [&_input[type=checkbox]]:min-h-[18px] [&_input[type=checkbox]]:p-0 [&_input[type=checkbox]]:accent-copper max-[767px]:[&_input]:text-[16px] max-[767px]:[&_select]:text-[16px] max-[767px]:[&_textarea]:text-[16px]";

export const fldFull = `${fld} col-span-full`;

export const fldCheck =
  `${fld} flex-row items-center gap-2.5 font-medium [&>span]:text-[0.875rem]! [&>span]:tracking-normal! [&>span]:text-[var(--ink,#241f1b)]! [&>span]:normal-case!`;

export const fldHint =
  "text-[0.75rem] font-normal tracking-normal text-[var(--ink-2,#5b5148)] normal-case";

export const fldSelect = "relative [&_select]:w-full [&_select]:cursor-pointer [&_select]:appearance-none [&_select]:pr-9 [&_b]:pointer-events-none [&_b]:absolute [&_b]:top-1/2 [&_b]:right-3.5 [&_b]:-translate-y-1/2 [&_b]:text-[var(--ink-2,#5b5148)]";

/** Country trigger — a button, so color and font beat `.landing button`. */
export const phoneCc =
  "flex min-h-[46px] cursor-pointer items-center gap-2 rounded-lg border border-[var(--line,#d9ccb4)] bg-[#fffdf8] px-3 text-[0.875rem]! font-normal! text-[var(--ink,#241f1b)]! [font-family:inherit]!";

export const phoneNum = "min-w-0 flex-1";

export const payOptions = "mb-4 grid gap-2.5";

export const payOpt =
  "grid cursor-pointer grid-cols-[auto_1fr_auto] items-center gap-3 rounded-[10px] border border-[var(--line,#d9ccb4)] bg-[#fffdf8] px-4 py-3.5 transition-[border-color,background] duration-300 hover:border-[var(--ink-2,#5b5148)] has-[:checked]:border-copper has-[:checked]:bg-[rgba(140,68,53,0.04)] [&_input]:accent-copper";

export const payOptActive = "border-copper bg-[rgba(140,68,53,0.04)]";

export const payOptDisabled = "pointer-events-none cursor-not-allowed opacity-55";

export const payOptTitle = "block text-[0.82rem] font-medium text-[var(--ink,#241f1b)]";

export const payOptNote = "block text-[0.75rem] text-[var(--ink-2,#5b5148)]";

export const payOptBadge =
  "text-[0.62rem] font-medium tracking-[0.04em] text-copper uppercase";

export const payMockNote = "mt-3 mb-0 text-[0.82rem] text-[var(--ink-2,#5b5148)] italic";

const ctaShared =
  "inline-flex min-h-14 w-full cursor-pointer items-center justify-center gap-2.5 rounded-full border px-4 font-[family-name:var(--font-display)]! text-[0.7rem]! font-medium! tracking-[0.06em] uppercase no-underline transition-[background,border-color,color] duration-[var(--dur,0.4s)] ease-[var(--ease,ease)] disabled:cursor-not-allowed disabled:opacity-55 [&_b]:font-normal [&_b]:text-inherit";

export const checkoutCta =
  `${ctaShared} border-copper bg-copper text-white! hover:border-copper-deep hover:bg-copper-deep hover:text-white!`;

export const checkoutCtaGhost =
  `${ctaShared} border-copper bg-transparent text-copper! hover:border-copper hover:bg-copper hover:text-white!`;

export const checkoutCtaInline = "mx-auto max-w-[320px]";

export const stripePayCta = "mt-1.5";

export const checkoutLegal =
  "m-0 text-center text-[0.78rem] leading-[1.6] text-[var(--ink-2,#5b5148)] [&_a]:text-copper";

export const checkoutSummary =
  "sticky top-[calc(var(--site-header-h,9.25rem)+16px)] rounded-[var(--radius-lg,4px)] border border-[var(--line,#d9ccb4)] bg-white px-[22px] py-7 shadow-[0_8px_28px_rgba(0,0,0,0.04)] max-[767px]:px-5 max-[767px]:py-5 max-[860px]:static max-[860px]:order-2 max-[860px]:hidden max-[860px]:w-full max-[860px]:max-w-none max-[860px]:box-border [&_h2]:m-0 [&_h2]:mb-3.5 [&_h2]:border-b [&_h2]:border-[var(--line,#d9ccb4)] [&_h2]:pb-3 [&_h2]:font-[family-name:var(--font-display)] [&_h2]:text-[0.8rem] [&_h2]:font-medium [&_h2]:tracking-[0.04em] [&_h2]:text-[var(--ink,#241f1b)] [&_h2]:uppercase";

export const checkoutSummaryOpen =
  "max-[860px]:mt-0 max-[860px]:mb-5 max-[860px]:block max-[860px]:rounded-t-none max-[860px]:border-t-0";

/** Stripe payment shows the summary under the form; it is not collapsible. */
export const stripePaySummary = "max-[860px]:mt-5 max-[860px]:block!";

export const checkoutLines =
  "mb-4 flex max-h-[420px] flex-col overflow-auto overscroll-contain border-b border-[var(--line,#d9ccb4)] pr-1.5 [scrollbar-color:auto] [scrollbar-width:auto] [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-button]:hidden [&::-webkit-scrollbar-button]:size-0 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[rgba(140,68,53,0.22)] [&::-webkit-scrollbar-track]:my-1 [&::-webkit-scrollbar-track]:bg-transparent hover:[&::-webkit-scrollbar-thumb]:bg-[rgba(140,68,53,0.45)] supports-[not(selector(::-webkit-scrollbar))]:[scrollbar-color:rgba(140,68,53,0.3)_transparent] supports-[not(selector(::-webkit-scrollbar))]:[scrollbar-width:thin]";

/** Same row rhythm as the bag drawer: 76px image, name and price on one line, 16px vertical padding. */
export const coline =
  "grid min-w-0 grid-cols-[76px_minmax(0,1fr)] items-start gap-3.5 border-b border-[rgb(33_33_33/0.06)] py-4 last:border-b-0";

export const colineMedia =
  "relative grid size-[76px] place-items-center overflow-visible rounded-[12px] bg-[var(--cream-2,#f3ebda)] [&_img]:block [&_img]:size-full [&_img]:rounded-[12px] [&_img]:object-contain [&_b]:absolute [&_b]:-top-1.5 [&_b]:-right-1.5 [&_b]:z-[1] [&_b]:grid [&_b]:h-[18px] [&_b]:min-w-[18px] [&_b]:place-items-center [&_b]:rounded-full [&_b]:bg-copper [&_b]:px-1 [&_b]:text-[0.65rem] [&_b]:font-medium [&_b]:text-white [&_b]:shadow-[0_0_0_1.5px_#fff]";

export const colineBody = "flex min-w-0 flex-col gap-1.5";

export const colineTop = "flex min-w-0 items-start justify-between gap-3";

export const colineName =
  "m-0 min-w-0 text-[0.8rem] leading-[1.35] font-semibold break-words text-[var(--ink,#1a1512)] line-clamp-2";

export const colineMeta = "m-0 text-[0.75rem] leading-snug text-[rgb(33_33_33/0.55)]";

export const colineNote = "m-0 text-[0.75rem] leading-snug text-[var(--copper,#8c4435)]";

export const colinePrice =
  "m-0 shrink-0 text-[0.9rem] leading-none font-semibold whitespace-nowrap text-[var(--copper,#8c4435)]";

export const checkoutTotals =
  "m-0 mb-3 [&>div]:flex [&>div]:justify-between [&>div]:gap-3 [&>div]:py-1.5 [&>div]:text-[0.8rem] [&_dt]:m-0 [&_dt]:font-normal [&_dt]:text-[var(--ink-2,#5b5148)] [&_dd]:m-0 [&_dd]:font-medium [&_dd]:text-[var(--ink,#241f1b)]";

export const checkoutTotalsLine =
  "mt-1.5 border-t border-[var(--line,#d9ccb4)] pt-3 text-[0.9rem] font-medium";

export const checkoutAddons = "m-0 mb-4";

export const checkoutAddonsTitle =
  "m-0 mb-2.5 text-[0.68rem] font-medium tracking-[0.04em] text-[var(--ink-2,#5b5148)] uppercase";

export const checkoutAddon =
  "grid grid-cols-[44px_1fr_auto] items-center gap-2.5 py-1.5";

export const checkoutAddonMedia =
  "size-11 rounded-lg bg-[var(--cream-2,#f3ebda)] object-contain";

export const checkoutAddonName =
  "m-0 text-[0.72rem] font-medium tracking-normal text-[var(--ink,#241f1b)]";

export const checkoutAddonPrice =
  "mt-0.5 mb-0 text-[0.68rem] font-normal text-[var(--ink-2,#5b5148)]";

export const checkoutAddonAdd =
  "cursor-pointer rounded-full border border-[var(--line,#d9ccb4)] bg-white px-2.5 py-[5px] text-[0.68rem]! font-medium! tracking-normal whitespace-nowrap text-[var(--ink,#241f1b)]! [font-family:inherit]! hover:border-copper hover:text-copper! disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-[var(--line,#d9ccb4)] disabled:hover:text-[var(--ink,#241f1b)]!";

export const checkoutMiss =
  "mb-4 border-b border-[var(--line,#d9ccb4)] pb-3.5";

export const checkoutMissHead = "mb-2 flex items-center justify-between gap-3";

export const checkoutMissTitle =
  "m-0 text-[0.68rem] font-medium tracking-[0.04em] text-[var(--ink-2,#5b5148)] uppercase";

export const checkoutMissNav =
  "flex gap-1.5 [&_button]:inline-flex [&_button]:size-7 [&_button]:cursor-pointer [&_button]:items-center [&_button]:justify-center [&_button]:rounded-full [&_button]:border [&_button]:border-[var(--line,#d9ccb4)] [&_button]:bg-white [&_button]:p-0 [&_button]:text-[var(--ink,#241f1b)]! [&_button]:[font:inherit]! [&_button]:hover:border-copper [&_button]:hover:text-copper! [&_svg]:size-3.5";

export const checkoutMissList =
  "flex touch-pan-x snap-x snap-mandatory gap-2.5 overflow-x-auto overflow-y-hidden overscroll-x-contain scroll-smooth px-0.5 pt-0.5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

/** Full card chrome when the row sits in the “don’t miss this” scroller. */
export const checkoutMissCard =
  "grid w-[min(68%,210px)] shrink-0 snap-start grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-2 rounded-[10px] border border-[rgba(217,204,180,0.45)] bg-[#fffefb] px-2.5 py-2 max-[767px]:w-[min(78%,220px)] [&_img]:size-9 [&_img]:rounded-lg [&_img]:bg-[var(--cream-2,#f3ebda)] [&_img]:object-contain [&_[data-addon-ph]]:size-9 [&_[data-addon-ph]]:rounded-lg [&_[data-addon-ph]]:bg-[var(--cream-2,#f3ebda)] [&_p:first-child]:truncate [&_p:last-child]:mt-px [&_p:last-child]:text-[0.58rem] [&_p:last-child]:leading-[1.2] [&_button]:inline-flex [&_button]:size-7 [&_button]:items-center [&_button]:justify-center [&_button]:border-0! [&_button]:bg-copper! [&_button]:p-0! [&_button]:text-[1.05rem]! [&_button]:leading-none [&_button]:text-white! [&_button:hover]:border-transparent [&_button:hover]:bg-copper-deep! [&_button:hover]:text-white! [&_button:disabled:hover]:bg-copper! [&_button:disabled:hover]:text-white!";

export const checkoutBadges =
  "m-0 text-center text-[0.65rem] font-normal tracking-[0.03em] text-[var(--ink-2,#5b5148)] uppercase";

const stateCopy =
  "text-center [&_p]:m-0 [&_p]:mb-6 [&_p]:text-[var(--ink-2,#5b5148)]";

export const checkoutDone =
  `${stateCopy} mx-auto max-w-[720px] px-4 pt-10 pb-12`;

export const checkoutEmpty =
  `${stateCopy} mx-auto max-w-[640px] px-4 pt-12 pb-[72px]`;

export const checkoutDoneActions = "flex flex-col items-center gap-3.5";

export const checkoutLoading =
  "flex min-h-[60vh] flex-col items-center justify-center";

export const checkoutError =
  "m-0 border border-[#e3b5a8] bg-[#fbefeb] px-3.5 py-3 text-left text-[0.85rem] leading-[1.5] text-[#8c3a2b]";

export const checkoutNote =
  "m-0 text-[0.82rem] leading-[1.55] text-[var(--ink-2,#5b5148)]";

export const checkoutSummaryNote = "mb-3.5";

export const checkoutLink =
  "cursor-pointer border-0 bg-transparent p-0 text-[0.85rem]! text-[var(--ink-2,#5b5148)]! underline! underline-offset-[3px] [font:inherit]! hover:text-copper!";

export const ocHero =
  "mx-auto flex max-w-[820px] flex-col items-center px-0 pt-9 pb-11 text-center";

export const ocHeroIntro =
  "mb-7 max-w-[560px] text-[0.92rem] leading-[1.65] text-[var(--ink-2,#5b5148)] [&_strong]:font-medium [&_strong]:text-[var(--ink,#241f1b)] [&_strong]:wrap-anywhere";

export const ocBadge =
  "mb-[18px] grid size-[76px] place-items-center rounded-full bg-white shadow-[0_14px_34px_-18px_rgba(140,68,53,0.55)] [&_svg]:size-[52px] [&_svg]:[stroke-linecap:round] [&_svg]:[stroke-linejoin:round] [&_svg]:[stroke-width:2]";

export const ocBadgeSuccess = "text-[#2f7d4a]";
export const ocBadgeFailed = "text-[#b4483f]";
export const ocBadgePending = "text-copper";

export const ocBadgeRing = "stroke-current opacity-25";

export const ocBadgeMark =
  "stroke-current [stroke-dasharray:48] [stroke-dashoffset:48] animate-oc-draw motion-reduce:animate-none motion-reduce:[stroke-dashoffset:0]";

export const ocMeta =
  "mb-7 grid w-full grid-cols-[minmax(max-content,1.6fr)_repeat(3,minmax(0,1fr))] rounded-[var(--radius-lg,4px)] border border-[var(--line,#d9ccb4)] bg-white text-left max-[640px]:grid-cols-1 [&_dt]:m-0 [&_dt]:mb-1.5 [&_dt]:text-[0.6rem] [&_dt]:font-medium [&_dt]:tracking-[0.1em] [&_dt]:text-[var(--ink-2,#5b5148)] [&_dt]:uppercase [&_dd]:m-0 [&_dd]:text-[0.85rem] [&_dd]:font-medium [&_dd]:whitespace-nowrap [&_dd]:text-[var(--ink,#241f1b)] [&>div]:border-s [&>div]:border-[var(--line,#d9ccb4)] [&>div]:px-5 [&>div]:py-4 [&>div:first-child]:border-s-0 max-[640px]:[&_dt]:mb-0 max-[640px]:[&_dd]:text-right max-[640px]:[&>div]:flex max-[640px]:[&>div]:min-w-0 max-[640px]:[&>div]:flex-wrap max-[640px]:[&>div]:items-center max-[640px]:[&>div]:justify-between max-[640px]:[&>div]:gap-x-3 max-[640px]:[&>div]:gap-y-1.5 max-[640px]:[&>div]:border-s-0 max-[640px]:[&>div]:border-t max-[640px]:[&>div]:px-4 max-[640px]:[&>div]:py-3 max-[640px]:[&>div:first-child]:border-t-0";

export const ocMetaNumber = "flex items-center gap-2 [&_span]:tracking-[0.02em] [&_span]:whitespace-nowrap";

export const ocCopy =
  "cursor-pointer rounded-full border border-[var(--line,#d9ccb4)] bg-transparent px-2 py-0.5 text-[0.6rem]! tracking-[0.06em] text-[var(--ink-2,#5b5148)]! uppercase [font:inherit]! hover:border-copper hover:text-copper!";

export const ocActions =
  "grid w-full max-w-[540px] grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3";

export const ocBody =
  "mx-auto grid max-w-[1040px] grid-cols-[minmax(0,1.55fr)_minmax(280px,1fr)] items-start gap-5 px-0 pb-20 max-[860px]:grid-cols-1";

export const ocStack = "grid gap-5";

export const ocCard =
  "rounded-[var(--radius-lg,4px)] border border-[var(--line,#d9ccb4)] bg-white p-6 max-[640px]:p-5 [&_h2]:m-0 [&_h2]:mb-[18px] [&_h2]:border-b [&_h2]:border-[var(--line,#d9ccb4)] [&_h2]:pb-3 [&_h2]:font-[family-name:var(--font-display)] [&_h2]:text-[0.72rem] [&_h2]:font-medium [&_h2]:tracking-[0.08em] [&_h2]:text-[var(--ink,#241f1b)] [&_h2]:uppercase";

export const ocCardCount = "font-normal text-[var(--ink-2,#5b5148)]";

export const ocSteps =
  "m-0 grid list-none grid-cols-5 p-0 max-[640px]:grid-cols-1 max-[640px]:gap-3.5";

export const ocStep =
  "group/step relative flex flex-col items-center gap-1 px-1 text-center before:absolute before:top-2 before:right-1/2 before:h-0.5 before:w-full before:bg-[var(--line,#d9ccb4)] before:content-[''] first:before:hidden data-[status=current]:before:bg-copper data-[status=done]:before:bg-copper max-[640px]:grid max-[640px]:grid-cols-[18px_1fr] max-[640px]:items-center max-[640px]:gap-x-3 max-[640px]:text-left max-[640px]:before:top-auto max-[640px]:before:bottom-1/2 max-[640px]:before:left-2 max-[640px]:before:h-[calc(100%+14px)] max-[640px]:before:w-0.5";

export const ocStepDot =
  "relative z-[1] mb-1.5 size-[18px] rounded-full border-2 border-[var(--line,#d9ccb4)] bg-white group-data-[status=current]/step:border-copper group-data-[status=current]/step:shadow-[0_0_0_4px_rgba(140,68,53,0.14)] group-data-[status=current]/step:after:absolute group-data-[status=current]/step:after:inset-[3px] group-data-[status=current]/step:after:rounded-full group-data-[status=current]/step:after:bg-copper group-data-[status=current]/step:after:content-[''] group-data-[status=done]/step:border-copper group-data-[status=done]/step:bg-copper group-data-[status=done]/step:bg-[length:12px] group-data-[status=done]/step:bg-center group-data-[status=done]/step:bg-no-repeat group-data-[status=done]/step:bg-[url('data:image/svg+xml,%3Csvg_xmlns=%27http://www.w3.org/2000/svg%27_viewBox=%270_0_16_16%27_fill=%27none%27_stroke=%27white%27_stroke-width=%272.4%27_stroke-linecap=%27round%27_stroke-linejoin=%27round%27%3E%3Cpath_d=%27M4_8.5l2.5_2.5L12_5.5%27/%3E%3C/svg%3E')] max-[640px]:row-span-2 max-[640px]:m-0";

export const ocStepLabel =
  "text-[0.72rem] font-medium text-[var(--ink,#241f1b)] group-data-[status=todo]/step:text-[var(--ink-2,#5b5148)]";

export const ocStepHint =
  "text-[0.64rem] leading-[1.4] text-[var(--ink-2,#5b5148)] max-[640px]:col-start-2";

export const ocLines = "m-0 list-none p-0";

export const ocLine =
  "grid grid-cols-[56px_minmax(0,1fr)_auto] items-center gap-3.5 border-t border-[#efe5d6] py-3.5 first:border-t-0 first:pt-0 last:pb-0";

export const ocLineMedia =
  "grid size-14 place-items-center overflow-hidden rounded-[var(--radius-lg,4px)] bg-[var(--cream-2,#f3ece0)] font-[family-name:var(--font-display)] text-[1.1rem] text-copper [&_img]:size-full [&_img]:object-contain";

export const ocLineBody = "flex min-w-0 flex-col gap-[3px]";

export const ocLineName = "text-[0.85rem] font-medium text-[var(--ink,#241f1b)]";

export const ocLineSub = "text-[0.72rem] text-[var(--ink-2,#5b5148)]";

export const ocLineDiscount = "text-[0.72rem] text-[var(--ink-2,#5b5148)]";

export const ocLinePrice = "text-[0.85rem] font-medium whitespace-nowrap text-copper";

export const ocAddress =
  "oc-address [:is(.oc-address)+&]:mt-4 [&_address]:text-[0.82rem] [&_address]:leading-[1.6] [&_address]:text-[var(--ink,#241f1b)] [&_address]:not-italic [&_address_span]:block [&_h3]:m-0 [&_h3]:mb-1 [&_h3]:text-[0.6rem] [&_h3]:font-medium [&_h3]:tracking-[0.1em] [&_h3]:text-[var(--ink-2,#5b5148)] [&_h3]:uppercase";

export const ocAddressName = "font-medium";

export const ocAddressSame = "m-0 text-[0.82rem] text-[var(--ink-2,#5b5148)]";

export const ocMethods =
  "mt-[18px] grid grid-cols-2 gap-3 border-t border-[var(--line,#d9ccb4)] pt-4 [&_dt]:m-0 [&_dt]:mb-1 [&_dt]:text-[0.6rem] [&_dt]:font-medium [&_dt]:tracking-[0.1em] [&_dt]:text-[var(--ink-2,#5b5148)] [&_dt]:uppercase [&_dd]:m-0 [&_dd]:text-[0.82rem] [&_dd]:text-[var(--ink,#241f1b)]";

export const stripePayBrands =
  "ms-auto text-[0.62rem] tracking-[0.06em] text-[var(--ink-2,#5b5148)] uppercase";

export const stripePayElementLoading =
  "pointer-events-none absolute h-px w-px overflow-hidden opacity-0";

export const stripePayState =
  "flex min-h-[260px] flex-col items-center justify-center gap-3.5 px-0 py-6 text-center";

export const stripePaySummaryState = "min-h-[180px]";

export const stripePayStateTitle =
  "mt-1 mb-0 font-[family-name:var(--font-display)] text-[0.95rem] text-[var(--ink,#241f1b)]";

export const stripePayTrust =
  "m-0 flex items-center justify-center gap-2 text-center text-[0.74rem] leading-[1.5] text-[var(--ink-2,#5b5148)] [&_svg]:shrink-0 [&_svg]:text-[#2f7d4a]";

export const stripePayOrderNo =
  "-mt-1 mb-3.5 text-[0.7rem] tracking-[0.04em] text-[var(--ink-2,#5b5148)] uppercase [&_span]:font-medium [&_span]:text-[var(--ink,#241f1b)]";
