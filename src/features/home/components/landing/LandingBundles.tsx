"use client";

import { useLayoutEffect, useState } from "react";
import Link from "next/link";
import { useLandingProducts } from "../../hooks/useLandingProducts";
import { formatMoney } from "../../utils/formatMoney";
import { pillSolid, visuallyHidden } from "@/styles/siteChrome";

/** Shop-this-bundle switches from a corner card to a fixed bottom sheet. */
const MOBILE_SHEET_BREAKPOINT = "(max-width: 1023px)";

const bundleSection =
  "group/campaign relative grid min-h-[clamp(440px,46vw,620px)] place-items-center overflow-hidden max-[1023px]:block max-[1023px]:min-h-0 max-[1023px]:data-[open=true]:[&_[data-campaign-actions]]:pointer-events-none max-[1023px]:data-[open=true]:[&_[data-campaign-actions]]:invisible max-[767px]:aspect-[535/690] max-[767px]:max-h-[min(68vh,620px)] min-[768px]:max-[1023px]:aspect-[16/10] min-[1024px]:place-items-end min-[1024px]:bg-[#e6c9a8]";

const bundlePicture = "absolute inset-0 m-0 block size-full";

const bundleMedia =
  "absolute inset-0 size-full object-cover max-[1023px]:object-center min-[1024px]:origin-center min-[1024px]:scale-[1.02] min-[1024px]:object-[center_38%]";

const bundleScrim =
  "pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(10,8,5,0.22)_0%,rgba(10,8,5,0.08)_32%,rgba(10,8,5,0.16)_58%,rgba(10,8,5,0.5)_100%)] max-[1023px]:bg-[linear-gradient(to_bottom,rgba(10,8,5,0.22)_0%,rgba(10,8,5,0.08)_32%,rgba(10,8,5,0.18)_58%,rgba(0,0,0,0.52)_100%)]";

const bundleContent =
  "relative z-[1] w-full text-white max-[1023px]:absolute max-[1023px]:inset-x-0 max-[1023px]:bottom-0 max-[1023px]:max-w-none max-[1023px]:px-[var(--chrome-edge,1rem)] max-[1023px]:py-4 max-[1023px]:text-start min-[768px]:max-[1023px]:ps-[11.7%] min-[768px]:max-[1023px]:pe-[var(--chrome-edge,1rem)] min-[1024px]:mx-auto min-[1024px]:max-w-[var(--chrome-content-max,1200px)] min-[1024px]:px-[var(--chrome-edge,1rem)] min-[1024px]:pb-[clamp(1.5rem,3vw,2.5rem)]";

const bundleActions =
  "mt-0 flex flex-row flex-wrap items-center justify-start gap-3 max-[767px]:flex-col max-[767px]:items-stretch min-[768px]:max-[1023px]:gap-6";

const bundlePill =
  "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full border px-[1.4rem] py-[0.7rem] font-[family-name:var(--font-sans)] text-[0.78rem]! font-semibold! tracking-[0.08em] text-white! uppercase no-underline shadow-[0_2px_12px_rgba(20,10,6,0.22)] transition-[background,border-color,color] duration-300 max-[767px]:w-full min-[1024px]:h-11 min-[1024px]:shadow-none";

const bundlePillSolid =
  `${bundlePill} border-copper bg-copper hover:border-copper-deep hover:bg-copper-deep hover:text-white! min-[1024px]:border-transparent min-[1024px]:bg-white min-[1024px]:text-[var(--ink,#241f1b)]! min-[1024px]:hover:border-transparent min-[1024px]:hover:bg-white min-[1024px]:hover:text-[var(--ink,#241f1b)]!`;

const bundlePillGhost =
  `${bundlePill} border-copper bg-copper hover:border-copper-deep hover:bg-copper-deep hover:text-white! min-[1024px]:border-white min-[1024px]:bg-transparent min-[1024px]:hover:border-white min-[1024px]:hover:bg-white min-[1024px]:hover:text-[var(--ink,#241f1b)]!`;

const shopPanel =
  "absolute right-[clamp(1rem,3vw,2.5rem)] bottom-[clamp(1.25rem,3vw,2.5rem)] z-[2] w-[min(360px,calc(100%-2rem))] overflow-hidden rounded-[14px] border border-white/28 bg-[linear-gradient(165deg,rgba(255,255,255,0.16)_0%,rgba(255,255,255,0.08)_100%)] shadow-[0_30px_60px_-12px_rgba(10,6,3,0.5),0_2px_8px_rgba(10,6,3,0.18),inset_0_1px_0_rgba(255,255,255,0.35),inset_0_-1px_0_rgba(0,0,0,0.12)] backdrop-blur-[32px] backdrop-saturate-[1.8] max-[1023px]:fixed max-[1023px]:inset-x-0 max-[1023px]:top-auto max-[1023px]:bottom-0 max-[1023px]:z-[120] max-[1023px]:w-auto max-[1023px]:max-h-[min(78vh,520px)] max-[1023px]:overflow-y-auto max-[1023px]:rounded-t-[14px] max-[1023px]:rounded-b-none max-[1023px]:border-white/65 max-[1023px]:border-b-0 max-[1023px]:bg-[linear-gradient(165deg,rgba(255,255,255,0.88)_0%,rgba(250,246,238,0.92)_100%)] max-[1023px]:shadow-[0_-16px_48px_rgba(10,6,3,0.35),inset_0_1px_0_rgba(255,255,255,0.9)] max-[1023px]:backdrop-blur-[40px] max-[1023px]:backdrop-saturate-[1.6]";

const shopHead =
  "flex items-center justify-between gap-3 border-b border-white/14 px-[1.85rem] pt-[1.15rem] pb-[0.9rem] max-[1023px]:border-[rgba(36,31,27,0.12)]";

const shopTitle =
  "text-[0.7rem] font-bold tracking-[0.14em] text-white/92 uppercase max-[1023px]:text-[var(--ink,#241f1b)]";

const shopClose =
  "inline-flex size-[30px] shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/16 bg-white/8 text-white/75 transition-[background,color] duration-300 hover:bg-white/20 hover:text-white max-[1023px]:border-[rgba(36,31,27,0.12)] max-[1023px]:bg-[rgba(36,31,27,0.06)] max-[1023px]:text-[rgba(36,31,27,0.7)] max-[1023px]:hover:bg-[rgba(36,31,27,0.12)] max-[1023px]:hover:text-[var(--ink,#241f1b)] [&_svg]:size-[15px]";

const shopList =
  "m-0 w-full list-none px-[1.85rem] py-[0.15rem] [&>li+li]:border-t [&>li+li]:border-white/12 max-[1023px]:[&>li+li]:border-[rgba(36,31,27,0.1)]";

const shopItem =
  "group/item flex items-center gap-3 py-[0.85rem] text-white/94 no-underline max-[1023px]:text-[var(--ink,#241f1b)]";

const shopThumb =
  "h-[60px] w-[50px] shrink-0 rounded-lg border border-white/16 bg-white/14 object-contain p-1 max-[1023px]:border-[rgba(36,31,27,0.1)] max-[1023px]:bg-white/90";

const shopName =
  "block text-[0.92rem] leading-[1.3] font-semibold text-white/96 transition-colors duration-300 group-hover/item:text-[var(--beige,#e8d8bb)] max-[1023px]:text-[var(--ink,#241f1b)] max-[1023px]:group-hover/item:text-copper";

const shopConc =
  "mt-[0.2rem] block text-[0.66rem] tracking-[0.09em] text-white/60 uppercase max-[1023px]:text-[rgba(36,31,27,0.55)]";

const shopPrice =
  "shrink-0 text-[0.92rem] font-semibold text-[var(--beige,#e8d8bb)] max-[1023px]:text-copper";

const shopCta = `${pillSolid} mx-[1.85rem] mt-4 mb-[1.4rem] box-border flex w-[calc(100%-3.7rem)]`;

const shopRestore =
  "absolute right-[clamp(1rem,3vw,2.5rem)] bottom-[clamp(1.25rem,3vw,2.5rem)] z-[2] inline-flex size-12 cursor-pointer items-center justify-center rounded-full border border-white/30 bg-white/14 text-white shadow-[0_12px_30px_rgba(10,6,3,0.35)] backdrop-blur-xl backdrop-saturate-[1.6] transition-[background] duration-300 hover:bg-white/24 max-[1023px]:top-[var(--chrome-edge,1rem)] max-[1023px]:right-[var(--chrome-edge,1rem)] max-[1023px]:bottom-auto max-[1023px]:z-10 max-[1023px]:size-[52px] max-[1023px]:border-copper max-[1023px]:bg-copper max-[1023px]:shadow-[0_10px_28px_rgba(10,6,3,0.45)] max-[1023px]:hover:border-copper-deep max-[1023px]:hover:bg-copper-deep [&_svg]:size-[19px]";

export function LandingBundles() {
  // Start closed so SSR / first paint never flash a fixed bottom sheet
  // over the hero. Desktop flips open in useLayoutEffect.
  const [open, setOpen] = useState(false);
  const { data } = useLandingProducts(8);
  const bundleItems = (data?.products ?? []).slice(0, 2);

  useLayoutEffect(() => {
    const mq = window.matchMedia(MOBILE_SHEET_BREAKPOINT);
    const sync = () => {
      // Mobile/tablet: always start (and stay default) closed — the sheet
      // is fixed over the hero. Desktop: open as a corner card.
      // Re-run on breakpoint change so resizing from desktop → mobile
      // does not leave the sheet stuck open.
      setOpen(!mq.matches);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return (
    <section
      className={bundleSection}
      id="campaign"
      data-open={open ? "true" : "false"}
      aria-labelledby="campaign-heading"
    >
      <picture className={bundlePicture}>
        <source
          media="(max-width: 767px)"
          srcSet="/assets/bundle-mobile-hero.webp"
          type="image/webp"
        />
        <img
          className={bundleMedia}
          src="/assets/bundles-hero.jpg"
          alt="Swiss Arabian Patchouli 01 perfume bottle on display"
          width={2048}
          height={1152}
          loading="lazy"
          decoding="async"
        />
      </picture>
      <div className={bundleScrim} aria-hidden="true" />
      <div className={bundleContent}>
        <p className={visuallyHidden}>Exclusive bundle offers</p>
        <h2 className={visuallyHidden} id="campaign-heading">
          Up to 25% off
        </h2>
        <p className={visuallyHidden}>On your favorite fragrances</p>
        <div className={bundleActions} data-campaign-actions>
          <Link className={bundlePillSolid} href="/collections/bundles">
            Shop Bundles
          </Link>
          <Link className={bundlePillGhost} href="/collections/gift-sets">
            Shop Gift Sets
          </Link>
        </div>
      </div>

      <aside
        className={shopPanel}
        aria-label="Shop this bundle"
        hidden={!open}
      >
        <div className={shopHead}>
          <span className={shopTitle}>Shop this bundle</span>
          <button
            className={shopClose}
            type="button"
            onClick={() => setOpen(false)}
          >
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              aria-hidden="true"
            >
              <path d="M5 5l10 10M15 5L5 15" />
            </svg>
            <span className={visuallyHidden}>Dismiss shop this bundle panel</span>
          </button>
        </div>
        <ul className={shopList} role="list">
          {bundleItems.map((product, index) => (
            <li key={product.id}>
              <Link
                className={shopItem}
                href={`/products/${product.slug}`}
              >
                <img
                  className={shopThumb}
                  src={product.imageUrl ?? `/assets/collection-${index + 1}.jpg`}
                  alt=""
                  width={600}
                  height={600}
                  loading="lazy"
                />
                <span className="min-w-0 flex-1">
                  <span className={shopName}>{product.title}</span>
                  <span className={shopConc}>
                    {product.subtitle ?? "Eau de Parfum"}
                  </span>
                </span>
                <span className={shopPrice}>
                  {formatMoney(product.price, product.currency)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <Link className={shopCta} href="/collections/bundles">
          Shop This Bundle
        </Link>
      </aside>

      <button
        className={shopRestore}
        type="button"
        hidden={open}
        onClick={() => setOpen(true)}
      >
        <svg
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          aria-hidden="true"
        >
          <path d="M10 4.5a1.4 1.4 0 1 1 1 2.4L10 8l7 5H3l7-5" />
        </svg>
        <span className={visuallyHidden}>Show shop this bundle panel</span>
      </button>
    </section>
  );
}
