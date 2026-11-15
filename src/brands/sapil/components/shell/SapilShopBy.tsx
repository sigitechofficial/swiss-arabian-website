"use client";

import { useSapilCopy } from "../../i18n/SapilCopy";
import { Subnav, type SubnavItem } from "../../ui";
import { SapilLink } from "../shared/SapilLink";
import { useSapilPrice } from "../shared/useSapilPrice";
import { featuredPriceTier, isCurrentHref, type ShopByChip } from "./shellData";

export type SapilShopByProps = {
  chips: ShopByChip[];
  pathname: string;
  currency: string | null;
  /** market price edits (Under X); the middle one gets the sale chip */
  priceEditTiers: number[];
  /** market free-delivery threshold; the info text is hidden without it */
  freeDeliveryThreshold: number | null;
  cashOnDelivery: boolean | null;
};

/** The sale chip for the market's featured price edit, when it has tiers. */
export function priceEditChip(tiers: number[], currency: string | null, label: (amount: string) => string, price: (n: number, c: string) => string) {
  const tier = featuredPriceTier(tiers);
  if (tier == null || !currency) return null;
  return {
    id: `under-${tier}`,
    label: label(price(tier, currency)),
    href: `/products?under=${tier}`,
    color: "pink" as const,
    sale: true,
  };
}

/** v9 `.subnav`: "Shop by" chips and the market's delivery / payment note. Renders nothing without chips. */
export function SapilShopBy({ chips, pathname, currency, priceEditTiers, freeDeliveryThreshold, cashOnDelivery }: SapilShopByProps) {
  const t = useSapilCopy();
  const price = useSapilPrice();
  const sale = priceEditChip(priceEditTiers, currency, (amount) => t("shell.underPrice", { amount }), price);
  const items: SubnavItem[] = [...chips, ...(sale ? [sale] : [])].map((c) => ({
    label: c.label,
    href: c.href,
    color: c.color,
    sale: c.sale,
    current: isCurrentHref(c.href, pathname) && !c.href.includes("?"),
  }));
  if (!items.length) return null;
  const notes = [
    freeDeliveryThreshold != null && currency
      ? t("shell.freeDeliveryOver", { amount: price(freeDeliveryThreshold, currency) })
      : null,
    cashOnDelivery ? t("shell.payOnDelivery") : null,
  ].filter(Boolean);
  return (
    <Subnav
      label={t("shell.shopBy")}
      items={items}
      info={notes.length ? notes.join(" · ") : undefined}
      LinkComponent={SapilLink}
    />
  );
}
