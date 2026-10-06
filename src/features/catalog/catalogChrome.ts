/** Tailwind stand-ins for the catalog filter rail, toolbar, and empty state. */

export const catalogLayout =
  "grid items-start gap-[clamp(2rem,3.5vw,4rem)] grid-cols-[clamp(200px,17vw,250px)_minmax(0,1fr)] max-[860px]:grid-cols-1";

export const catalogMain = "min-w-0";

export const filtersBackdrop = (open: boolean) =>
  `hidden border-0 p-0 max-[860px]:fixed max-[860px]:inset-0 max-[860px]:z-[190] max-[860px]:block max-[860px]:bg-[rgba(20,10,6,0.45)] max-[860px]:transition-opacity ${
    open
      ? "max-[860px]:pointer-events-auto max-[860px]:visible max-[860px]:opacity-100"
      : "max-[860px]:pointer-events-none max-[860px]:invisible max-[860px]:opacity-0"
  }`;

export const filtersRail = (open: boolean) =>
  `sticky top-[calc(var(--site-header-h,9.25rem)+1rem)] self-start pb-6 max-[860px]:fixed max-[860px]:inset-x-0 max-[860px]:top-auto max-[860px]:bottom-0 max-[860px]:z-[200] max-[860px]:m-0 max-[860px]:flex max-[860px]:w-full max-[860px]:max-h-[min(85vh,640px)] max-[860px]:flex-col max-[860px]:overflow-hidden max-[860px]:rounded-t-2xl max-[860px]:border max-[860px]:border-b-0 max-[860px]:border-[var(--line)] max-[860px]:bg-[var(--cream,#faf6ee)] max-[860px]:p-0 max-[860px]:shadow-[0_-16px_48px_rgba(10,6,3,0.28)] max-[860px]:transition-transform ${
    open
      ? "max-[860px]:pointer-events-auto max-[860px]:visible max-[860px]:translate-y-0"
      : "max-[860px]:pointer-events-none max-[860px]:invisible max-[860px]:translate-y-[110%]"
  }`;

export const filtersHead =
  "mb-[var(--sp-3)] flex items-center justify-between gap-3 max-[860px]:relative max-[860px]:z-[1] max-[860px]:m-0 max-[860px]:border-b max-[860px]:border-[var(--line)] max-[860px]:bg-[var(--cream,#faf6ee)] max-[860px]:px-5 max-[860px]:pt-4 max-[860px]:pb-[0.85rem]";

export const filtersTitle = "m-0 font-[family-name:var(--font-display)] text-[1.15rem] font-medium";

export const filtersClose =
  "hidden size-9 cursor-pointer items-center justify-center rounded-full border border-[var(--line,rgba(36,31,27,0.16))] bg-white p-0 text-[var(--ink,#241f1b)]! [&_svg]:block [&_svg]:size-4 max-[860px]:relative max-[860px]:z-[2] max-[860px]:inline-flex! max-[860px]:size-10 max-[860px]:border-[rgba(36,31,27,0.18)] max-[860px]:shadow-[0_1px_2px_rgba(10,6,3,0.06)] max-[860px]:[&_svg]:size-[18px]";

export const filtersBody =
  "min-w-0 max-[860px]:min-h-0 max-[860px]:flex-1 max-[860px]:overflow-x-hidden max-[860px]:overflow-y-auto max-[860px]:overscroll-contain max-[860px]:px-5 max-[860px]:pt-4 max-[860px]:pb-5";

export const filtersGroup = "mt-[var(--sp-4)] first:mt-0";

export const filtersLabel =
  "mb-[0.45rem] text-[0.65rem] font-semibold tracking-[var(--tracking-mid)] text-copper uppercase";

export const filtersList = "m-0 list-none p-0";

export const railFilter =
  "block w-full cursor-pointer border-0 border-s border-[var(--line)] bg-transparent py-[0.32rem] ps-3 text-start text-[0.84rem] font-[inherit] text-[var(--ink-2,#6b5f53)]! transition-colors hover:border-s-[var(--copper)] hover:text-[var(--ink)]! aria-pressed:border-s-2 aria-pressed:border-[var(--copper)] aria-pressed:ps-[calc(0.75rem-1px)] aria-pressed:font-semibold! aria-pressed:text-[var(--ink)]!";

export const railFilterCount = "text-[0.72rem] font-normal text-[var(--ink-2,#a09280)]";

export const filtersFoot =
  "hidden max-[860px]:block max-[860px]:flex-none max-[860px]:border-t max-[860px]:border-[var(--line)] max-[860px]:bg-[var(--cream,#faf6ee)] max-[860px]:px-5 max-[860px]:pt-[0.85rem] max-[860px]:pb-[calc(0.85rem+env(safe-area-inset-bottom,0px))]";

export const filtersApply =
  "inline-flex min-h-12 w-full cursor-pointer items-center justify-center rounded-full border border-copper bg-copper px-5 py-3 text-[0.82rem] font-semibold tracking-[0.06em] text-white! uppercase transition-colors hover:border-copper-deep hover:bg-copper-deep";

export const priceRange = "mt-[0.2rem]";

export const priceValues = "mb-2 flex justify-between gap-2 text-[0.76rem] text-[var(--ink-2,#6b5f53)] [&_strong]:font-semibold [&_strong]:text-[var(--ink)]";

export const priceSlider = "relative h-7";

export const priceTrack =
  "pointer-events-none absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-[var(--line)]";

export const priceFill =
  "pointer-events-none absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-copper";

export const priceInput =
  "pointer-events-none absolute inset-x-0 top-0 m-0 h-7 w-full appearance-none bg-transparent [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:border-0 [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:mt-[-6px] [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-copper [&::-webkit-slider-thumb]:shadow-[0_0_0_1px_var(--copper)] [&::-moz-range-track]:h-1 [&::-moz-range-track]:border-0 [&::-moz-range-track]:bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-copper [&::-moz-range-thumb]:shadow-[0_0_0_1px_var(--copper)]";

export const toolbar =
  "flex flex-nowrap items-center justify-between gap-[var(--sp-3)] pb-[var(--sp-4)] max-[860px]:flex-wrap max-[860px]:gap-x-2 max-[860px]:gap-y-[0.65rem]";

export const filtersButton =
  "hidden cursor-pointer items-center gap-[0.4rem] rounded-full border border-[var(--line)] bg-white px-4 text-[0.82rem] font-semibold tracking-[0.04em] text-[var(--ink)]! max-[860px]:inline-flex max-[860px]:min-h-9 max-[860px]:px-[0.85rem] max-[860px]:text-[0.78rem]";

export const catalogCount =
  "m-0 min-w-0 flex-1 truncate text-[0.9rem] text-[var(--ink-2,#6b5f53)] max-[860px]:ms-auto max-[860px]:text-end max-[860px]:text-[0.78rem]";

export const catalogSort =
  "inline-flex min-w-0 flex-none items-center gap-[0.6rem] max-[860px]:flex max-[860px]:w-full max-[860px]:max-w-full max-[860px]:flex-[1_1_100%] max-[860px]:gap-2";

export const catalogSortLabel =
  "text-[0.6875rem] font-semibold tracking-[var(--tracking-mid)] text-copper uppercase";

const sortChevron =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none'%3E%3Cpath d='M2.5 4.5L6 8l3.5-3.5' stroke='%238c4435' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")";

export const catalogSortSelect =
  "max-w-[9.5rem] min-h-8 min-w-0 cursor-pointer appearance-none rounded-full border border-white/70 bg-white/55 bg-no-repeat py-[0.2rem] ps-[0.7rem] pe-[1.85rem] text-[0.78rem] font-medium font-[inherit] text-[var(--ink,#241f1b)] shadow-[0_8px_24px_-10px_rgba(10,6,3,0.18),inset_0_1px_0_rgba(255,255,255,0.85),inset_0_-1px_0_rgba(36,31,27,0.04)] [background-position:right_0.65rem_center] [background-size:10px] backdrop-blur-[18px] transition-[border-color,background-color,box-shadow] hover:border-[rgba(140,68,53,0.35)] hover:bg-white/70 focus:border-copper focus:bg-white/80 focus:shadow-[0_10px_28px_-10px_rgba(10,6,3,0.22),0_0_0_3px_rgba(140,68,53,0.14),inset_0_1px_0_rgba(255,255,255,0.9)] focus:outline-none max-[860px]:max-w-none max-[860px]:min-h-10 max-[860px]:w-full max-[860px]:flex-1 max-[860px]:rounded-xl max-[860px]:py-[0.45rem] max-[860px]:ps-[0.9rem] max-[860px]:pe-[2.25rem] max-[860px]:text-base max-[860px]:[background-position:right_0.85rem_center] max-[860px]:[background-size:11px] [&_option]:bg-white [&_option]:text-[var(--ink,#241f1b)]";

export const catalogSortSelectStyle = { backgroundImage: sortChevron };

export const emptyState =
  "mx-auto flex max-w-[460px] flex-col items-center px-4 py-[clamp(2.5rem,6vw,4.5rem)] pb-[clamp(3rem,7vw,5rem)] text-center";

export const emptyArt = "mb-6 h-auto w-[clamp(140px,22vw,180px)] opacity-90";

export const emptyEyebrow =
  "mb-2 text-[0.66rem] font-semibold tracking-[var(--tracking-mid,0.12em)] text-copper uppercase";

export const emptyTitle =
  "m-0 font-[family-name:var(--font-display)] text-[clamp(1.35rem,2.6vw,1.75rem)] font-normal text-[var(--ink)]";

export const emptyText = "mt-3 text-[0.9rem] leading-[1.65] text-[var(--ink-2)]";

export const emptyCta =
  "mt-7 inline-flex min-h-12 items-center justify-center rounded-full border border-copper bg-copper px-7 text-[0.7rem] font-medium tracking-[0.06em] text-white! uppercase no-underline transition-colors hover:bg-copper-deep";

export const gridEmpty = "py-[var(--sp-6)] text-center text-base text-[var(--ink-2,#6b5f53)]";
