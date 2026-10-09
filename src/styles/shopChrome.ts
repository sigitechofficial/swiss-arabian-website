/** Tailwind stand-ins for breadcrumbs, collection heads, and the catalog grid. */

export const crumbs = "pt-[clamp(1.25rem,3vh,2rem)]";

export const cartCrumbs = "pt-[clamp(1.75rem,4.5vh,2.75rem)]";

const crumbItems =
  "m-0 flex list-none items-center gap-2 p-0 font-normal text-[var(--ink-2,#6b5f53)] [&_a]:text-inherit [&_a]:no-underline [&_a]:transition-colors [&_a]:duration-[var(--dur,0.4s)] [&_a]:ease-[var(--ease,ease)] [&_a:hover]:text-[var(--copper,#8c4435)] [&_li+li]:before:me-2 [&_li+li]:before:text-[var(--line,#d9ccb4)] [&_li+li]:before:content-['/'] [&_li[aria-current=page]]:text-[var(--ink,#241f1b)]";

export const crumbsList = `${crumbItems} text-[0.78rem] [&_li[aria-current=page]]:font-normal [&_li[aria-current=page]]:text-[var(--ink-2,#6b5f53)]`;

/** Same plain crumbs as every other page: the current page is not bolded or darkened. */
export const checkoutCrumbsList = crumbsList;

export const cartCrumbsList = crumbsList;

export const collectionHead = "bg-[var(--cream,#faf6ee)] pb-[clamp(2rem,4vw,3rem)]";

export const collectionHeadFlush = "bg-[var(--cream,#faf6ee)] pb-0";

export const collectionHero =
  "mt-[clamp(1rem,2.5vh,1.75rem)] grid grid-cols-[minmax(0,5fr)_minmax(0,7fr)] overflow-hidden rounded-[4px] border border-[var(--line,#d9ccb4)] bg-white max-[860px]:grid-cols-1";

export const collectionHeroMedia =
  "h-full max-h-[clamp(360px,48vh,480px)] min-h-[clamp(280px,36vh,420px)] w-full object-cover object-[center_42%] max-[860px]:max-h-[320px] max-[860px]:min-h-[260px]";

export const collectionHeroPanel =
  "flex flex-col items-center justify-center gap-[0.15rem] bg-[var(--ink,#241f1b)] px-[clamp(1.5rem,4vw,4.5rem)] py-[clamp(2rem,3.5vw,3.5rem)] text-center text-[var(--cream,#faf6ee)]";

export const collectionEyebrow =
  "m-0 mb-3 text-[length:var(--fs-eyebrow,0.68rem)] font-semibold tracking-[var(--tracking-wide,0.18em)] text-[var(--beige,#e8d8bb)] uppercase";

export const checkoutEyebrow =
  "m-0 mb-3 text-[0.68rem] font-medium tracking-[0.08em] text-[var(--beige,#e8d8bb)] uppercase";

export const cartEyebrow =
  "m-0 mb-[0.85rem] text-[0.68rem] font-medium tracking-[0.08em] text-[var(--ink,#241f1b)] uppercase";

/** Eyebrow on cream confirmation / empty states (the page `p` color wins over beige). */
export const stateEyebrow =
  "m-0 mb-6 text-[0.68rem] font-medium tracking-[0.08em] text-[var(--ink-2,#5b5148)] uppercase";

export const ocEyebrow =
  "m-0 mb-[10px] text-[0.68rem] font-medium tracking-[0.08em] text-[var(--ink-2,#5b5148)] uppercase";

export const collectionTitle =
  "m-0 font-[family-name:var(--font-display)] text-[clamp(2rem,3.6vw,3.15rem)] leading-[1.08] font-medium tracking-[-0.01em]";

export const pageTitle =
  "m-0 font-[family-name:var(--font-display)] text-[clamp(1.45rem,2.2vw,1.85rem)] leading-[1.08] font-normal tracking-[-0.015em]";

export const doneTitle =
  "m-0 mb-3 font-[family-name:var(--font-display)] text-[clamp(1.45rem,3vw,2rem)] leading-[1.08] font-normal tracking-[-0.015em] text-[var(--ink,#241f1b)]";

export const ocTitle =
  "m-0 mb-3 font-[family-name:var(--font-display)] text-[clamp(1.7rem,3.2vw,2.4rem)] leading-[1.08] font-normal tracking-[-0.015em] text-[var(--ink,#241f1b)]";

export const collectionEm = "text-[var(--beige,#e8d8bb)] not-italic";

export const cartEm = "text-[var(--ink,#241f1b)] not-italic";

export const ocEm = "text-[var(--copper,#8c4435)] not-italic";

export const doneEm = "text-[var(--copper,#8c4435)] not-italic";

export const collectionIntro =
  "mt-[0.9rem] max-w-[52ch] text-[0.9375rem] leading-[1.7] text-[rgba(250,246,238,0.78)]";

export const cartLede =
  "mt-4 max-w-[48ch] text-[0.8rem] leading-[1.55] font-normal text-[var(--ink-2,#5b5148)]";

export const stateIntro =
  "m-0 mb-6 max-w-none text-[0.9375rem] leading-[1.7] text-[var(--ink-2,#5b5148)]";

export const gridBand = "bg-[var(--cream,#faf6ee)] pt-0 pb-[clamp(3rem,6vw,5rem)]";

export const productGrid =
  "m-0 grid list-none grid-cols-[repeat(3,minmax(0,268px))] gap-x-[clamp(1.25rem,2vw,2rem)] gap-y-[clamp(2rem,3vw,3rem)] pt-6 max-[1080px]:grid-cols-2 max-[560px]:grid-cols-2 max-[560px]:gap-x-4 max-[560px]:gap-y-6";

export const wishlistBand = "bg-transparent p-0";

export const wishlistGrid =
  "m-0 grid list-none grid-cols-[repeat(4,minmax(0,268px))] gap-x-[clamp(1.25rem,2vw,2rem)] gap-y-[clamp(2rem,3vw,3rem)] p-0 max-[1080px]:grid-cols-3 max-[860px]:grid-cols-2 max-[860px]:gap-x-4 max-[860px]:gap-y-6";

export const catalogOfferTile =
  "flex min-w-0 [&>a]:w-full [&>a]:flex-1 [&>article]:w-full [&>article]:flex-1";

export const searchProductGrid = `${productGrid} ![grid-template-columns:repeat(4,minmax(0,1fr))] max-[1080px]:![grid-template-columns:repeat(3,minmax(0,1fr))] max-[720px]:![grid-template-columns:repeat(2,minmax(0,1fr))]`;

export const offerProductGrid = `${productGrid} ![grid-template-columns:repeat(auto-fill,minmax(min(100%,200px),1fr))]`;
