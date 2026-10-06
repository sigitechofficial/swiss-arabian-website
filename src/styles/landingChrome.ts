/** Tailwind stand-ins for the home page. */

export const hero =
  "relative flex h-[calc(80dvh-var(--site-header-h,9.25rem))] max-h-[calc(80dvh-var(--site-header-h,9.25rem))] min-h-[calc(80dvh-var(--site-header-h,9.25rem))] items-center overflow-hidden text-white [overflow-anchor:none]";

export const heroMedia =
  "absolute inset-0 isolate overflow-hidden bg-[#14100c] before:pointer-events-none before:absolute before:inset-0 before:z-[1] before:bg-[linear-gradient(90deg,rgba(24,16,11,0.8)_0%,rgba(24,16,11,0.45)_46%,rgba(24,16,11,0.12)_100%)] before:content-[''] max-[700px]:before:bg-[linear-gradient(0deg,rgba(24,16,11,0.78)_0%,rgba(24,16,11,0.35)_55%,rgba(24,16,11,0.3)_100%)]";

export const heroGlow =
  "pointer-events-none absolute inset-0 z-[2] bg-[radial-gradient(40%_50%_at_78%_62%,rgba(255,190,120,0.45),transparent_70%),linear-gradient(0deg,rgba(20,14,10,0.66),rgba(20,14,10,0.05)_55%)]";

export const heroInner = "relative z-[2] w-full py-[clamp(1.75rem,5vh,3.25rem)]";

export const heroEyebrow =
  "m-0 inline-flex items-center gap-3 text-[0.68rem]! font-semibold! tracking-[0.26em] text-[#f0c4ad]! uppercase before:h-px before:w-7 before:bg-current before:opacity-70 before:content-['']";

export const heroTitle =
  "my-[0.85rem] mb-4 max-w-[13ch] text-[clamp(1.7rem,3.2vw,2.85rem)]! leading-[1.12]! font-normal! tracking-normal! max-[700px]:max-w-[14ch] max-[700px]:text-[clamp(1.55rem,7vw,2.1rem)]!";

export const heroLead =
  "m-0 max-w-[38ch] text-[0.9375rem]! leading-[1.65]! text-white/78!";

export const heroCta =
  "mt-[1.65rem] flex flex-col items-stretch gap-3 max-[700px]:w-full min-[701px]:flex-row min-[701px]:flex-wrap min-[701px]:items-center";

const heroBtn =
  "inline-flex min-h-12 w-full cursor-pointer items-center justify-center border px-[1.45rem] font-[family-name:var(--font-sans)] text-[0.7rem]! font-semibold! tracking-[0.14em] uppercase no-underline transition-[background,color,border-color] duration-300 min-[701px]:w-auto";

export const heroBtnSolid =
  `${heroBtn} border-copper bg-copper text-white! hover:border-copper-deep hover:bg-copper-deep hover:text-white!`;

export const heroBtnGhost =
  `${heroBtn} border-white/55 bg-transparent text-white! hover:border-white hover:bg-white hover:text-[var(--ink,#241f1b)]!`;

export const heroSwiper = "group/swiper absolute inset-0 z-0 overflow-hidden";

export const heroSlide = "absolute inset-0 overflow-hidden will-change-[opacity]";

export const heroImg =
  "absolute inset-0 size-full object-cover object-[58%_50%] motion-reduce:transition-none!";

export const heroArrow =
  "absolute top-1/2 z-[3] grid size-11 -translate-y-1/2 cursor-pointer place-items-center rounded-full border border-white/35 bg-[rgba(20,14,10,0.35)] text-white! opacity-0 transition-[opacity,background,border-color] duration-300 group-hover/swiper:opacity-100 focus-visible:opacity-100 hover:border-white/60 hover:bg-[rgba(20,14,10,0.6)] max-[620px]:hidden [&_svg]:size-[18px]";

export const heroArrowPrev = "left-[var(--chrome-edge,1.5rem)]";

export const heroArrowNext = "right-[var(--chrome-edge,1.5rem)]";

export const featureCards =
  "bg-[var(--cream,#faf6ee)] py-[clamp(1.25rem,3vw,2rem)]";

export const featureCardsList =
  "flex gap-4 max-[1180px]:flex-wrap max-[767px]:gap-2";

export const featureCard =
  "w-1/4 rounded-lg bg-[#f7f5f4] max-[1180px]:w-[calc(50%-8px)] max-[767px]:w-[calc(50%-4px)]";

export const featureCardBox =
  "relative h-full min-h-24 overflow-hidden rounded-lg px-4 pt-3.5 pb-4 max-[767px]:flex max-[767px]:min-h-[146px] max-[767px]:items-end max-[767px]:px-4 max-[767px]:pt-9 max-[767px]:pb-3.5";

export const featureCardBg =
  "pointer-events-none absolute [&_img]:block [&_img]:size-full [&_img]:object-contain";

export const featureBg1 =
  "top-[-90px] right-[-100px] w-[240px] -rotate-3 max-[767px]:top-[-130px] max-[767px]:right-[-85px] rtl:right-auto rtl:left-[-100px] max-[767px]:rtl:left-[-85px]";

export const featureBg2 =
  "right-[-80px] bottom-[-70px] w-[210px] max-[767px]:top-[-75px] max-[767px]:right-[-90px] max-[767px]:bottom-auto rtl:right-auto rtl:left-[-80px] max-[767px]:rtl:left-[-90px]";

export const featureBg3 =
  "top-[-90px] right-[-30px] w-[200px] -rotate-[20deg] max-[767px]:top-[-76px] max-[767px]:right-[-50px] max-[767px]:w-[130px] max-[767px]:rotate-[199deg] rtl:right-auto rtl:left-[-30px] max-[767px]:rtl:left-[-50px]";

export const featureBg4 =
  "top-[-10px] right-[-20px] w-[120px] max-[767px]:top-[-59px] max-[767px]:right-[-40px] max-[767px]:w-[110px] rtl:right-auto rtl:left-[-20px] max-[767px]:rtl:left-[-40px]";

export const featureCardCopy =
  "relative z-[2] max-w-[70%] max-[767px]:max-w-[75%] rtl:ms-auto rtl:text-right [&_h2]:m-0 [&_h2]:mb-[3px] [&_h2]:font-[family-name:var(--font-display)] [&_h2]:text-sm [&_h2]:leading-5 [&_h2]:font-normal [&_h2]:tracking-[0.02em] [&_h2]:text-[var(--ink,#241f1b)] max-[767px]:[&_h2]:mb-1 max-[767px]:[&_h2]:text-[13px] max-[767px]:[&_h2]:leading-[18px] [&_strong]:font-semibold [&_p]:m-0 [&_p]:text-[9px] [&_p]:leading-[14px] [&_p]:tracking-[0.02em] [&_p]:text-[var(--ink-2,#5b5148)]";

export const sectionBlock = "py-[clamp(3.5rem,8vw,7rem)]";

export const sectionHead = "mb-[clamp(2rem,5vw,3.5rem)] max-w-[60ch]";

export const sectionHeadRow =
  "flex max-w-none items-end justify-between gap-6 max-[760px]:flex-col max-[760px]:items-start max-[760px]:gap-3";

export const sectionTitle =
  "my-3 mb-4 text-[clamp(1.6rem,3vw,2.35rem)]! leading-[1.05] font-medium tracking-[0.005em]";

export const sectionTitleFlush = "mt-0 mb-0";

export const lead =
  "max-w-[62ch] text-base leading-[1.7] text-[var(--ink-2,#5b5148)]";

export const linkUnderline =
  "relative pb-0.5 text-[0.8rem] font-semibold tracking-[0.08em] text-copper uppercase after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:scale-x-0 after:bg-copper after:transition-transform after:duration-400 after:ease-[cubic-bezier(0.22,0.61,0.36,1)] after:content-[''] hover:after:scale-x-100";

export const linkUnderlineLight =
  "text-white! after:bg-[var(--beige,#e8d8bb)]";

export const collectionsSection = "bg-[var(--cream,#faf6ee)]";

export const collectionGrid =
  "grid auto-rows-[calc(600px+1rem)] grid-cols-4 gap-4 max-[1100px]:auto-rows-[420px] max-[1100px]:grid-cols-2 max-[760px]:auto-rows-[280px] max-[480px]:auto-rows-[320px] max-[480px]:grid-cols-1";

export const collectionCard =
  "group/card relative isolate flex min-h-0 items-end overflow-hidden rounded-[4px] text-white after:absolute after:inset-0 after:-z-[1] after:bg-[linear-gradient(0deg,rgba(30,18,12,0.7),rgba(30,18,12,0.05)_60%)] after:content-['']";

export const collectionArt =
  "absolute inset-0 -z-[2] size-full origin-bottom scale-[1.38] object-cover object-bottom transition-transform duration-[800ms] ease-[cubic-bezier(0.22,0.61,0.36,1)] group-hover/card:scale-[1.46] max-[1100px]:scale-[1.08] max-[1100px]:object-[center_24%] max-[1100px]:group-hover/card:scale-[1.12]";

export const collectionArtProduct =
  "origin-[center_18%] scale-[1.04] object-[center_18%] group-hover/card:scale-110 max-[1100px]:scale-[1.02] max-[1100px]:group-hover/card:scale-[1.08]";

export const collectionBody = "grid gap-2 p-8";

export const collectionTitle = "text-[clamp(1.2rem,1.8vw,1.55rem)]! leading-[1.05] font-medium";

export const notesShop =
  "bg-[var(--cream,#faf6ee)] pt-[clamp(1.25rem,3vw,2rem)] pb-[clamp(2.5rem,5vw,4rem)]";

export const notesHead = "mb-[clamp(1.25rem,3vw,2rem)] max-w-none";

export const notesStrip =
  "m-0 flex list-none items-start gap-[clamp(1rem,2vw,1.75rem)] overflow-x-auto p-0 [scroll-padding-inline:0] [scroll-snap-type:x_mandatory] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [&_li]:w-[clamp(96px,14vw,128px)] [&_li]:shrink-0 [&_li]:[scroll-snap-align:start]";

export const notesItem =
  "flex w-full flex-col items-center gap-[0.7rem] text-[var(--ink,#241f1b)] no-underline";

export const notesArt =
  "block aspect-square w-full overflow-hidden rounded-full bg-[#f4ece0] [&_img]:block [&_img]:size-full [&_img]:object-cover [&_img]:transition-transform [&_img]:duration-500 group-hover/note:[&_img]:scale-[1.06]";

export const notesLabel =
  "text-center text-[0.68rem] leading-[1.3] font-semibold tracking-[0.08em] text-[var(--ink,#241f1b)] uppercase";

export const stripControls = "mt-6 flex items-center justify-end";

export const stripArrows = "flex gap-2";

export const arrowOutline =
  "inline-flex size-[46px] cursor-pointer items-center justify-center rounded-full border border-[var(--line,#d9ccb4)] bg-transparent text-[var(--ink,#241f1b)]! transition-[border-color,color,opacity] duration-400 hover:border-copper hover:text-copper! disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-[var(--line,#d9ccb4)] disabled:hover:text-[var(--ink,#241f1b)]! [&_svg]:size-[21px]";

export const eyebrow =
  "text-[0.68rem]! font-semibold! tracking-[0.18em] text-copper uppercase";

export const trendingSection = `${sectionBlock} bg-[var(--cream-2,#f3ebda)]`;

export const trendTitleRow =
  "flex flex-row items-center justify-between gap-4 rtl:flex-row-reverse";

export const productsBand =
  "bg-transparent pt-[clamp(2.25rem,5vw,3.5rem)] pb-[clamp(1rem,2.5vw,1.5rem)]";

export const productsBandHead = `${sectionHead} ${sectionHeadRow} mb-[clamp(1.25rem,3vw,2rem)]`;

export const productsBandTitleEm = "text-inherit not-italic";

export const reviewsSection =
  "bg-[var(--cream,#faf6ee)] pt-[clamp(1.25rem,3vw,2rem)] pb-[clamp(3.5rem,8vw,7rem)] text-center";

export const reviewsHead = "mx-auto mb-[clamp(2rem,5vw,3rem)] max-w-[640px]";

export const reviewsRating =
  "inline-flex flex-wrap items-center justify-center gap-3 text-[0.95rem] text-[var(--ink-2,#5b5148)] [&_strong]:text-[var(--ink,#241f1b)]";

export const stars = "leading-none tracking-[0.1em] text-[var(--gold,#b98a4b)]";

export const reviewsGrid =
  "grid grid-cols-3 items-stretch gap-6 max-[900px]:mx-auto max-[900px]:max-w-[540px] max-[900px]:grid-cols-1";

export const reviewCard =
  "relative flex flex-col gap-3 rounded-[4px] bg-white p-[clamp(1.5rem,3vw,2.25rem)] text-left shadow-[0_10px_30px_rgba(60,40,25,0.05)]";

export const reviewMark =
  "absolute top-[0.35rem] right-5 font-[family-name:var(--font-display)] text-[4rem] leading-none text-[var(--sand,#ece0c9)]";

export const reviewStars = `${stars} text-base`;

export const reviewBody =
  "flex-1 font-[family-name:var(--font-display)] text-[1.15rem] leading-[1.6] text-[var(--ink,#241f1b)]";

export const reviewFoot =
  "flex flex-col gap-[0.15rem] border-t border-[var(--line,#d9ccb4)] pt-3";

export const reviewName =
  "text-[0.8rem] font-semibold tracking-[0.08em] text-[var(--ink,#241f1b)] uppercase";

export const reviewProduct =
  "text-[0.72rem] tracking-[0.06em] text-copper uppercase";

export const story =
  "relative flex min-h-[clamp(460px,72vh,640px)] items-center justify-center overflow-hidden bg-[#5a3826] text-center text-white";

export const storyBg =
  "absolute inset-x-0 top-[-20%] z-0 h-[140%] bg-[#5a3826] bg-cover bg-center bg-no-repeat will-change-transform motion-reduce:top-0 motion-reduce:h-full";

export const storyScrim =
  "absolute inset-0 z-[1] bg-[linear-gradient(180deg,rgba(40,16,8,0.42),rgba(40,16,8,0.62))]";

export const storyInner =
  "relative z-[2] max-w-[42rem] px-[var(--gutter,1.5rem)] py-[clamp(3.5rem,10vw,6rem)]";

export const storyEyebrow =
  "m-0 mb-[1.1rem] inline-flex items-center justify-center gap-3 text-[0.72rem]! font-semibold! tracking-[0.28em] text-[#f0c4ad]! uppercase before:h-px before:w-[34px] before:bg-current before:opacity-75 before:content-['']";

export const storyTitle =
  "m-0 mb-[1.15rem] font-[family-name:var(--font-display)] text-[clamp(1.7rem,3.4vw,2.5rem)]! leading-[1.05] font-medium tracking-[0.005em] text-white! [text-shadow:0_1px_24px_rgba(0,0,0,0.28)] [&_em]:font-normal [&_em]:text-inherit [&_em]:italic";

export const storyText =
  "mx-auto mb-7 max-w-[36rem] text-[clamp(0.95rem,1.5vw,1.05rem)] leading-[1.65] text-[#f3e6dd]";

export const storyCta =
  "inline-flex min-h-12 items-center justify-center rounded-full bg-copper px-[1.6rem] text-[0.78rem]! font-medium! tracking-[0.12em] text-white! uppercase no-underline transition-[background,transform] duration-250 hover:-translate-y-px hover:bg-copper-deep hover:text-white!";

export const plansSection = `${sectionBlock} bg-[var(--cream-2,#f3ebda)]`;

export const plansGrid =
  "grid grid-cols-3 items-stretch gap-6 max-[900px]:mx-auto max-[900px]:max-w-[460px] max-[900px]:grid-cols-1";

export const planCard =
  "flex flex-col gap-2 rounded-[4px] bg-white p-[clamp(1.25rem,2.1vw,1.85rem)] shadow-[0_10px_30px_rgba(60,40,25,0.05)] transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_20px_44px_rgba(60,40,25,0.08)]";

export const planCardFeatured =
  "shadow-[0_24px_56px_rgba(60,40,25,0.1)] max-[900px]:order-first";

export const planHead = "flex min-h-[1.6rem] items-center justify-between gap-2";

export const planName = "text-[1.02rem] font-semibold tracking-[0.02em]";

export const planBadge =
  "rounded-[2px] bg-copper px-[0.52rem] py-[0.28rem] text-[0.56rem]! font-semibold! tracking-[0.1em] text-white! uppercase whitespace-nowrap";

export const planPrice = "flex items-baseline gap-[0.35rem]";

export const planAmount = "text-[1.7rem] font-bold tracking-[-0.01em] text-[var(--ink,#241f1b)]";

export const planPer = "text-[0.78rem] text-[var(--ink-2,#5b5148)]";

export const planDesc = "text-[0.82rem] text-[var(--ink-2,#5b5148)]";

export const planRule = "my-2 h-0 w-full border-0 border-t border-[var(--line,#d9ccb4)]";

export const planFeatures =
  "grid flex-1 list-none gap-2 p-0 [&_li]:relative [&_li]:ps-[1.45rem] [&_li]:text-[0.8rem] [&_li]:text-[var(--ink,#241f1b)] [&_li]:before:absolute [&_li]:before:start-0 [&_li]:before:top-[0.22em] [&_li]:before:h-[6px] [&_li]:before:w-[11px] [&_li]:before:-rotate-45 [&_li]:before:border-b-[1.6px] [&_li]:before:border-s-[1.6px] [&_li]:before:border-copper [&_li]:before:content-['']";

const planBtn =
  "mt-2 inline-flex min-h-12 w-full cursor-pointer items-center justify-center border px-8 text-[0.8rem]! font-semibold! tracking-[0.08em] uppercase no-underline transition-[background,color,border-color] duration-300";

export const planCta =
  `${planBtn} border-copper bg-copper text-white! hover:border-copper-deep hover:bg-copper-deep hover:text-white!`;

export const planCtaGhost =
  `${planBtn} border-copper bg-transparent text-copper! hover:bg-copper hover:text-white!`;

export const bottle =
  "relative grid aspect-square w-full place-items-center overflow-hidden bg-[radial-gradient(120%_80%_at_50%_18%,rgba(255,255,255,0.55),transparent_60%),linear-gradient(160deg,var(--sand,#ece0c9),var(--beige,#e8d8bb))] after:pointer-events-none after:aspect-[3/4] after:w-[34%] after:max-w-[120px] after:bg-[url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 120 160%27 fill=%27none%27 stroke=%27%238c4435%27 stroke-width=%272.4%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Crect x=%2744%27 y=%276%27 width=%2732%27 height=%2720%27 rx=%274%27/%3E%3Cpath d=%27M51 26v11h18V26%27/%3E%3Crect x=%2720%27 y=%2737%27 width=%2780%27 height=%27115%27 rx=%2716%27/%3E%3Crect x=%2737%27 y=%2776%27 width=%2746%27 height=%2740%27 rx=%273%27 stroke-opacity=%27.6%27/%3E%3Cpath d=%27M32 54v34%27 stroke-opacity=%27.4%27/%3E%3Cpath d=%27M50 96h20%27 stroke-opacity=%27.6%27/%3E%3C/svg%3E')] after:bg-contain after:bg-center after:bg-no-repeat after:opacity-50 after:content-['']";
