/** Tailwind stand-ins for the fixed header, mega menu, and footer. */

export const pageContainer =
  "mx-auto w-full max-w-[var(--chrome-content-max,1200px)] px-[var(--chrome-edge,1rem)] min-[1200px]:px-0";

export const skipLink =
  "absolute top-[-3rem] left-4 z-[200] rounded-[2px] bg-[var(--ink,#241f1b)] px-4 py-[0.65rem] text-white transition-[top] duration-200 ease-[var(--ease,ease)] focus:top-4";

export const visuallyHidden = "sr-only";

export const siteHeaderSpacer =
  "pointer-events-none h-[var(--site-header-h,9.25rem)] shrink-0 [overflow-anchor:none]";

const siteHeaderBase =
  "fixed inset-x-0 top-0 z-[200] border-b border-[#d9ccb4] bg-[color-mix(in_srgb,#faf6ee_92%,transparent)] font-[family-name:var(--font-sans)] text-[0.9375rem] leading-[1.5] text-[#241f1b] backdrop-blur-[10px] [overflow-anchor:none] data-[navbar]:transition-transform data-[navbar]:duration-[0.45s] data-[navbar]:ease-[cubic-bezier(0.22,1,0.36,1)] data-[navbar]:will-change-transform data-[topbar-hidden=true]:-translate-y-10 data-[home=true]:not-data-[scrolled=true]:border-b-0 data-[over-hero=true]:not-data-[scrolled=true]:border-b-0 data-[scrolled=true]:[&_[data-nav-shell]]:py-[0.28rem] data-[navbar=minimal]:data-[scrolled=true]:[&_[data-nav-shell]]:min-h-[72px] data-[scrolled=true]:[&_[data-brand]_img]:scale-[0.94] max-[860px]:data-[scrolled=true]:[&_[data-brand]_img]:scale-[0.92] max-[860px]:data-[scrolled=true]:[&_[data-nav-shell]]:py-[0.22rem] data-[scrolled=true]:[&_[data-search-field]]:scale-[0.96] motion-reduce:[&_*]:transition-none! [&_h1]:m-0 [&_h2]:m-0 [&_h3]:m-0 [&_p]:m-0 [&_:focus-visible:not(.nav-search-input)]:outline-2 [&_:focus-visible:not(.nav-search-input)]:outline-offset-2 [&_:focus-visible:not(.nav-search-input)]:outline-[#8c4435]";

export const topbar =
  "bg-copper font-[family-name:var(--font-sans)] text-[0.72rem] text-[#f4e7d3] max-[480px]:text-[0.66rem]";

export const topbarBoutique =
  "relative overflow-visible bg-copper text-white before:pointer-events-none before:absolute before:inset-y-0 before:left-0 before:w-[min(18vw,160px)] before:opacity-[0.18] before:content-[''] before:bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.35)_0_1px,transparent_1px_10px),repeating-linear-gradient(-45deg,rgba(255,255,255,0.2)_0_1px,transparent_1px_12px)] after:pointer-events-none after:absolute after:inset-y-0 after:right-0 after:w-[min(18vw,160px)] after:opacity-[0.18] after:content-[''] after:bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.35)_0_1px,transparent_1px_10px),repeating-linear-gradient(-45deg,rgba(255,255,255,0.2)_0_1px,transparent_1px_12px)]";

export const topbarInner =
  "relative z-10 grid min-h-10 grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)] items-center gap-3 max-[1200px]:grid-cols-[minmax(0,1fr)_auto] max-[1200px]:gap-2 max-[600px]:grid-cols-1! max-[600px]:gap-1 max-[600px]:py-1.5 max-[600px]:min-h-0";

export const topbarInnerBoutique = "min-h-9";

/** Balances the desktop ticker. Hidden once the bar becomes ticker + locale, or it steals the first column and pushes the arrow onto a second line. */
export const topbarSpacer = "max-[1200px]:hidden";

export const topbarTicker =
  "grid min-w-0 items-center justify-items-center overflow-visible max-[1200px]:justify-self-stretch max-[1200px]:overflow-hidden";

export const topbarTickerLine =
  "col-start-1 row-start-1 m-0 max-w-full min-w-0 overflow-visible text-center text-[0.62rem] leading-[1.2] font-normal tracking-[0.08em] text-white uppercase max-[1200px]:w-full max-[1200px]:overflow-hidden max-[1200px]:text-start max-[1200px]:text-ellipsis max-[1200px]:whitespace-nowrap max-[1200px]:tracking-[0.04em] max-[600px]:text-center! max-[600px]:text-[0.56rem] motion-reduce:transform-none!";

export const topbarUtils =
  "flex shrink-0 flex-nowrap items-center justify-self-end gap-[0.55rem] max-[480px]:gap-2 max-[360px]:gap-[0.35rem]";

export const topbarSep =
  "h-[11px] w-px bg-white/40 max-[360px]:hidden";

export const topbarMenu = "group/menu relative";

export const topbarMenuTrigger =
  "inline-flex cursor-pointer items-center gap-[0.28rem] border-0 bg-transparent text-[0.6rem]! font-normal! tracking-[0.08em] whitespace-nowrap text-white/82 uppercase [font:inherit]! hover:text-white! group-data-[open]/menu:text-white! max-[480px]:gap-[0.3rem] [[lang=ar]]:font-[family-name:'GE_SS',sans-serif] [[lang=ar]]:tracking-[0.04em] [[lang=ar]]:normal-case [&_img]:shadow-[0_0_0_1px_rgba(255,255,255,0.28)]";

export const topbarMenuTriggerBoutique = "text-white!";

export const topbarFlag = "shrink-0 text-base leading-none";

export const topbarFlagImg =
  "block h-3 w-4 shrink-0 rounded-[1px] object-cover shadow-[0_0_0_1px_rgba(36,31,27,0.16)]";

export const topbarFlagOnTrigger = "shadow-[0_0_0_1px_rgba(255,255,255,0.28)]";

export const topbarCaret =
  "size-2 shrink-0 opacity-75 transition-transform duration-200 ease-linear group-data-[open]/menu:rotate-180";

export const topbarMenuPanel =
  "absolute inset-e-0 top-[calc(100%+4px)] z-20 m-0 min-w-[8.5rem] list-none bg-[#faf6ee] px-0 py-[0.3rem] shadow-[0_10px_28px_rgba(36,31,27,0.14)] border border-[#d9ccb4]";

export const topbarMenuOption =
  "flex w-full cursor-pointer items-center gap-[0.4rem] border-0 bg-transparent px-[0.7rem] py-[0.4rem] text-start text-[0.6rem]! font-normal! tracking-[0.08em] text-[#241f1b]! uppercase [font:inherit]! hover:bg-[#f3ebda] hover:text-copper! aria-selected:bg-[#f3ebda] aria-selected:text-copper!";

export const navShell =
  "flex min-h-14 items-center justify-between gap-6 py-2 transition-[padding,min-height,gap] duration-[0.45s] ease-[cubic-bezier(0.22,1,0.36,1)] max-[1200px]:grid max-[1200px]:min-h-14 max-[1200px]:grid-cols-[auto_minmax(0,1fr)_auto] max-[1200px]:items-center max-[1200px]:overflow-visible max-[1200px]:py-[0.6rem]";

export const navShellMinimal =
  "min-[1201px]:grid min-[1201px]:min-h-[92px] min-[1201px]:grid-cols-[1fr_auto_1fr] min-[1201px]:items-center";

export const navStart =
  "max-[1200px]:col-start-1 max-[1200px]:flex max-[1200px]:items-center max-[1200px]:justify-self-start min-[1201px]:hidden";

export const navToggle =
  "hidden max-[1200px]:inline-grid max-[1200px]:size-11 max-[1200px]:cursor-pointer max-[1200px]:place-content-center max-[1200px]:gap-[5px] max-[1200px]:justify-self-start max-[1200px]:border-0 max-[1200px]:bg-transparent max-[1200px]:[&>span:not(.sr-only)]:block max-[1200px]:[&>span:not(.sr-only)]:h-0.5 max-[1200px]:[&>span:not(.sr-only)]:w-[22px] max-[1200px]:[&>span:not(.sr-only)]:bg-[#241f1b] max-[1200px]:[&>span:not(.sr-only)]:transition-[transform,opacity] max-[1200px]:[&>span:not(.sr-only)]:duration-300 aria-expanded:max-[1200px]:[&>span:nth-child(1)]:translate-y-[7px] aria-expanded:max-[1200px]:[&>span:nth-child(1)]:rotate-45 aria-expanded:max-[1200px]:[&>span:nth-child(2)]:opacity-0 aria-expanded:max-[1200px]:[&>span:nth-child(3)]:-translate-y-[7px] aria-expanded:max-[1200px]:[&>span:nth-child(3)]:-rotate-45";

export const iconBtn =
  "relative grid size-11 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-[#241f1b]! transition-[color,background] duration-300 hover:bg-[#ece0c9] hover:text-copper!";

export const navStartSearch = "hidden max-[1200px]:inline-grid";

export const brandLink =
  "me-auto inline-flex min-w-0 items-center justify-self-start overflow-visible bg-transparent no-underline max-[1200px]:col-start-2 max-[1200px]:m-0 max-[1200px]:justify-self-center [&_img]:block [&_img]:h-auto [&_img]:max-h-10 [&_img]:w-auto [&_img]:max-w-[min(160px,100%)] [&_img]:origin-center [&_img]:bg-transparent [&_img]:object-contain [&_img]:transition-transform [&_img]:duration-[0.45s] [&_img]:ease-[cubic-bezier(0.22,1,0.36,1)] [&_img]:[transform:translateZ(0)_scale(1)] max-[767px]:[&_img]:max-h-8 max-[767px]:[&_img]:max-w-[min(120px,40vw)] max-[1200px]:[&_img]:max-h-8 max-[1200px]:[&_img]:max-w-[min(128px,42vw)]";

export const brandLinkMinimal =
  "min-[1201px]:col-start-2 min-[1201px]:m-0 min-[1201px]:justify-self-center min-[1201px]:[&_img]:max-h-[58px]";

export const brandWordmark =
  "w-auto items-baseline font-['Cormorant_Garamond',Georgia,serif] text-[clamp(1.45rem,2.4vw,1.9rem)]! leading-none font-semibold! tracking-[0.34em]! text-[#4c1d0d]! uppercase whitespace-nowrap pl-[0.34em]";

export const navActions =
  "pointer-events-auto relative z-[5] ms-auto flex w-max shrink-0 items-center justify-start gap-0 max-[1200px]:col-start-3 max-[1200px]:ms-auto max-[1200px]:w-max max-[1200px]:justify-self-end";

export const navActionsBoutique =
  "min-[1201px]:col-start-3 min-[1201px]:ms-0 min-[1201px]:flex min-[1201px]:items-stretch min-[1201px]:justify-self-end min-[1201px]:gap-[0.35rem] min-[1201px]:overflow-visible";

export const navUtils = "flex shrink-0 items-center gap-0 [&_[data-icon-btn]]:m-0 [&_[data-icon-btn]]:p-0";

export const navUtilsSearch = "max-[1200px]:hidden";

export const bagCount =
  "absolute top-1 right-1 grid h-4 min-w-4 place-items-center rounded-full bg-copper px-1 text-[0.6rem] font-semibold text-white";

export const bagCountOnTool =
  "top-[-7px] right-[-8px] text-[0.52rem] leading-none";

export const navTool =
  "inline-flex min-w-[58px] cursor-pointer flex-col items-center justify-center gap-[0.22rem] overflow-visible border-0 bg-transparent px-[0.4rem] py-[0.15rem] text-[0.58rem]! leading-none font-normal! tracking-[0.08em] text-[#241f1b]! uppercase no-underline [font-family:inherit]! max-[1200px]:min-w-0 max-[1200px]:gap-0 max-[1200px]:px-[0.3rem] [&_svg]:block [&_svg]:size-[22px] [&_svg]:text-[#241f1b]";

export const navToolLabel =
  "text-[0.58rem] leading-none font-normal tracking-[0.08em] uppercase max-[1200px]:hidden";

export const navToolIcon =
  "relative inline-flex size-6 items-center justify-center overflow-visible";

export const navToolSep =
  "mx-[0.35rem] my-[0.45rem] w-px self-stretch bg-[#d9ccb4] max-[1200px]:hidden";

export const navSearch = "relative min-[1201px]:z-[320] max-[1200px]:hidden";

export const navSearchMinimal =
  "min-[1201px]:col-start-1 min-[1201px]:justify-self-start";

export const navSearchField =
  "inline-flex min-h-[42px] w-[min(42vw,420px)] cursor-text items-center gap-[0.55rem] overflow-visible rounded-full border border-[#d4c7b2] bg-white px-[1.05rem] py-[0.35rem] text-[0.72rem] text-[#6f6152] origin-left [transform:translateZ(0)_scale(1)] [backface-visibility:hidden] transition-transform duration-[0.45s] ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-copper hover:text-[#241f1b] focus-within:border-copper focus-within:text-[#241f1b] motion-reduce:transform-none motion-reduce:transition-none [&_input]:min-h-[1.4em] [&_input]:min-w-0 [&_input]:flex-1 [&_input]:appearance-none [&_input]:border-0 [&_input]:bg-transparent [&_input]:p-0 [&_input]:text-[0.72rem] [&_input]:leading-[1.4] [&_input]:text-inherit [&_input]:shadow-none [&_input]:outline-none [&_input]:[font:inherit] [&_input]:focus:border-0 [&_input]:focus:shadow-none [&_input]:placeholder:text-[#9a8d7c] [&_svg]:shrink-0 [&_svg]:text-[#241f1b]";

export const primaryNav =
  "relative block border-t border-[#ecdfc9] max-[1200px]:hidden min-[1201px]:pt-[0.35rem]";

export const primaryNavList =
  "m-0 mx-auto flex list-none flex-nowrap items-center justify-between gap-[clamp(0.85rem,1.8vw,1.75rem)] px-[var(--chrome-edge,1rem)] py-0 min-[1200px]:max-w-[var(--chrome-content-max,1200px)] min-[1200px]:px-0";

export const primaryNavLink =
  "inline-block py-[0.85rem] font-[family-name:var(--font-sans)] text-[0.62rem]! font-medium! tracking-[0.08em] whitespace-nowrap text-[#241f1b] uppercase no-underline transition-colors duration-300 hover:text-copper aria-[current=page]:text-copper group-data-[open]/nav:text-copper";

export const primaryNavLinkAccent = "text-copper";

export const primaryNavItem = "group/nav flex items-center";

export const primaryNavCaret =
  "inline-flex w-[18px] cursor-pointer items-center justify-center self-stretch border-0 bg-transparent text-copper transition-opacity duration-300 hover:opacity-60 [&_svg]:size-3 [&_svg]:transition-transform [&_svg]:duration-300 group-data-[open]/nav:[&_svg]:rotate-180";

export const mega =
  "absolute inset-x-0 top-full z-[300] origin-top border-b border-[#e2d6c0] bg-[#faf6ee] shadow-[0_24px_48px_-12px_rgba(36,26,21,0.18),0_4px_16px_rgba(36,26,21,0.06)] will-change-[transform,opacity] before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-[linear-gradient(90deg,transparent,#8c4435_25%,#b97a5f_50%,#8c4435_75%,transparent)] before:opacity-70 before:content-['']";

export const megaInner =
  "mx-auto grid max-w-[var(--chrome-content-max,1200px)] grid-cols-[minmax(0,max-content)_minmax(320px,1fr)] items-start gap-[clamp(2.5rem,5vw,4.5rem)] px-[var(--chrome-edge,1rem)] py-10 min-[1200px]:px-0";

export const megaCols = "flex flex-wrap gap-x-[clamp(2rem,4vw,4.5rem)] gap-y-8";

export const megaHeading =
  "m-0 mb-[0.9rem] border-b border-[#ecdfc9] pb-[0.6rem] text-[0.72rem] font-semibold tracking-[0.14em] text-copper uppercase";

export const megaList = "m-0 list-none p-0 [&_a]:flex [&_a]:items-center [&_a]:gap-[0.4rem] [&_a]:py-[0.42rem] [&_a]:text-[0.92rem] [&_a]:whitespace-nowrap [&_a]:text-[#5b5148] [&_a]:no-underline [&_a]:transition-[color,transform] [&_a]:duration-200 [&_a]:hover:translate-x-[3px] [&_a]:hover:text-copper";

export const megaProducts =
  "grid w-full grid-cols-4 items-stretch gap-6 self-stretch max-[1100px]:grid-cols-2";

export const megaProd =
  "group/prod flex min-w-0 flex-col text-inherit no-underline";

export const megaProdMedia =
  "mb-3 flex aspect-[4/5] items-center justify-center overflow-hidden rounded-[4px] bg-[#f3ebe0] p-[14%] [&_img]:size-full [&_img]:object-cover [&_img]:object-center [&_img]:transition-transform [&_img]:duration-[350ms] [&_img]:ease-linear group-hover/prod:[&_img]:-translate-y-1";

export const megaProdName =
  "text-[0.9rem] font-semibold tracking-[0.01em] text-[#241f1b] transition-colors duration-200 group-hover/prod:text-copper";

export const megaProdMeta =
  "mt-[0.2rem] truncate text-[0.76rem] text-[#8a7a68]";

export const megaProdPrice = "mt-[0.4rem] text-[0.85rem] font-semibold text-copper";

export const megaProdLoading = "";

export const megaProdMediaLoading =
  "mb-3 flex aspect-[4/5] items-center justify-center overflow-hidden rounded-[4px] bg-[length:250%_100%] bg-[linear-gradient(100deg,#f3ebe0_30%,#faf5ee_50%,#f3ebe0_70%)] p-[14%] animate-mega-shimmer motion-reduce:animate-none";

export const megaSkel =
  "mt-[0.45rem] block h-[0.7rem] w-[55%] rounded bg-[length:250%_100%] bg-[linear-gradient(100deg,#f3ebe0_30%,#faf5ee_50%,#f3ebe0_70%)] animate-mega-shimmer motion-reduce:animate-none";

export const megaSkelName = "h-[0.85rem] w-3/4";

export const megaPromo =
  "ms-auto w-full max-w-[420px] rounded bg-[#f3e9d6] p-6";

export const megaPromoMedia =
  "aspect-[3/2] overflow-hidden rounded-[2px] bg-[#fffdf9] [&_img]:size-full [&_img]:object-contain";

export const megaPromoMediaCover = "[&_img]:object-cover [&_img]:object-[center_30%]";

export const megaPromoCopy =
  "my-[0.9rem] mb-4 max-w-[34ch] text-[0.9rem] leading-[1.55] text-[#5b5148]";

export const pill =
  "inline-flex cursor-pointer items-center justify-center gap-2 min-h-11 rounded-full px-[1.4rem] py-[0.7rem] font-[family-name:var(--font-sans)] text-[0.78rem]! font-semibold! tracking-[0.08em] uppercase no-underline transition-[background,border-color,color] duration-300";

export const pillSolid =
  `${pill} border border-copper bg-copper text-white! hover:border-copper-deep hover:bg-copper-deep hover:text-white!`;

export const pillTranslucent =
  `${pill} border border-white/55 bg-white/16 text-white! backdrop-blur-[4px] hover:border-white hover:bg-white hover:text-[var(--ink,#241f1b)]!`;

export const megaPromoCta = pillSolid;

export const mobileNav =
  "hidden max-h-[calc(100svh-116px)] overflow-y-auto border-t border-[#d9ccb4] bg-[#faf6ee] px-[clamp(1.25rem,4vw,2rem)] pt-2 pb-6 max-[1200px]:block";

export const mobileNavList = "m-0 flex list-none flex-col p-0";

export const mobileNavLink =
  "flex w-full cursor-pointer items-center justify-between gap-4 border-0 border-b border-[#e2d6c0] bg-transparent py-[0.85rem] text-left font-[family-name:var(--font-sans)] text-[1.15rem]! text-[#241f1b]! no-underline hover:text-copper! [&_svg]:size-3.5 [&_svg]:shrink-0 [&_svg]:text-copper [&_svg]:transition-transform [&_svg]:duration-300 aria-expanded:[&_svg]:rotate-180";

export const mobileNavSub =
  "m-0 list-none py-1 pr-0 pb-2 pl-3 [&_a]:block [&_a]:py-[0.55rem] [&_a]:font-[family-name:var(--font-sans)] [&_a]:text-[0.92rem] [&_a]:text-[#5b5148] [&_a]:no-underline [&_a]:hover:text-copper";

export const mobileNavSubLabel =
  "pt-[0.6rem] pb-[0.2rem] text-[0.66rem] font-semibold tracking-[0.12em] text-[#a89a86] uppercase";

export const navSearchDrop =
  "absolute top-[calc(100%+14px)] left-0 w-[min(92vw,520px)] border border-[#e4d8c6] bg-white pt-0 pb-5 text-start shadow-[0_18px_40px_rgba(44,36,29,0.1)] before:absolute before:top-[-7px] before:left-[22px] before:size-3 before:rotate-45 before:border-t before:border-l before:border-[#e4d8c6] before:bg-white before:content-['']";

export const navSearchDropBlock = "px-5 pt-[1.1rem]";

export const navSearchDropKicker =
  "m-0 mb-2 text-[0.58rem] font-semibold tracking-[0.12em] text-[#8a7d70] uppercase";

export const navSearchDropHits =
  "m-0 list-none p-0 [&_li+li]:border-t [&_li+li]:border-[#f0e8da] [&_a]:grid [&_a]:grid-cols-[44px_minmax(0,1fr)_10px] [&_a]:items-center [&_a]:gap-3 [&_a]:py-2 [&_a]:text-[0.75rem] [&_a]:text-[#241f1b] [&_a]:no-underline [&_a]:hover:text-copper";

export const navSearchDropQueries =
  "m-0 list-none p-0 [&_li+li]:border-t [&_li+li]:border-[#f0e8da] [&_a]:flex [&_a]:w-full [&_a]:items-center [&_a]:justify-between [&_a]:gap-3 [&_a]:bg-transparent [&_a]:py-[0.55rem] [&_a]:text-start [&_a]:text-[0.75rem] [&_a]:text-[#241f1b] [&_a]:no-underline [&_button]:flex [&_button]:w-full [&_button]:cursor-pointer [&_button]:items-center [&_button]:justify-between [&_button]:gap-3 [&_button]:border-0 [&_button]:bg-transparent [&_button]:py-[0.55rem] [&_button]:text-start [&_button]:text-[0.75rem]! [&_button]:text-[#241f1b]! [&_button]:[font:inherit]! [&_a]:hover:text-copper [&_button]:hover:text-copper!";

export const navSearchDropThumb =
  "block size-11 overflow-hidden rounded-md bg-[#f3ebe0] [&_img]:block [&_img]:size-full [&_img]:object-cover";

export const navSearchDropName = "line-clamp-2 leading-[1.35]";

export const navSearchDropEmpty = "mt-[0.15rem] mb-[0.35rem] text-[0.72rem] leading-[1.4] text-[#8a7d70]";

export const navSearchDropAll =
  "mt-[0.35rem] inline-block w-auto cursor-pointer border-0 bg-transparent p-0 text-[0.6rem]! font-semibold! tracking-[0.1em] text-copper! underline! underline-offset-[3px] uppercase [font-family:inherit]!";

export const navSearchDropNewHead = "flex items-baseline justify-between gap-4 [&_a]:text-[0.58rem] [&_a]:font-semibold [&_a]:tracking-[0.1em] [&_a]:text-copper [&_a]:underline [&_a]:underline-offset-[3px] [&_a]:uppercase";

export const navSearchDropCards =
  "m-0 mt-3 grid list-none grid-cols-4 gap-[0.65rem] p-0 [&_a]:flex [&_a]:flex-col [&_a]:gap-[0.45rem] [&_a]:text-[#241f1b] [&_a]:no-underline [&_img]:block [&_img]:aspect-[4/5] [&_img]:w-full [&_img]:bg-[#f6efe3] [&_img]:object-contain [&_span]:text-[0.65rem] [&_span]:leading-[1.3]";

export const siteFooter =
  "border-t border-[rgb(165_134_79/0.3)] bg-copper px-0 pt-[clamp(2.75rem,6vw,4.5rem)] pb-9 font-[family-name:var(--font-sans)] text-[0.9375rem] leading-[1.5] text-white/88 max-[1023px]:pt-9 max-[1023px]:pb-7 max-[767px]:pt-8 max-[767px]:pb-6 [&_a]:text-white/82 [&_a]:no-underline [&_a]:hover:text-white [&_h1]:m-0 [&_h2]:m-0 [&_h3]:m-0 [&_p]:m-0 [&_h1]:text-[length:inherit] [&_h2]:text-[length:inherit] [&_h2]:leading-[1.15] [&_h2]:font-[inherit]";

export const footerNewsletter =
  "mb-[clamp(2.5rem,5vw,4rem)] flex flex-col items-center gap-6 text-center";

export const footerNewsletterTitle =
  "m-0 text-[0.78rem] font-semibold tracking-[0.18em] text-white uppercase";

export const footerNewsletterRow =
  "flex w-[min(100%,26rem)] items-end justify-center gap-2 max-[767px]:w-full";

export const footerNewsletterInput =
  "h-10 min-w-0 flex-[1_1_auto] border-0 border-b border-white/72 bg-transparent px-0 pt-0 pb-[0.35rem] text-[0.92rem] leading-[1.2] text-white [font:inherit] outline-none placeholder:text-white/70 focus:border-b-white";

export const footerNewsletterSubmit =
  "h-8 min-h-8 shrink-0 cursor-pointer rounded-full border-0 bg-white px-[0.85rem] py-0 text-[0.72rem]! leading-none font-medium! text-[var(--ink,#241f1b)]! shadow-none [font:inherit]! hover:bg-white hover:text-[var(--ink,#241f1b)]!";

export const footerCols =
  "grid grid-cols-4 items-start gap-x-10 gap-y-8 max-[1023px]:grid-cols-2 max-[1023px]:gap-x-6 max-[1023px]:gap-y-7 max-[767px]:gap-x-4 max-[767px]:gap-y-6 max-[360px]:grid-cols-1 max-[360px]:gap-[1.35rem] [&_ul]:m-0 [&_ul]:list-none [&_ul]:p-0";

export const footerColTitle =
  "mb-[0.85rem] text-[0.82rem] font-semibold tracking-[0.02em] text-white max-[1023px]:text-[0.8rem]";

export const footerColTitleCaps = "tracking-[0.12em] uppercase";

export const footerColLinks =
  "[&_a]:inline-block [&_a]:py-[0.28rem] [&_a]:text-[0.875rem] [&_a]:text-white/82 [&_a]:no-underline [&_a]:hover:text-white [&_a]:hover:no-underline max-[1023px]:[&_a]:py-[0.22rem] max-[1023px]:[&_a]:text-[0.8125rem] max-[1023px]:[&_a]:leading-[1.35] max-[767px]:[&_a]:text-[0.78rem]";

export const footerSocial =
  "m-0 flex list-none flex-wrap items-center gap-[0.65rem] p-0";

export const socialLink =
  "inline-flex size-[22px] items-center justify-center rounded-none border-0 bg-transparent p-0 text-white hover:bg-transparent hover:text-[var(--beige,#e8d8bb)] [&_svg]:size-[18px]";

export const footerLegal =
  "mt-[clamp(2.5rem,5vw,4.25rem)] flex flex-wrap items-center justify-center gap-x-5 gap-y-3 text-center text-[0.78rem] text-white/78 max-[1023px]:mt-9 max-[767px]:mt-7 max-[767px]:flex-col max-[767px]:gap-3";

export const footerPayments =
  "m-0 flex list-none flex-wrap items-center justify-center gap-[0.45rem] p-0";

export const payMark =
  "inline-flex h-[26px] min-w-[42px] items-center justify-center rounded px-[0.35rem] bg-white text-[0.58rem] leading-none font-extrabold tracking-[0.04em] shadow-[0_0_0_1px_rgba(60,40,25,0.08)] [&_svg]:block [&_svg]:h-4 [&_svg]:w-10";

export const payMarkAmex = "min-w-12 bg-[#006fcf] text-white";
export const payMarkApple = "px-[0.2rem] text-[#111]";
export const payMarkGpay = "min-w-14 px-1 [&_svg]:w-[52px]";
export const payMarkMc = "min-w-10 p-0 [&_svg]:h-5 [&_svg]:w-[34px]";
export const payMarkVisa = "bg-[#1a1f71] text-white italic tracking-[0.12em]";

/** Desktop layouts for /lp navbar variants. Live storefront uses minimal, which is on the shell itself. */
const navbarLayouts = [
  "min-[1201px]:[&[data-navbar=logo-center]_[data-nav-shell],&[data-navbar=underline]_[data-nav-shell],&[data-navbar=split]_[data-nav-shell]]:grid",
  "min-[1201px]:[&[data-navbar=logo-center]_[data-nav-shell],&[data-navbar=underline]_[data-nav-shell],&[data-navbar=split]_[data-nav-shell]]:grid-cols-[1fr_auto_1fr]",
  "min-[1201px]:[&[data-navbar=logo-center]_[data-nav-shell],&[data-navbar=underline]_[data-nav-shell],&[data-navbar=split]_[data-nav-shell]]:items-center",
  "min-[1201px]:[&[data-navbar=logo-center]_[data-nav-shell],&[data-navbar=underline]_[data-nav-shell],&[data-navbar=split]_[data-nav-shell]]:min-h-[72px]",
  "min-[1201px]:[&[data-navbar=logo-center]_[data-nav-start],&[data-navbar=underline]_[data-nav-start],&[data-navbar=split]_[data-nav-start],&[data-navbar=inline]_[data-nav-start],&[data-navbar=inline-locale]_[data-nav-start]]:hidden",
  "min-[1201px]:[&[data-navbar=logo-center]_[data-topbar-inner]]:grid-cols-1",
  "min-[1201px]:[&[data-navbar=logo-center]_[data-topbar-inner]]:justify-items-center",
  "min-[1201px]:[&[data-navbar=logo-center]_[data-nav-search],&[data-navbar=underline]_[data-nav-search]]:col-start-1",
  "min-[1201px]:[&[data-navbar=logo-center]_[data-nav-search],&[data-navbar=underline]_[data-nav-search]]:justify-self-start",
  "min-[1201px]:[&[data-navbar=logo-center]_[data-nav-search],&[data-navbar=underline]_[data-nav-search],&[data-navbar=split]_[data-nav-search]]:z-[320]",
  "min-[1201px]:[&[data-navbar=logo-center]_[data-search-field],&[data-navbar=underline]_[data-search-field]]:w-[168px]",
  "min-[1201px]:[&[data-navbar=logo-center]_[data-search-field],&[data-navbar=underline]_[data-search-field]]:min-h-[34px]",
  "min-[1201px]:[&[data-navbar=logo-center]_[data-search-field],&[data-navbar=underline]_[data-search-field]]:gap-[0.45rem]",
  "min-[1201px]:[&[data-navbar=logo-center]_[data-search-field],&[data-navbar=underline]_[data-search-field],&[data-navbar=split]_[data-search-field]]:rounded-none",
  "min-[1201px]:[&[data-navbar=logo-center]_[data-search-field],&[data-navbar=underline]_[data-search-field],&[data-navbar=split]_[data-search-field]]:border-0",
  "min-[1201px]:[&[data-navbar=logo-center]_[data-search-field],&[data-navbar=underline]_[data-search-field],&[data-navbar=split]_[data-search-field]]:border-b",
  "min-[1201px]:[&[data-navbar=logo-center]_[data-search-field],&[data-navbar=underline]_[data-search-field],&[data-navbar=split]_[data-search-field]]:border-b-[#c4b49a]",
  "min-[1201px]:[&[data-navbar=logo-center]_[data-search-field],&[data-navbar=underline]_[data-search-field],&[data-navbar=split]_[data-search-field]]:bg-transparent",
  "min-[1201px]:[&[data-navbar=logo-center]_[data-search-field],&[data-navbar=underline]_[data-search-field]]:px-0",
  "min-[1201px]:[&[data-navbar=logo-center]_[data-search-field],&[data-navbar=underline]_[data-search-field]]:pt-[0.2rem]",
  "min-[1201px]:[&[data-navbar=logo-center]_[data-search-field],&[data-navbar=underline]_[data-search-field]]:pb-[0.35rem]",
  "min-[1201px]:[&[data-navbar=logo-center]_[data-search-field]:hover,&[data-navbar=logo-center]_[data-search-field]:focus-within,&[data-navbar=underline]_[data-search-field]:hover,&[data-navbar=underline]_[data-search-field]:focus-within,&[data-navbar=split]_[data-search-field]:hover,&[data-navbar=split]_[data-search-field]:focus-within]:border-b-copper",
  "min-[1201px]:[&[data-navbar=logo-center]_[data-search-field]:hover,&[data-navbar=underline]_[data-search-field]:hover,&[data-navbar=split]_[data-search-field]:hover]:text-[#241f1b]",
  "min-[1201px]:[&[data-navbar=logo-center]_[data-brand],&[data-navbar=underline]_[data-brand]]:col-start-2",
  "min-[1201px]:[&[data-navbar=logo-center]_[data-brand],&[data-navbar=underline]_[data-brand]]:m-0",
  "min-[1201px]:[&[data-navbar=logo-center]_[data-brand],&[data-navbar=underline]_[data-brand]]:justify-self-center",
  "min-[1201px]:[&[data-navbar=logo-center]_[data-brand-crop]]:h-[50px]",
  "min-[1201px]:[&[data-navbar=logo-center]_[data-brand-crop]_img]:h-[59px]",
  "min-[1201px]:[&[data-navbar=logo-center]_[data-brand-crop]_img]:max-h-none",
  "min-[1201px]:[&[data-navbar=logo-center]_[data-brand-crop]_img]:max-w-[220px]",
  "min-[1201px]:[&[data-navbar=logo-center]_[data-nav-actions],&[data-navbar=underline]_[data-nav-actions],&[data-navbar=split]_[data-nav-actions]]:col-start-3",
  "min-[1201px]:[&[data-navbar=logo-center]_[data-nav-actions],&[data-navbar=underline]_[data-nav-actions],&[data-navbar=split]_[data-nav-actions]]:ms-0",
  "min-[1201px]:[&[data-navbar=logo-center]_[data-nav-actions],&[data-navbar=underline]_[data-nav-actions],&[data-navbar=split]_[data-nav-actions]]:justify-self-end",
  "min-[1201px]:[&[data-navbar=logo-center]_[data-nav-utils-search],&[data-navbar=underline]_[data-nav-utils-search],&[data-navbar=split]_[data-nav-utils-search]]:hidden",
  "min-[1201px]:[&[data-navbar=split]_[data-brand]]:col-start-1",
  "min-[1201px]:[&[data-navbar=split]_[data-brand]]:m-0",
  "min-[1201px]:[&[data-navbar=split]_[data-brand]]:justify-self-start",
  "min-[1201px]:[&[data-navbar=split]_[data-brand-crop]]:h-[54px]",
  "min-[1201px]:[&[data-navbar=split]_[data-brand-crop]]:overflow-hidden",
  "min-[1201px]:[&[data-navbar=split]_[data-brand-crop]_img]:h-16",
  "min-[1201px]:[&[data-navbar=split]_[data-brand-crop]_img]:max-h-none",
  "min-[1201px]:[&[data-navbar=split]_[data-brand-crop]_img]:max-w-[230px]",
  "min-[1201px]:[&[data-navbar=split]_[data-brand-crop]_img]:object-contain",
  "min-[1201px]:[&[data-navbar=split]_[data-brand-crop]_img]:object-top",
  "min-[1201px]:[&[data-navbar=split]_[data-nav-search]]:col-start-2",
  "min-[1201px]:[&[data-navbar=split]_[data-nav-search]]:justify-self-center",
  "min-[1201px]:[&[data-navbar=split]_[data-search-field]]:w-[min(56vw,520px)]",
  "min-[1201px]:[&[data-navbar=split]_[data-search-field]]:min-h-10",
  "min-[1201px]:[&[data-navbar=split]_[data-search-field]]:gap-[0.65rem]",
  "min-[1201px]:[&[data-navbar=split]_[data-search-field]]:px-0",
  "min-[1201px]:[&[data-navbar=split]_[data-search-field]]:pt-[0.3rem]",
  "min-[1201px]:[&[data-navbar=split]_[data-search-field]]:pb-[0.4rem]",
  "min-[1201px]:[&[data-navbar=split]_[data-search-field]_svg]:size-5",
  "min-[1201px]:[&[data-navbar=inline]_[data-nav-shell],&[data-navbar=inline-locale]_[data-nav-shell]]:grid",
  "min-[1201px]:[&[data-navbar=inline]_[data-nav-shell],&[data-navbar=inline-locale]_[data-nav-shell]]:grid-cols-[1fr_auto_1fr]",
  "min-[1201px]:[&[data-navbar=inline]_[data-nav-shell],&[data-navbar=inline-locale]_[data-nav-shell]]:items-center",
  "min-[1201px]:[&[data-navbar=inline]_[data-nav-shell],&[data-navbar=inline-locale]_[data-nav-shell]]:gap-x-5",
  "min-[1201px]:[&[data-navbar=inline]_[data-topbar-inner]]:grid-cols-1",
  "min-[1201px]:[&[data-navbar=inline]_[data-topbar-inner]]:justify-items-center",
  "min-[1201px]:[&[data-navbar=inline-locale]_[data-topbar-inner]]:grid-cols-[1fr_auto_1fr]",
  "min-[1201px]:[&[data-navbar=inline]_[data-brand],&[data-navbar=inline-locale]_[data-brand]]:m-0",
  "min-[1201px]:[&[data-navbar=inline]_[data-brand],&[data-navbar=inline-locale]_[data-brand]]:justify-self-start",
  "min-[1201px]:[&[data-navbar=inline]_[data-brand]_img,&[data-navbar=inline-locale]_[data-brand]_img]:max-h-[54px]",
  "min-[1201px]:[&[data-navbar=inline]_[data-brand]_img,&[data-navbar=inline-locale]_[data-brand]_img]:max-w-[200px]",
  "min-[1201px]:[&[data-navbar=inline-locale]_[data-brand-crop]]:h-[46px]",
  "min-[1201px]:[&[data-navbar=inline-locale]_[data-brand-crop]_img]:h-[54px]",
  "min-[1201px]:[&[data-navbar=inline-locale]_[data-brand-crop]_img]:max-h-none",
  "min-[1201px]:[&[data-navbar=inline]_[data-primary-nav],&[data-navbar=inline-locale]_[data-primary-nav]]:static",
  "min-[1201px]:[&[data-navbar=inline]_[data-primary-nav],&[data-navbar=inline-locale]_[data-primary-nav]]:border-t-0",
  "min-[1201px]:[&[data-navbar=inline]_[data-primary-nav],&[data-navbar=inline-locale]_[data-primary-nav]]:justify-self-center",
  "min-[1201px]:[&[data-navbar=inline]_[data-primary-nav],&[data-navbar=inline-locale]_[data-primary-nav]]:pt-0",
  "min-[1201px]:[&[data-navbar=inline]_[data-primary-list],&[data-navbar=inline-locale]_[data-primary-list]]:justify-center",
  "min-[1201px]:[&[data-navbar=inline]_[data-primary-list],&[data-navbar=inline-locale]_[data-primary-list]]:gap-x-[1.05rem]",
  "min-[1201px]:[&[data-navbar=inline]_[data-primary-list],&[data-navbar=inline-locale]_[data-primary-list]]:gap-y-[0.2rem]",
  "min-[1201px]:[&[data-navbar=inline]_[data-primary-list],&[data-navbar=inline-locale]_[data-primary-list]]:p-0",
  "min-[1201px]:[&[data-navbar=inline]_[data-primary-link],&[data-navbar=inline-locale]_[data-primary-link]]:py-[0.35rem]",
  "min-[1201px]:[&[data-navbar=inline]_[data-primary-link],&[data-navbar=inline-locale]_[data-primary-link]]:text-[0.625rem]!",
  "min-[1201px]:[&[data-navbar=inline]_[data-primary-link],&[data-navbar=inline-locale]_[data-primary-link]]:tracking-[0.055em]",
  "min-[1201px]:[&[data-navbar=inline]_[data-primary-caret],&[data-navbar=inline-locale]_[data-primary-caret]]:size-4",
  "min-[1201px]:[&[data-navbar=inline]_[data-primary-caret],&[data-navbar=inline-locale]_[data-primary-caret]]:self-center",
  "min-[1201px]:[&[data-navbar=inline]_[data-primary-caret]_svg,&[data-navbar=inline-locale]_[data-primary-caret]_svg]:size-[9px]",
  "min-[1201px]:[&[data-navbar=inline]_[data-nav-actions],&[data-navbar=inline-locale]_[data-nav-actions]]:ms-0",
  "min-[1201px]:[&[data-navbar=inline]_[data-nav-actions],&[data-navbar=inline-locale]_[data-nav-actions]]:justify-self-end",
  "min-[1201px]:[&[data-navbar=inline]_[data-icon-btn],&[data-navbar=inline-locale]_[data-icon-btn]]:size-10",
  "min-[1201px]:[&[data-navbar=inline]_[data-icon-btn]_svg,&[data-navbar=inline-locale]_[data-icon-btn]_svg]:size-[19px]",
  "min-[1201px]:[&[data-navbar=underline]_[data-primary-nav]]:border-t-[#e2d6c0]",
  "min-[1201px]:[&[data-navbar=underline]_[data-primary-link]]:relative",
  "min-[1201px]:[&[data-navbar=underline]_[data-primary-link]]:after:absolute",
  "min-[1201px]:[&[data-navbar=underline]_[data-primary-link]]:after:inset-x-0",
  "min-[1201px]:[&[data-navbar=underline]_[data-primary-link]]:after:bottom-0",
  "min-[1201px]:[&[data-navbar=underline]_[data-primary-link]]:after:h-0.5",
  "min-[1201px]:[&[data-navbar=underline]_[data-primary-link]]:after:bg-transparent",
  "min-[1201px]:[&[data-navbar=underline]_[data-primary-link]]:after:content-['']",
  "min-[1201px]:[&[data-navbar=underline]_[data-primary-link]:hover]:after:bg-copper",
  "min-[1201px]:[&[data-navbar=underline]_[data-primary-item][data-open]_[data-primary-link]]:after:bg-copper",
].join(" ");

export const siteHeader = `${siteHeaderBase} ${navbarLayouts}`;
