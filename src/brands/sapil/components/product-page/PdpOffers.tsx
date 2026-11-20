"use client";

import { useEffect, useState } from "react";
import type { CatalogProduct } from "@/features/catalog/constants/catalogProducts";
import { usePromotionDiscovery } from "@/features/promotions/hooks/usePromotionDiscovery";
import type { OfferContext, PdpOffer } from "@/features/promotions/types/offerVoucher";
import { bundlePercent, mapDiscoveryOffers, resolveOfferValue, voucherSubline } from "@/features/promotions/utils/offerVoucher";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { useSapilCopy } from "../../i18n/SapilCopy";
import { Dialog, cx } from "../../ui";
import { SapilLocaleLink } from "../product/SapilLocaleLink";

/**
 * "Offers for you" on the product page: the campaigns this product is part of
 * (bundles, free delivery, codes …), from the same promotion discovery as
 * Swiss Arabian, drawn in v9: a card under the buy row that opens a dialog with
 * every offer, its progress at the current quantity, and its link or code.
 * Nothing when the product has no offer.
 */
export function PdpOffers({ product, quantity, money }: { product: CatalogProduct; quantity: number; money: (n: number) => string }) {
  const t = useSapilCopy();
  const shop = useShopCopy();
  const query = usePromotionDiscovery(product.id ? [product.id] : []);
  const [open, setOpen] = useState(false);
  const offers = query.data ? mapDiscoveryOffers(query.data.offers, shop) : [];
  if (!offers.length) return null;

  const first = offers[0];
  const headline = first.headline || (typeof first.title === "string" ? first.title : "");
  const subline = voucherSubline(offers, shop);
  const percent = bundlePercent(offers);

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        data-sapil="offers"
        className="mt-[16px] w-full flex items-center gap-[14px] text-start bg-sapil-white rounded-[20px] p-[14px] pe-[18px] border border-dashed border-sapil-accent/40 hover:border-sapil-accent [transition:border-color_.2s]"
      >
        <span className="shrink-0 w-[64px] h-[64px] rounded-[16px] bg-sapil-accent text-sapil-white grid place-items-center text-center leading-[1]">
          <span>
            <b className="block font-sapil-display font-[400] text-[24px]">{percent ? `${percent}%` : offers.length}</b>
            <small className="block text-[10px] font-[700] tracking-[.12em] uppercase mt-[3px]">
              {percent ? t("product.offersOff") : t("product.offersWord")}
            </small>
          </span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-[700] tracking-[.14em] uppercase text-sapil-accent">
            {t("product.offersEyebrow")} · {t("product.offersCount", { count: offers.length })}
          </span>
          <span className="block font-[600] text-[16px] leading-[1.25] mt-[2px] truncate">{headline}</span>
          {subline ? <span className="block text-[13px] text-sapil-ink-2 truncate">{subline}</span> : null}
        </span>
        <span className="shrink-0 text-[13px] font-[700] text-sapil-accent whitespace-nowrap">{t("product.offersSeeAll")}</span>
      </button>
      {open ? (
        <OffersDialog offers={offers} product={product} quantity={Math.max(1, quantity)} money={money} onClose={() => setOpen(false)} />
      ) : null}
    </>
  );
}

function OffersDialog({
  offers,
  product,
  quantity,
  money,
  onClose,
}: {
  offers: PdpOffer[];
  product: CatalogProduct;
  quantity: number;
  money: (n: number) => string;
  onClose: () => void;
}) {
  const t = useSapilCopy();
  const [toast, setToast] = useState("");
  const price = product.price ?? 0;
  const ctx: OfferContext = { qty: quantity, price, subtotal: price * quantity, fmt: money };

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(""), 2200);
    return () => window.clearTimeout(id);
  }, [toast]);

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setToast(t("product.offersCodeCopied", { code }));
    } catch {
      setToast(t("product.offersCopyFailed"));
    }
  };

  return (
    <Dialog open onClose={onClose} label={t("product.offersTitle")} closeLabel={t("product.close")}>
      <div className="p-[32px] max-600:p-[22px]">
        <p className="text-[12px] font-[700] tracking-[.14em] uppercase text-sapil-accent">{t("product.offersEyebrow")}</p>
        <p role="heading" aria-level={2} className="sapil-h text-[32px] mt-[8px]">
          {t("product.offersTitle")}
        </p>
        <p className="text-[15px] text-sapil-ink-2 mt-[6px]">{t("product.offersOn", { name: product.title })}</p>
        <ul className="list-none p-0 mt-[20px] grid gap-[10px]">
          {offers.map((offer) => (
            <OfferRow key={offer.id} offer={offer} ctx={ctx} onCopy={(code) => void copyCode(code)} />
          ))}
        </ul>
        <p role="status" className="text-[14px] text-sapil-ink-2 mt-[14px] empty:hidden">
          {toast}
        </p>
      </div>
    </Dialog>
  );
}

function OfferRow({ offer, ctx, onCopy }: { offer: PdpOffer; ctx: OfferContext; onCopy: (code: string) => void }) {
  const title = resolveOfferValue(offer.title, ctx);
  const text = resolveOfferValue(offer.text, ctx);
  const progress = offer.progress?.(ctx);
  const percent = progress ? Math.round((progress.value / progress.max) * 100) : 0;
  const action =
    "mt-[10px] inline-flex items-center min-h-[38px] px-[16px] rounded-full border border-sapil-accent/40 text-sapil-accent text-[13px] font-[700] hover:bg-sapil-accent hover:text-sapil-white [transition:background_.2s,color_.2s]";
  return (
    <li className={cx("bg-sapil-paper rounded-[18px] p-[16px]", offer.featured && "ring-1 ring-sapil-accent/30")}>
      <p className="text-[11px] font-[700] tracking-[.12em] uppercase text-sapil-accent">{offer.tag}</p>
      <p className="font-[600] text-[16px] leading-[1.3] mt-[2px]">{title}</p>
      {text ? <p className="text-[14px] leading-[1.5] text-sapil-ink-2 mt-[4px]">{text}</p> : null}
      {progress ? (
        <div className="mt-[10px]">
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={progress.max}
            aria-valuenow={Math.round(progress.value)}
            aria-label={progress.label}
            className="h-[6px] rounded-full bg-sapil-line overflow-hidden"
          >
            <div className="h-full bg-sapil-accent" style={{ width: `${percent}%` }} />
          </div>
          <p className="text-[13px] text-sapil-ink-2 mt-[4px]">{progress.label}</p>
        </div>
      ) : null}
      {offer.action && "href" in offer.action ? (
        <SapilLocaleLink href={offer.action.href} className={action}>
          {offer.action.label}
        </SapilLocaleLink>
      ) : null}
      {offer.action && "copy" in offer.action ? (
        <button type="button" className={action} onClick={() => onCopy(offer.action && "copy" in offer.action ? offer.action.copy : "")}>
          {offer.action.label}
        </button>
      ) : null}
    </li>
  );
}
