"use client";

import { useState } from "react";
import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { useShopTranslator } from "@/lib/i18n/ShopLocaleProvider";
import { useNow } from "../hooks/useStoreLocator";
import { useStoreAvailability } from "../hooks/useStoreAvailability";
import type { StoreStock } from "../types";
import { storePath, storesPath, telUrl } from "../utils/storeLinks";
import { SaStatusLine } from "./SaStoreFinder";

const SHOWN = 4;

const STOCK_TONE: Record<StoreStock, string> = {
  IN_STOCK: "text-[#2f6b3f]",
  LOW: "text-terra",
  OUT_OF_STOCK: "text-sa-muted",
};

/**
 * Swiss Arabian product page: which shops have this product, from D365 stock
 * per shop warehouse. Hidden until shops have warehouses (or the brand has no
 * store locator); quantities are never shown.
 */
export function SaInStoreAvailability({ sku, zoneCode }: { sku?: string | null; zoneCode: string }) {
  const t = useShopTranslator();
  const now = useNow();
  const { tracked, stores, inStockCount } = useStoreAvailability(sku, zoneCode);
  const [all, setAll] = useState(false);
  if (!tracked) return null;

  const stockText: Record<StoreStock, string> = {
    IN_STOCK: t("stores.stockIn"),
    LOW: t("stores.stockLow"),
    OUT_OF_STOCK: t("stores.stockOut"),
  };
  const list = inStockCount ? stores.filter((s) => s.stock !== "OUT_OF_STOCK") : [];
  const shown = all ? list : list.slice(0, SHOWN);

  return (
    <section aria-labelledby="pdp-in-store" className="mt-6 border-t border-sa-border pt-5">
      <h2 id="pdp-in-store" className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">
        {t("stores.inStoreTitle")}
      </h2>
      {list.length ? (
        <>
          <p className="mt-1.5 text-[12.5px] text-sa-muted">{t("stores.inStoreIntro")}</p>
          <ul className="mt-3 flex flex-col divide-y divide-sa-border border-y border-sa-border">
            {shown.map((s) => (
              <li key={s.slug} className="flex items-start justify-between gap-3 py-3">
                <span className="min-w-0">
                  <LocaleLink href={storePath(s)} className="text-[14px] font-semibold text-sa-primary hover:text-terra">
                    {s.name}
                  </LocaleLink>
                  <span className="block text-[12px] text-sa-secondary">{s.areaName}</span>
                  <SaStatusLine store={s} now={now} className="mt-0.5 block text-[12px]" />
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1 text-[12.5px]">
                  <span className={`font-semibold ${STOCK_TONE[s.stock]}`}>{stockText[s.stock]}</span>
                  {s.phone ? (
                    <a href={telUrl(s.phone)} dir="ltr" className="text-sa-secondary hover:text-terra">
                      {s.phone}
                    </a>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
          {list.length > SHOWN && !all ? (
            <button type="button" onClick={() => setAll(true)} className="mt-2 text-[13px] font-semibold text-terra hover:underline">
              {t("stores.inStoreShowAll", { count: list.length })}
            </button>
          ) : null}
        </>
      ) : (
        <p className="mt-2 text-[13px] text-sa-secondary">
          {t("stores.inStoreNone")}{" "}
          <LocaleLink href={storesPath()} className="font-semibold text-terra hover:underline">
            {t("stores.inStoreFindShop")}
          </LocaleLink>
        </p>
      )}
    </section>
  );
}
