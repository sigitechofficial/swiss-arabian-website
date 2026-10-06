/** Tailwind stand-ins for the product detail page. */

const play = "group-data-[reveal=play]:";

export const pdpHero =
  "group relative flex items-start pt-3 pb-0";

export const pdpSplit =
  "grid w-full grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] items-start gap-[clamp(1.5rem,4vw,4rem)] max-[1023px]:grid-cols-1 max-[1023px]:gap-8";

export const pdpStage =
  "flex min-w-0 flex-row items-stretch justify-center gap-3 overflow-clip [--bottle-h:min(62svh,500px)] max-[767px]:[--bottle-h:min(52svh,420px)] min-[1024px]:sticky min-[1024px]:top-[var(--site-header-h,9.25rem)] min-[1024px]:self-start";

export const pdpProduct =
  "relative flex w-full min-w-0 items-center justify-center [--bottle-h:inherit]";

export const pdpFrame =
  "relative z-[1] h-[var(--bottle-h)] w-full overflow-hidden rounded-[4px] border-[0.5px] border-[var(--line,#d9ccb4)]";

export const pdpBottle =
  `absolute inset-0 h-full w-full object-cover filter-[drop-shadow(0_20px_40px_rgb(70_45_25/0.28))] ${play}animate-pdp-bottle ${play}opacity-0 motion-reduce:transform-none motion-reduce:animate-none! motion-reduce:opacity-100! motion-reduce:filter-[drop-shadow(0_20px_40px_rgb(70_45_25/0.28))]!`;

export const pdpGlow =
  `pointer-events-none absolute top-1/2 left-1/2 z-0 mt-[calc(var(--bottle-h)*-0.75)] ml-[calc(var(--bottle-h)*-0.75)] aspect-square w-[calc(var(--bottle-h)*1.5)] rounded-full bg-[radial-gradient(circle,rgba(255,248,235,0.55)_0%,rgba(235,222,198,0.22)_40%,rgba(235,222,198,0)_70%)] blur-[26px] ${play}animate-pdp-glow ${play}opacity-0 motion-reduce:animate-none! motion-reduce:opacity-100! motion-reduce:transform-none`;

export const pdpFloor =
  "pointer-events-none absolute bottom-[calc(var(--bottle-h)*-0.03)] left-1/2 z-0 h-[calc(var(--bottle-h)*0.1)] w-[calc(var(--bottle-h)*0.62)] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,rgb(232_213_174/0.26)_0%,rgb(232_213_174/0.08)_45%,rgb(232_213_174/0)_72%)] blur-[10px]";

export const pdpMist =
  `pointer-events-none absolute inset-0 z-[2] opacity-0 ${play}opacity-100 motion-reduce:hidden`;

const puff =
  "absolute left-[49%] aspect-square scale-[0.2] rounded-full bg-[radial-gradient(circle,rgba(255,252,246,0.6)_0%,rgba(255,250,240,0.28)_42%,rgba(255,250,240,0)_70%)] opacity-0";
const puffSize =
  "top-[1%] w-[calc(var(--bottle-h)*0.55)] mt-[calc(var(--bottle-h)*-0.275)] ml-[calc(var(--bottle-h)*-0.275)] blur-[14px]";

export const puffA = `${puff} ${puffSize} ${play}animate-pdp-puff-a`;
export const puffB = `${puff} ${puffSize} ${play}animate-pdp-puff-b`;
export const puffC = `${puff} ${puffSize} ${play}animate-pdp-puff-c`;
export const puffD = `${puff} ${puffSize} ${play}animate-pdp-puff-d`;
export const puffE = `${puff} ${puffSize} ${play}animate-pdp-puff-e`;
export const puffCore =
  `${puff} top-[1%] w-[calc(var(--bottle-h)*0.4)] mt-[calc(var(--bottle-h)*-0.2)] ml-[calc(var(--bottle-h)*-0.2)] blur-[9px] ${play}animate-pdp-puff-core`;
export const puffVeil =
  `${puff} top-[55%] w-[calc(var(--bottle-h)*1.25)] mt-[calc(var(--bottle-h)*-0.625)] ml-[calc(var(--bottle-h)*-0.625)] blur-[28px] ${play}animate-pdp-puff-veil`;

export const thumbsCol =
  "z-[3] flex w-14 max-h-[var(--bottle-h,min(62svh,500px))] flex-none flex-col items-center";

export const thumbs =
  "flex min-h-0 w-full flex-1 flex-col flex-nowrap items-center gap-[0.45rem] overflow-x-hidden overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [mask-image:linear-gradient(to_bottom,#000_0%,#000_calc(100%-52px),transparent_100%)] [&::-webkit-scrollbar]:hidden";

export const thumb =
  "block size-[52px] flex-none cursor-pointer overflow-hidden rounded-[6px] border border-[rgb(36_31_27/0.14)] bg-[#f4ead8] p-0 text-[#2a201a]! transition-[border-color,box-shadow] duration-200 ease-linear focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-copper";

export const thumbActive = "border-copper shadow-[0_0_0_1px_var(--copper)]";

export const thumbImg = "block h-full w-full object-cover";

export const thumbsNext =
  "mt-[-0.35rem] flex size-7 flex-none cursor-pointer items-center justify-center rounded-full border border-[rgb(36_31_27/0.12)] bg-[rgb(255_252_247/0.72)] p-0 text-[var(--ink,#241f1b)]! shadow-[0_4px_12px_rgb(70_45_25/0.08)] hover:border-copper! hover:text-copper! focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-copper [&_svg]:size-4";

export const pdpPanel =
  "relative z-[3] flex max-w-[34rem] flex-col gap-4 text-[#2a201a] max-[1023px]:max-w-none";

export const pdpName =
  "m-0 font-[family-name:var(--font-display)] text-[clamp(1.75rem,3.2vw,2.5rem)] leading-[1.05] font-normal tracking-[-0.01em] text-[#2a201a]";

export const pdpFormat = "m-0 text-[0.9375rem] text-[#6f6152]";

export const pdpRating =
  "mb-[0.7rem] inline-flex items-center gap-2 text-[0.78rem] text-[#6f6152] no-underline hover:text-copper [&_strong]:font-semibold [&_strong]:text-[#2a201a]";

export const pdpChips = "m-0 flex list-none flex-wrap gap-2 p-0";

export const pdpChip =
  "inline-flex items-center gap-[0.4375rem] rounded-full border border-[var(--line,#d9ccb4)] bg-white px-[0.875rem] py-[0.4375rem] text-[0.8125rem] text-[#2a201a]";

export const pdpDot = "size-[9px] flex-none rounded-full";

export const pdpInstallments = "m-0 text-[0.8125rem] text-[#6f6152] [&_strong]:text-[#2a201a]";

export const pdpPromises = "m-0 list-none p-0";

export const pdpPromise =
  "flex items-start gap-[0.625rem] py-[0.45rem] text-[0.8125rem] text-[#6f6152] [&_strong]:text-[#2a201a] [&_svg]:size-5 [&_svg]:shrink-0 [&_svg]:text-copper";

export const pdpStatus = "m-0 min-h-5 text-[0.8125rem] text-copper";

export const buySlot = "max-[767px]:block";

export const pdpBuy =
  "m-0 flex flex-wrap gap-3 max-[767px]:z-40 max-[767px]:-mx-[var(--chrome-edge,1rem)] max-[767px]:flex-nowrap max-[767px]:gap-2 max-[767px]:border-t max-[767px]:border-[var(--line,#d9ccb4)] max-[767px]:bg-[var(--cream,#faf6ee)] max-[767px]:px-[var(--chrome-edge,1rem)] max-[767px]:pt-[0.625rem] max-[767px]:pb-[calc(0.625rem+env(safe-area-inset-bottom,0px))]";

export const pdpBuyDocked =
  "max-[767px]:fixed max-[767px]:inset-x-0 max-[767px]:bottom-0 max-[767px]:m-0 max-[767px]:box-border max-[767px]:w-full";

export const pdpQty =
  "inline-flex flex-none items-center rounded-full border border-[var(--line,#d9ccb4)] bg-white max-[767px]:flex-none";

export const pdpQtyBtn =
  "inline-flex h-12 w-11 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 text-[#2a201a]! disabled:cursor-not-allowed disabled:text-[rgba(42,32,26,0.35)]! max-[767px]:h-11 max-[767px]:w-[38px] [&_svg]:size-[18px]";

export const pdpQtyValue = "min-w-[2ch] text-center text-base font-medium text-[#2a201a]";

export const pdpAdd =
  "min-h-12 flex-[1_1_12rem] cursor-pointer rounded-full border border-copper! bg-copper! px-6 text-[0.8125rem]! font-medium! tracking-[var(--tracking-mid,0.08em)] text-white! uppercase transition-[background-color,border-color] duration-[var(--dur,0.4s)] ease-[var(--ease,ease)] hover:border-copper-deep! hover:bg-copper-deep! disabled:cursor-not-allowed disabled:opacity-55 max-[767px]:min-w-0 max-[767px]:flex-[1_1_auto] max-[767px]:px-3 max-[767px]:text-[0.75rem]!";

export const pdpWish =
  "inline-flex size-12 flex-none cursor-pointer items-center justify-center rounded-full border border-[var(--line,#d9ccb4)] bg-white text-[#2a201a]! transition-[border-color,color] duration-[var(--dur,0.4s)] ease-[var(--ease,ease)] hover:border-[#2a201a] aria-pressed:border-[#d4576f]! aria-pressed:text-[#d4576f]! max-[767px]:size-11 [&_svg]:size-[22px] aria-pressed:[&_svg]:fill-current";

export const composition =
  "bg-[var(--cream,#faf6ee)] py-16 text-[var(--ink,#241f1b)]";

export const compositionEyebrow =
  "text-[0.75rem] font-semibold tracking-[var(--tracking-wide,0.18em)] text-copper uppercase";

export const compositionTitle =
  "mt-2 font-[family-name:var(--font-display)] text-[clamp(1.85rem,3vw,2.65rem)] leading-[1.05] font-normal tracking-[-0.02em]";

export const compositionEm = "text-inherit not-italic";

export const compositionIntro =
  "mt-6 max-w-[58ch] text-[1.0625rem] leading-[1.75] text-[var(--ink-2,#5b5148)]";

export const compTabs =
  "my-8 flex flex-wrap gap-x-[0.4rem] gap-y-[0.35rem] border-b border-[var(--line,#d9ccb4)] max-[767px]:hidden";

export const compTab =
  "mb-[-1px] cursor-pointer appearance-none rounded-t-[6px] border-0 border-b-[3px] border-transparent bg-transparent px-[0.95rem] pt-[0.7rem] pb-[0.75rem] text-[0.72rem]! font-semibold! tracking-[var(--tracking-mid,0.08em)] text-[var(--ink-2,#5b5148)]! uppercase transition-[color,border-color,background-color] duration-[var(--dur,0.4s)] ease-[var(--ease,ease)] hover:text-copper!";

export const compTabActive =
  "border-b-copper bg-[rgb(140_68_53/0.1)] font-bold! text-copper!";

export const compPanels = "max-w-[42rem] max-[767px]:max-w-none max-[767px]:border-t max-[767px]:border-[var(--line,#d9ccb4)]";

export const compItem = "max-[767px]:border-b max-[767px]:border-[var(--line,#d9ccb4)]";

export const compHeading = "m-0 hidden max-[767px]:block";

export const compAccBtn =
  "group flex min-h-12 w-full cursor-pointer appearance-none items-center justify-between gap-3 border-0 bg-transparent px-0 py-[0.85rem] text-start text-[0.72rem]! font-semibold! tracking-[var(--tracking-mid,0.08em)] text-[var(--ink,#241f1b)]! uppercase focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ink,#241f1b)]";

export const compMark =
  "w-[1em] flex-none text-[1.05rem] leading-none font-normal text-[var(--ink,#241f1b)] before:content-['+'] group-aria-expanded:before:content-['-']";

export const compPanel = "block max-[767px]:pb-4 [&_p]:m-0 [&_p]:text-base [&_p]:leading-[1.75] [&_p]:text-[var(--ink-2,#5b5148)]";

export const notes = "m-0 list-none p-0";

export const notesRow =
  "grid grid-cols-[5rem_minmax(0,1fr)] items-baseline gap-x-6 gap-y-1 border-t border-[var(--line,#d9ccb4)] py-3 first:border-t-0 [&_p]:m-0";

export const notesLevel =
  "text-[0.6875rem] font-semibold tracking-[0.16em] text-copper uppercase";

export const notesNames =
  "font-[family-name:var(--font-display)] text-[clamp(1.125rem,1.7vw,1.5rem)] tracking-[-0.01em] text-[var(--ink,#241f1b)]";

export const notesBar =
  "relative col-start-2 mt-2 h-0.5 bg-[rgb(27_22_16/0.1)] after:absolute after:inset-y-0 after:left-0 after:w-[var(--bar,50%)] after:bg-copper after:content-['']";

export const notesKey = "mt-3 text-[0.75rem] text-[var(--ink-2,#5b5148)]";

export const specs =
  "m-0 p-0 [&_dt]:m-0 [&_dt]:text-[0.6875rem] [&_dt]:font-semibold [&_dt]:tracking-[0.14em] [&_dt]:text-copper [&_dt]:uppercase [&_dd]:m-0 [&_dd]:text-end [&_dd]:text-[0.9375rem] [&_dd]:text-[var(--ink,#241f1b)]";

export const specsRow =
  "flex items-baseline justify-between gap-4 border-t border-[var(--line,#d9ccb4)] py-[0.875rem] first:border-t-0";

export const pdpCode = "mt-8 text-[0.75rem] text-[var(--ink-2,#5b5148)]";

export const reviews =
  "scroll-mt-[calc(var(--site-header-h,9.25rem)+12px)] bg-[var(--cream,#faf6ee)] py-16 text-[var(--ink,#241f1b)]";

export const reviewsHead = "mb-8 flex flex-wrap items-baseline justify-between gap-6";

export const reviewsCopy = "min-w-0 flex-[1_1_16rem]";

export const reviewsTitle =
  "mt-2 font-[family-name:var(--font-display)] text-[clamp(1.6rem,2.6vw,2.3rem)] leading-[1.1] font-normal tracking-[-0.02em]";

export const reviewsEmpty = "m-0 max-w-[42ch] text-[0.95rem] leading-[1.6] text-[var(--ink-2,#6b5f53)]";

export const reviewsActions = "flex flex-none items-center gap-4";

export const reviewsWrite =
  "m-0 cursor-pointer border-0 border-b border-[rgb(116_83_39/0.45)] bg-transparent px-0 pt-0 pb-[2px] text-[0.62rem]! font-semibold! tracking-[var(--tracking-mid,0.08em)] text-copper! uppercase transition-[border-color] duration-[var(--dur,0.4s)] ease-[var(--ease,ease)] hover:border-b-copper hover:bg-transparent hover:text-copper!";

export const reviewsList =
  "m-0 flex list-none gap-3 overflow-x-auto overflow-y-hidden scroll-smooth p-0 pb-[0.35rem] [scrollbar-width:none] snap-x snap-mandatory [&::-webkit-scrollbar]:hidden";

export const reviewsItem =
  "flex min-h-[8.5rem] w-[16.5rem] flex-none snap-start flex-col gap-[0.45rem] rounded-lg bg-[#f3f0ea] px-4 py-[0.9rem] max-[767px]:w-[14.5rem]";

export const reviewsCardTitle = "m-0 mb-[0.35rem] text-[0.95rem] font-semibold";

export const reviewsBody = "m-0 line-clamp-3 text-[0.78rem] leading-[1.45] font-normal text-[var(--ink,#241f1b)]";

export const reviewsMeta =
  "mt-auto text-[0.6rem] font-medium tracking-[0.06em] text-[var(--ink-2,#5b5148)] uppercase";

export const reviewsNav = "m-0 flex items-center gap-[0.35rem] [&_button]:inline-flex [&_button]:size-[1.7rem] [&_button]:cursor-pointer [&_button]:items-center [&_button]:justify-center [&_button]:rounded-full [&_button]:border [&_button]:border-[var(--line,#d9ccb4)] [&_button]:bg-transparent [&_button]:p-0 [&_button]:leading-none [&_button]:text-[var(--ink,#241f1b)]! [&_button:hover]:border-copper! [&_button:hover]:text-copper! [&_svg]:size-[0.85rem]";

export const reviewForm =
  "mb-6 w-full rounded-[4px] border border-[var(--line,#d9ccb4)] bg-white px-[1.4rem] pt-[1.35rem] pb-[1.25rem] [&_label>span:first-child]:text-[0.62rem]! [&_label>span:first-child]:font-medium! [&_label>span:first-child]:tracking-[0.06em]! [&_label>span:first-child]:text-[var(--ink-2,#5b5148)]! [&_label>span:first-child]:uppercase [&_input]:min-h-[46px] [&_input]:bg-[#fffdf8] [&_input]:px-[14px]! [&_input]:py-[0.7rem]! [&_textarea]:min-h-[120px]! [&_textarea]:resize-y [&_textarea]:bg-[#fffdf8] [&_textarea]:px-[14px]! [&_textarea]:py-[0.7rem]!";

export const reviewIntro = "mb-[1.15rem] border-b border-[var(--line,#d9ccb4)] pb-4 [&_h3]:m-0 [&_h3]:mb-[0.3rem] [&_h3]:text-[1.05rem] [&_h3]:font-semibold [&_p]:m-0 [&_p]:text-[0.85rem] [&_p]:text-[var(--ink-2,#5b5148)]";

export const reviewGrid = "grid grid-cols-2 gap-x-[1.1rem] gap-y-4 max-[767px]:grid-cols-1";

export const reviewRating = "flex gap-[0.2rem]";

export const reviewStar =
  "size-9 cursor-pointer border-0 bg-transparent p-0 text-[1.35rem] leading-none text-[var(--line,#d9ccb4)]!";

export const reviewStarOn = "text-[var(--gold,#b98a4b)]!";

export const reviewFoot =
  "mt-[1.15rem] flex flex-wrap items-center justify-between gap-4 border-t border-[var(--line,#d9ccb4)] pt-4 [&_p]:m-0 [&_p]:max-w-[36rem] [&_p]:text-[0.75rem] [&_p]:text-[var(--ink-2,#5b5148)]";

export const reviewSubmit =
  "min-h-11 cursor-pointer rounded-full border-0 bg-copper! px-[1.4rem] text-[0.78rem]! font-medium! tracking-[0.08em] text-white! uppercase hover:bg-copper-deep!";

export const reviewErr = "text-[0.72rem] text-[#b42318]";

export const related =
  "bg-[var(--cream-2,#f3ebda)] py-16";

export const relatedHead = "mb-8 flex items-baseline justify-between gap-6";

export const relatedTitle =
  "m-0 font-[family-name:var(--font-display)] text-[clamp(1.6rem,2.6vw,2.3rem)] leading-[1.1] font-normal tracking-[-0.02em] text-[var(--ink,#241f1b)]";

export const relatedEm = "text-inherit not-italic";

export const relatedAll =
  "flex-none border-b border-[rgb(116_83_39/0.45)] pb-[2px] text-[0.8125rem] font-semibold tracking-[var(--tracking-mid,0.08em)] text-copper uppercase no-underline transition-[border-color] duration-[var(--dur,0.4s)] ease-[var(--ease,ease)] hover:border-b-copper";

export const relatedGrid =
  "m-0 grid list-none grid-cols-4 gap-x-[clamp(1.25rem,2vw,2rem)] gap-y-[clamp(2rem,3vw,3rem)] p-0 max-[900px]:grid-cols-2 max-[480px]:gap-x-3 max-[480px]:gap-y-5";

export const pdpOos = "flex min-w-0 flex-col gap-3";

export const pdpOosMessage = "m-0";

export const videoFrame =
  "fixed right-5 bottom-6 z-[80] aspect-[3/4.15] w-[210px] origin-bottom-right overflow-hidden rounded-[18px] bg-[#1a1510] shadow-[0_16px_40px_rgb(0_0_0/0.28)] transition-[width,border-radius] duration-[0.45s] ease-[cubic-bezier(0.22,1,0.36,1)] max-[767px]:right-3 max-[767px]:bottom-[calc(88px+env(safe-area-inset-bottom,0px))] max-[767px]:w-[132px] max-[767px]:rounded-[14px]";

export const videoExpanded =
  "w-[min(320px,calc(100vw-32px))] max-[767px]:w-[min(220px,calc(100vw-24px))]";

export const videoEl = "block h-full w-full object-cover";

export const videoBtn =
  "absolute grid size-8 cursor-pointer place-items-center border-0 bg-transparent p-0 text-white! focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white [&_svg]:size-4 [&_svg]:text-white [&_svg]:drop-shadow-[0_1px_2px_rgb(0_0_0/0.55)]";

export const videoClose = `${videoBtn} top-1.5 right-1.5`;

export const videoExpand = `${videoBtn} bottom-1.5 left-1.5`;
