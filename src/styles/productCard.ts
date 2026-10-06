/** Tailwind stand-ins for home, catalog, and trending product cards. */

const ingredients =
  "before:pointer-events-none before:absolute before:top-0 before:left-0 before:z-[4] before:aspect-[4/5] before:w-full before:origin-center before:scale-100 before:rounded-[4px] before:bg-center before:bg-no-repeat before:opacity-0 before:transition-[opacity,transform] before:duration-[0.6s] before:ease-[ease] before:will-change-[opacity,transform] before:content-[''] before:[background-image:var(--ingredients-bg)] before:[background-size:126%_auto] motion-reduce:before:transition-none [@media(hover:hover)_and_(pointer:fine)]:hover:before:scale-[1.02] [@media(hover:hover)_and_(pointer:fine)]:hover:before:opacity-100";

export const productCard = `group relative overflow-hidden ${ingredients}`;

export const gridCard = `${productCard} flex-none`;

export const stripCard = `${productCard} flex-[0_0_clamp(190px,20vw,260px)] snap-start motion-reduce:transform-none!`;

export const trendCard = `group relative flex flex-[0_0_clamp(190px,20vw,260px)] snap-start flex-col overflow-hidden motion-reduce:transform-none! ${ingredients}`;

const mediaFrame =
  "relative mb-4 aspect-[4/5] overflow-hidden rounded-[4px] bg-[linear-gradient(180deg,#ffffff_0%,#f1e7d4_100%)] shadow-[0_6px_20px_rgba(60,40,25,0.06)]";

export const cardMedia = `${mediaFrame} p-0`;

export const cardMediaInset = `${mediaFrame} p-[20%]`;

export const cardMediaSwap = "isolate";

export const trendMedia =
  "relative block aspect-[4/5] overflow-hidden rounded-[4px] bg-[linear-gradient(180deg,#ffffff_0%,#ece0c9_100%)] p-[20%]";

export const cardMediaLink = "block h-full w-full";

export const cardMediaLinkSwap = "relative block h-full w-full overflow-hidden";

export const cardImg =
  "h-full w-full object-cover p-0 mix-blend-normal transition-transform duration-[0.6s] ease-[var(--ease,ease)]";

export const cardImgSwap =
  "relative z-[1] h-full w-full object-cover p-0 mix-blend-normal transition-opacity duration-[0.6s] ease-[ease] will-change-[opacity] motion-reduce:transition-none [@media(hover:hover)_and_(pointer:fine)]:group-hover:opacity-0";

export const trendImg =
  "h-full w-full object-cover p-0 mix-blend-normal transition-transform duration-500 ease-[var(--ease,ease)] group-hover:scale-110 group-focus-within:scale-110";

export const trendImgSwap = cardImgSwap;

/** Card media: fill the frame and draw a lighter bottle mark than the placeholder plate. */
export const cardBottle = "aspect-auto! h-full! bg-none! after:w-[58%]! after:opacity-45!";

export const cardLink =
  "absolute inset-0 z-[1] rounded-[4px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-copper";

export const cardAddSlot = "pointer-events-none absolute top-0 left-0 aspect-[4/5] w-full";

export const cardAddButton =
  "group/add pointer-events-none absolute bottom-[0.6rem] left-1/2 z-[5] inline-flex max-w-[calc(100%-1.75rem)] translate-x-[-50%] translate-y-2 cursor-pointer items-center justify-center gap-[0.4rem] rounded-full border border-[rgba(42,35,28,0.08)] bg-[#fffaf3] px-[1.2rem] py-[0.7rem] text-[0.78rem]! font-semibold! tracking-[0.055em] whitespace-nowrap text-[#2a231c]! opacity-0 shadow-[0_10px_28px_rgba(42,28,16,0.14),0_1px_2px_rgba(42,28,16,0.05)] transition-[opacity,transform,background-color,color,border-color,box-shadow] duration-[var(--dur,0.4s)] ease-[var(--ease,ease)] group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100 hover:border-copper! hover:bg-copper! hover:text-white! focus-visible:border-copper! focus-visible:bg-copper! focus-visible:text-white! aria-pressed:border-copper! aria-pressed:bg-copper! aria-pressed:text-white! min-h-11 [&_svg]:size-4 [&_svg]:shrink-0 [@media(hover:none)]:pointer-events-auto [@media(hover:none)]:bottom-3 [@media(hover:none)]:translate-y-0 [@media(hover:none)]:px-[1.05rem] [@media(hover:none)]:py-[0.72rem] [@media(hover:none)]:opacity-100";

export const cardAddPlus = "group-aria-pressed/add:hidden";

export const cardAddCheck = "hidden group-aria-pressed/add:inline";

export const cardAction =
  "absolute top-[10px] right-[10px] z-[6] [&_button]:border-[var(--line,#d9ccb4)]! [&_button]:bg-[rgba(255,255,255,0.92)]! [&_button]:text-[var(--ink-2,#5b5148)]! [&_button:hover]:border-[var(--copper,#8c4435)]! [&_button:hover]:text-[var(--copper,#8c4435)]! [&_button[aria-pressed=true]]:border-[var(--copper,#8c4435)]! [&_button[aria-pressed=true]]:text-[var(--copper,#8c4435)]!";

export const cardTags =
  "pointer-events-none absolute top-3 z-[5] m-0 text-[0.56rem] inset-s-3 [&>span]:inline-block [&>span]:rounded-full [&>span]:bg-copper [&>span]:px-[0.72em] [&>span]:py-[0.34em] [&>span]:leading-[1.2] [&>span]:font-normal [&>span]:tracking-[0.12em] [&>span]:text-white [&>span]:uppercase";

/** Holds the merch pill and an offer pill in the same corner without stacking them on one point. */
export const cardTagStack =
  "pointer-events-none absolute top-3 z-[5] flex max-w-[calc(100%-1.5rem)] flex-col items-start gap-1.5 inset-s-3 [&_p]:static [&_p]:inset-auto [&_p]:top-auto";

/** Offer line under a merch pill. Cream, so it stays readable next to the copper Best Seller chip. */
export const cardOfferTag =
  "m-0 max-w-full text-[0.62rem] [&>span]:inline-block [&>span]:max-w-full [&>span]:rounded-full [&>span]:bg-[#fffdf8] [&>span]:px-[0.75em] [&>span]:py-[0.4em] [&>span]:leading-[1.25] [&>span]:font-semibold [&>span]:text-balance [&>span]:text-copper [&>span]:shadow-[0_1px_4px_rgba(36,31,27,0.1)] [&>span]:ring-1 [&>span]:ring-copper/25";

export const cardTagsNew = "[&>span]:bg-[#4c1d0d]";

export const cardName =
  "my-1 font-[family-name:var(--font-display)] text-[1.05rem] text-[var(--ink,#241f1b)]";

export const cardNameDense =
  "my-1 font-[family-name:var(--font-display)] text-[0.88rem] leading-[1.35] text-[var(--ink,#241f1b)] line-clamp-2";

export const cardPrice = "text-[0.8rem] font-semibold text-[var(--copper,#8c4435)]";

export const cardPriceDense = "text-[0.74rem] font-semibold text-[var(--copper,#8c4435)]";

export const relatedName = `${cardName} max-[480px]:text-[0.8125rem]`;

export const relatedPrice = `${cardPrice} max-[480px]:text-[0.75rem]`;

export const cardNote = "mt-[2px] text-[0.68rem] text-[var(--ink-2,#5b5148)]";

export const trendBody = "pt-4";

export const productStrip =
  "m-0 flex list-none items-stretch gap-[clamp(1rem,2vw,1.5rem)] overflow-x-auto p-0 [scrollbar-width:none] snap-x snap-mandatory [scroll-padding-inline:0] rtl:[direction:rtl] [&::-webkit-scrollbar]:hidden";
