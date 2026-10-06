"use client";

import { useEffect, useId, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useAddToCart } from "@/features/cart";
import { formatMoney } from "@/features/home/utils/formatMoney";
import type { CatalogProduct } from "@/features/catalog/constants/catalogProducts";
import { usePromotionDiscovery } from "../hooks/usePromotionDiscovery";
import type { OfferContext, OfferIcon, PdpOffer } from "../types/offerVoucher";
import { bundlePercent, mapDiscoveryOffers, resolveOfferValue, voucherSubline } from "../utils/offerVoucher";

export function OffersForYou({
  product,
  quantity,
  open,
  onOpenChange,
  openerRef,
}: {
  product: CatalogProduct;
  quantity: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  openerRef: RefObject<HTMLElement | null>;
}) {
  const query = usePromotionDiscovery(product.id ? [product.id] : []);
  const discovery = query.data;
  const arabic = discovery?.locale.toLowerCase().startsWith("ar") ?? false;
  const offers = discovery ? mapDiscoveryOffers(discovery.offers, arabic) : [];
  if (!offers.length) return null;

  return (
    <>
      <OfferVoucher
        offers={offers}
        arabic={arabic}
        onOpen={(trigger) => {
          openerRef.current = trigger;
          onOpenChange(true);
        }}
      />
      {open ? (
        <OffersDialog
          offers={offers}
          arabic={arabic}
          product={product}
          quantity={Math.max(1, quantity)}
          onClose={() => {
            onOpenChange(false);
            openerRef.current?.focus();
          }}
        />
      ) : null}
    </>
  );
}

function OfferVoucher({
  offers,
  arabic,
  onOpen,
}: {
  offers: PdpOffer[];
  arabic: boolean;
  onOpen: (trigger: HTMLButtonElement) => void;
}) {
  const titleId = useId();
  const subId = useId();
  const first = offers[0];
  const headline = first.headline || (typeof first.title === "string" ? first.title : "");
  const subline = voucherSubline(offers, arabic);
  const percent = bundlePercent(offers);
  const countLabel = arabic ? `${offers.length} عروض` : `${offers.length} ${offers.length === 1 ? "offer" : "offers"}`;

  return (
    <button
      type="button"
      dir={arabic ? "rtl" : "ltr"}
      className="group flex w-full cursor-pointer overflow-visible rounded-2xl border border-[#E8D5B0] bg-[#FFF8EC] text-start shadow-[0_12px_28px_rgba(138,67,50,0.16)]"
      aria-haspopup="dialog"
      aria-controls="pdp-offers-dialog"
      aria-describedby={`${titleId} ${subId}`}
      onClick={(event) => onOpen(event.currentTarget)}
    >
      <span className="relative grid w-[132px] shrink-0 place-items-center bg-[#8A4332] px-3 py-4 text-[#FFF8EC] max-[420px]:w-[100px] ltr:rounded-l-2xl rtl:rounded-r-2xl">
        <span className="grid justify-items-center gap-0.5">
          <span className="text-[0.68rem] font-bold tracking-[0.16em] uppercase">{arabic ? "حتى" : "Up to"}</span>
          <span className="font-[family-name:var(--font-display)] text-[2.15rem] leading-none max-[420px]:text-[1.7rem]">
            {percent ? `${percent}%` : offers.length}
          </span>
          <span className="text-[0.78rem] font-bold tracking-[0.14em] uppercase">{percent ? (arabic ? "خصم" : "Off") : arabic ? "عروض" : "Offers"}</span>
        </span>
        <span aria-hidden="true" className="pointer-events-none absolute top-0 size-[22px] rounded-full border border-[#E8D5B0] bg-[var(--cream,#faf6ee)] ltr:right-0 ltr:[transform:translate(50%,-50%)] rtl:left-0 rtl:[transform:translate(-50%,-50%)]" />
        <span aria-hidden="true" className="pointer-events-none absolute bottom-0 size-[22px] rounded-full border border-[#E8D5B0] bg-[var(--cream,#faf6ee)] ltr:right-0 ltr:[transform:translate(50%,50%)] rtl:left-0 rtl:[transform:translate(-50%,50%)]" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1.5 border-s border-dashed border-[#E8D5B0] px-4 py-3.5">
        <span className="flex items-center justify-between gap-3">
          <span className="text-[0.68rem] font-bold tracking-[0.16em] text-[#8A4332] uppercase">{arabic ? "عروض لك" : "Offers for you"}</span>
          <span className="inline-flex min-h-7 items-center rounded-full border border-[#8A4332] px-2.5 text-[0.72rem] font-semibold text-[#8A4332]">{countLabel}</span>
        </span>
        <span id={titleId} className="font-[family-name:var(--font-display)] text-[19px] leading-tight text-[#211B17]">
          {headline}
        </span>
        {subline ? (
          <span id={subId} className="text-[0.82rem] leading-snug text-[#5F534A]">
            {subline}
          </span>
        ) : (
          <span id={subId} className="sr-only">
            {countLabel}
          </span>
        )}
        <span className="mt-1 inline-flex items-center gap-1 text-[0.75rem] font-bold tracking-[0.08em] text-[#8A4332] uppercase">
          {arabic ? "عرض كل العروض" : "View all offers"}
          <svg viewBox="0 0 20 20" className="size-3.5 rtl:-scale-x-100" fill="none" aria-hidden="true">
            <path d="M7 4.5 12.5 10 7 15.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </span>
    </button>
  );
}

function OffersDialog({
  offers,
  arabic,
  product,
  quantity,
  onClose,
}: {
  offers: PdpOffer[];
  arabic: boolean;
  product: CatalogProduct;
  quantity: number;
  onClose: () => void;
}) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [closing, setClosing] = useState(false);
  const [toast, setToast] = useState("");
  const [mounted, setMounted] = useState(false);
  const { addToCart } = useAddToCart();
  const price = product.price ?? 0;
  const ctx: OfferContext = {
    qty: quantity,
    price,
    subtotal: price * quantity,
    fmt: (amount) => formatMoney(amount, product.currency),
  };
  const percent = bundlePercent(offers);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const node = dialogRef.current;
    if (!node) return;
    if (!node.open) node.showModal();
    node.querySelector<HTMLElement>("[data-offer-close]")?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
      if (node.open) node.close();
    };
  }, [mounted]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const requestClose = () => {
    if (closing) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      onClose();
      return;
    }
    setClosing(true);
    window.setTimeout(onClose, 200);
  };

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setToast(arabic ? `تم نسخ الرمز ${code}` : `Code ${code} copied`);
    } catch {
      setToast(arabic ? "تعذر نسخ الرمز" : "Could not copy the code");
    }
  };

  if (!mounted) return null;

  return createPortal(
    <dialog
      ref={dialogRef}
      id="pdp-offers-dialog"
      dir={arabic ? "rtl" : "ltr"}
      aria-labelledby={titleId}
      data-closing={closing ? "" : undefined}
      className="offer-dialog z-[1400] m-auto h-fit max-h-[min(84vh,760px)] w-[min(560px,calc(100%-2rem))] overflow-hidden rounded-[14px] border-0 bg-[#FFF8EC] p-0 text-[#211B17] shadow-[0_28px_70px_rgba(24,20,17,0.28)] open:animate-offer-pop data-closing:animate-offer-out motion-reduce:animate-none max-[640px]:mt-auto max-[640px]:mb-0 max-[640px]:max-h-[88vh] max-[640px]:w-full max-[640px]:rounded-t-2xl max-[640px]:rounded-b-none max-[640px]:open:animate-offer-sheet max-[640px]:data-closing:animate-offer-sheet-out max-[640px]:pb-[env(safe-area-inset-bottom)]"
      onCancel={(event) => {
        event.preventDefault();
        requestClose();
      }}
      onMouseDown={(event) => {
        const node = dialogRef.current;
        if (!node) return;
        const rect = node.getBoundingClientRect();
        const inside =
          event.clientX >= rect.left &&
          event.clientX <= rect.right &&
          event.clientY >= rect.top &&
          event.clientY <= rect.bottom;
        if (!inside) requestClose();
      }}
      onClick={(event) => {
        const link = (event.target as HTMLElement).closest("a[href]");
        if (link instanceof HTMLAnchorElement && (link.getAttribute("href") ?? "").startsWith("#")) requestClose();
      }}
    >
      <div className="flex max-h-[min(84vh,760px)] flex-col max-[640px]:max-h-[88vh]">
        <header className="relative bg-[#8A4332] px-5 pt-5 pb-4 text-[#FFF8EC]">
          <div className="flex items-start gap-3">
            <span className="inline-flex min-h-11 shrink-0 items-center rounded-xl bg-[#FFF8EC] px-3 font-[family-name:var(--font-display)] text-[1.05rem] leading-none text-[#8A4332]">
              {percent ? `${percent}% ${arabic ? "خصم" : "off"}` : arabic ? `${offers.length} عروض` : `${offers.length} offers`}
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="m-0 text-[0.68rem] font-bold tracking-[0.16em] uppercase">{arabic ? "عروض لك" : "Offers for you"}</p>
              <h2 id={titleId} className="m-0 mt-1 font-[family-name:var(--font-display)] text-[1.35rem] leading-none">
                {arabic ? `${offers.length} طرق للتوفير` : `${offers.length} ${offers.length === 1 ? "way" : "ways"} to save`}
              </h2>
              <p className="m-0 mt-1 line-clamp-2 text-[0.82rem] text-[#FFF8EC]/85">
                {arabic ? `على ${product.title}` : `on ${product.title}`}
              </p>
            </div>
            <button
              type="button"
              data-offer-close
              className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-full border border-[#FFF8EC] bg-transparent text-[#FFF8EC]"
              aria-label={arabic ? "إغلاق" : "Close"}
              onClick={requestClose}
            >
              <svg viewBox="0 0 20 20" className="size-4" fill="none" aria-hidden="true">
                <path d="M5 5l10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </button>
          </div>
          <span aria-hidden="true" className="pointer-events-none absolute inset-x-4 bottom-0 border-b border-dashed border-[#FFF8EC]/80" />
        </header>
        <ul className="m-0 min-h-0 flex-1 list-none overflow-y-auto p-0">
          {offers.map((offer) => (
            <OfferRow key={offer.id} offer={offer} ctx={ctx} onCopy={(code) => void copyCode(code)} />
          ))}
        </ul>
        <footer className="flex items-center justify-between gap-3 border-t border-dashed border-[#E8D5B0] bg-[#FFFDF9] px-5 py-3.5">
          <div>
            <p className="m-0 text-[0.72rem] font-semibold tracking-[0.08em] text-[#5F534A] uppercase">{arabic ? "المجموع" : "Your total"}</p>
            <p className="m-0 font-[family-name:var(--font-display)] text-[1.25rem] text-[#211B17]">{formatMoney(ctx.subtotal, product.currency)}</p>
          </div>
          {product.isSellable === false ? null : (
            <button
              type="button"
              className="inline-flex min-h-11 cursor-pointer items-center rounded-full border-0 bg-[#8A4332] px-4 text-[0.82rem] font-semibold text-white hover:bg-[#733626]"
              onClick={() => {
                void addToCart({
                  sku: product.sku,
                  variantId: product.variantId,
                  slug: product.slug,
                  title: product.title,
                  imageUrl: product.imageUrl,
                  price: product.price,
                  currency: product.currency,
                  quantity,
                });
                requestClose();
              }}
            >
              {arabic ? `أضف ${quantity} إلى الحقيبة` : `Add ${quantity} to bag`}
            </button>
          )}
        </footer>
      </div>
      {toast ? (
        <p className="pointer-events-none absolute inset-x-0 bottom-4 z-10 mx-auto w-fit rounded-full bg-[#211B17] px-3 py-2 text-[0.78rem] text-[#FFF8EC]" role="status">
          {toast}
        </p>
      ) : null}
    </dialog>,
    document.body,
  );
}

function OfferRow({
  offer,
  ctx,
  onCopy,
}: {
  offer: PdpOffer;
  ctx: OfferContext;
  onCopy: (code: string) => void;
}) {
  const title = resolveOfferValue(offer.title, ctx);
  const text = resolveOfferValue(offer.text, ctx);
  const progress = offer.progress?.(ctx);
  const percent = progress ? Math.round((progress.value / progress.max) * 100) : 0;
  return (
    <li className={`border-b border-dashed border-[#E8D5B0] px-5 py-3.5 last:border-b-0 ${offer.featured ? "bg-[#FFFDF9]" : ""}`}>
      <div className="flex items-start gap-3">
        <span className={`grid size-10 shrink-0 place-items-center rounded-full ${offer.featured ? "bg-[#8A4332] text-[#FFF8EC]" : "bg-[#F6E1D6] text-[#8A4332]"}`}>
          <OfferGlyph icon={offer.icon} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="m-0 text-[0.66rem] font-bold tracking-[0.12em] text-[#8A4332] uppercase">{offer.tag}</p>
          <p className="m-0 mt-0.5 text-[0.95rem] font-semibold text-[#211B17]">{title}</p>
          {text ? <p className="m-0 mt-1 text-[0.82rem] leading-snug text-[#5F534A]">{text}</p> : null}
          {progress ? (
            <div className="mt-2">
              <div
                className="h-1.5 overflow-hidden rounded-full bg-[#F1DFB8]"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={progress.max}
                aria-valuenow={Math.round(progress.value)}
                aria-label={progress.label}
              >
                <div className="h-full bg-[#8A4332]" style={{ width: `${percent}%` }} />
              </div>
              <p className="m-0 mt-1 text-[0.75rem] text-[#5F534A]">{progress.label}</p>
            </div>
          ) : null}
          {offer.action && "href" in offer.action ? (
            <Link className="mt-2 inline-flex min-h-11 items-center text-[0.78rem] font-bold tracking-[0.06em] text-[#8A4332] uppercase no-underline" href={offer.action.href}>
              {offer.action.label}
            </Link>
          ) : null}
          {offer.action && "copy" in offer.action ? (
            <button
              type="button"
              className="mt-2 inline-flex min-h-11 cursor-pointer items-center border-0 bg-transparent p-0 text-[0.78rem] font-bold tracking-[0.06em] text-[#8A4332] uppercase"
              onClick={() => onCopy(offer.action && "copy" in offer.action ? offer.action.copy : "")}
            >
              {offer.action.label}
            </button>
          ) : null}
        </div>
      </div>
    </li>
  );
}

function OfferGlyph({ icon }: { icon: OfferIcon }) {
  const common = { viewBox: "0 0 20 20", fill: "none", "aria-hidden": true as const, className: "size-5" };
  if (icon === "bundle") {
    return (
      <svg {...common}>
        <rect x="3" y="8" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <rect x="8" y="3" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );
  }
  if (icon === "delivery") {
    return (
      <svg {...common}>
        <path d="M2.5 13.2V6.2h8.2v7" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10.7 8.2h3.1l2.7 2.6v2.4h-1.6" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="6" cy="14.2" r="1.5" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="13.4" cy="14.2" r="1.5" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );
  }
  if (icon === "card") {
    return (
      <svg {...common}>
        <rect x="2.5" y="4.5" width="15" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M2.5 8.2h15" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );
  }
  if (icon === "star") {
    return (
      <svg {...common}>
        <path d="m10 3 1.8 3.7 4.1.6-3 2.9.7 4.1L10 12.4 6.4 14.3l.7-4.1-3-2.9 4.1-.6z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      </svg>
    );
  }
  if (icon === "gift") {
    return (
      <svg {...common}>
        <rect x="3.5" y="8" width="13" height="8.5" rx="1.2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M3.5 11.2h13M10 8v8.5M10 8c0-2.2-1.4-3.5-2.8-3.5S5.2 6 6.6 7.4C7.6 8.4 10 8 10 8Zm0 0c0-2.2 1.4-3.5 2.8-3.5S14.8 6 13.4 7.4C12.4 8.4 10 8 10 8Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    );
  }
  if (icon === "bank") {
    return (
      <svg {...common}>
        <path d="M3 8.5 10 4l7 4.5M4.5 9v5.5M8 9v5.5M12 9v5.5M15.5 9v5.5M3.5 15.5h13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (icon === "clock") {
    return (
      <svg {...common}>
        <circle cx="10" cy="10" r="6.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10 6.5V10l2.4 1.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M4 10.2 10 4.5l6 5.7v5.3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="10" cy="10" r="1.2" fill="currentColor" />
    </svg>
  );
}
