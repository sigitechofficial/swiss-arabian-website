"use client";

import { useEffect, useMemo, type FormEvent } from "react";
import { brandDisplayName } from "@/lib/brand";
import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { useShopLocale, useShopTranslator } from "@/lib/i18n/ShopLocaleProvider";
import { intlLocale } from "@/lib/i18n/locales";
import { useStoreLocator, type LocatorStore } from "../hooks/useStoreLocator";
import type { StoreAreaSummary, StoreCard } from "../types";
import { directionsUrl, storePath, telUrl } from "../utils/storeLinks";
import { storeStatusText, type StatusTone } from "../utils/storeText";
import { StoreMap } from "./map/StoreMap";

const TONE: Record<StatusTone, string> = {
  open: "text-[#2f6b3a]",
  warn: "text-[#9a6200]",
  closed: "text-sa-muted",
  muted: "text-sa-muted",
};

export function SaStatusLine({ store, now, className = "" }: { store: StoreCard; now: Date | null; className?: string }) {
  const t = useShopTranslator();
  const locale = useShopLocale();
  const status = storeStatusText(store, now, t, intlLocale(locale));
  if (!status) return null;
  return (
    <span className={`text-[12.5px] ${className}`}>
      <span className={`font-semibold ${TONE[status.tone]}`}>{status.text}</span>
      {status.detail ? <span className="text-sa-muted"> · {status.detail}</span> : null}
    </span>
  );
}

function StoreRow({
  store,
  index,
  active,
  now,
  onFocus,
}: {
  store: LocatorStore;
  index: number;
  active: boolean;
  now: Date | null;
  onFocus: () => void;
}) {
  const t = useShopTranslator();
  return (
    <li
      id={`store-${store.slug}`}
      className={`border-b py-4 transition-colors ${active ? "border-terra/60" : "border-sa-border"}`}
      onMouseEnter={onFocus}
    >
      <div className="flex items-baseline gap-4">
        <span className={`w-6 shrink-0 text-[11px] font-medium tabular-nums ${active ? "text-terra" : "text-sa-muted"}`}>
          {String(index + 1).padStart(2, "0")}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <LocaleLink
              href={storePath(store)}
              className="text-[15px] font-semibold tracking-[-0.01em] text-sa-primary hover:text-terra"
            >
              {store.name}
            </LocaleLink>
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gold">
              {t(`stores.type.${store.storeType}`)}
            </span>
            {store.distanceKm != null ? (
              <span className="text-[12px] text-sa-muted">{t("stores.kmAway", { km: store.distanceKm.toFixed(1) })}</span>
            ) : null}
          </div>
          <p className="mt-1 text-[12.5px] leading-relaxed text-sa-secondary">{store.address}</p>
          <SaStatusLine store={store} now={now} className="mt-1 block" />
          <div className="mt-2.5 flex flex-wrap gap-x-5 gap-y-2 text-[12.5px] font-semibold">
            <a href={directionsUrl(store)} target="_blank" rel="noreferrer" className="text-terra hover:underline">
              {t("stores.directions")}
            </a>
            {store.phone ? (
              <a href={telUrl(store.phone)} className="text-sa-primary hover:text-terra" dir="ltr">
                {t("stores.call")} {store.phone}
              </a>
            ) : null}
            <button type="button" onClick={onFocus} className="text-sa-secondary hover:text-terra lg:hidden">
              {t("stores.viewStore")}
            </button>
            <LocaleLink href={storePath(store)} className="hidden text-sa-secondary hover:text-terra lg:inline">
              {t("stores.viewStore")}
            </LocaleLink>
          </div>
        </div>
      </div>
    </li>
  );
}

/**
 * Swiss Arabian store finder: search, "use my location", area / type /
 * open-now filters, numbered list and a map. Used by the locator (all areas)
 * and the area pages (one area, no area filter).
 */
export function SaStoreFinder({
  stores,
  areas,
  fixedArea,
}: {
  stores: StoreCard[];
  areas?: StoreAreaSummary[];
  fixedArea?: boolean;
}) {
  const t = useShopTranslator();
  const locale = useShopLocale();
  const brand = brandDisplayName(locale);
  const f = useStoreLocator(stores);
  const pins = useMemo(
    () => f.results.map((s, i) => ({ id: s.slug, latitude: s.latitude, longitude: s.longitude, title: s.name, label: String(i + 1) })),
    [f.results],
  );

  useEffect(() => {
    if (f.selected) document.getElementById(`store-${f.selected}`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [f.selected]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (f.results[0]) f.setSelected(f.results[0].slug);
  };
  const geoMessage =
    f.geo === "denied" ? t("stores.locationDenied") : f.geo === "unavailable" ? t("stores.locationUnavailable") : null;
  const select = "border border-sa-input bg-page px-3 py-2.5 text-[13px] text-sa-primary dark:bg-surface";

  return (
    <div>
      <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row sm:items-stretch" role="search">
        <label className="flex min-w-0 flex-1 items-center gap-3 border border-sa-input bg-page px-4 py-3 dark:bg-surface">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden className="shrink-0 text-sa-muted">
            <circle cx="8" cy="8" r="5.25" stroke="currentColor" strokeWidth="1.4" />
            <path d="M12.2 12.2 15.5 15.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <span className="sr-only">{t("stores.searchLabel")}</span>
          <input
            type="search"
            value={f.query}
            onChange={(e) => f.setQuery(e.target.value)}
            placeholder={t("stores.searchPlaceholder")}
            className="w-full bg-transparent text-[14px] text-sa-primary outline-none placeholder:text-sa-muted"
          />
        </label>
        <button
          type="button"
          onClick={f.locate}
          disabled={f.geo === "locating"}
          className="border border-sa-primary px-6 py-3 text-[13px] font-semibold text-sa-primary transition-colors hover:border-terra hover:text-terra disabled:opacity-60"
        >
          {f.geo === "locating" ? t("stores.locating") : t("stores.useLocation")}
        </button>
        <button
          type="submit"
          className="bg-terra px-8 py-3 text-[13px] font-semibold text-white transition-colors hover:bg-[var(--sa-action-primary-hover)]"
        >
          {t("stores.search")}
        </button>
      </form>
      {geoMessage ? (
        <p role="status" className="mt-3 text-[13px] text-sa-secondary">
          {geoMessage}
        </p>
      ) : null}

      <div role="group" aria-label={t("stores.filters")} className="mt-4 flex flex-wrap items-center gap-3">
        {!fixedArea && areas && areas.length > 1 ? (
          <label className="flex items-center gap-2 text-[12px] text-sa-muted">
            {t("stores.filterArea")}
            <select value={f.area} onChange={(e) => f.setArea(e.target.value)} className={select}>
              <option value="">{t("stores.allAreas")}</option>
              {areas.map((a) => (
                <option key={a.slug} value={a.slug}>
                  {a.name} ({a.storeCount})
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {f.types.length > 1 ? (
          <label className="flex items-center gap-2 text-[12px] text-sa-muted">
            {t("stores.filterType")}
            <select value={f.type} onChange={(e) => f.setType(e.target.value as typeof f.type)} className={select}>
              <option value="">{t("stores.allTypes")}</option>
              {f.types.map((type) => (
                <option key={type} value={type}>
                  {t(`stores.type.${type}`)}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="flex cursor-pointer items-center gap-2 text-[13px] text-sa-primary">
          <input type="checkbox" checked={f.openNow} onChange={(e) => f.setOpenNow(e.target.checked)} className="size-4 accent-terra" />
          {t("stores.openNow")}
        </label>
        {f.filtered ? (
          <button type="button" onClick={f.clear} className="text-[12.5px] font-semibold text-terra hover:underline">
            {t("stores.clearFilters")}
          </button>
        ) : null}
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(360px,560px)] lg:gap-12">
        <div className="order-2 min-w-0 lg:order-1">
          <p aria-live="polite" className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sa-muted">
            {t("stores.count", { count: f.results.length })}
            {f.sortedByDistance ? ` · ${t("stores.sortedByDistance")}` : ""}
          </p>
          {f.results.length ? (
            <ul className="mt-3 border-t border-sa-border lg:max-h-[640px] lg:overflow-y-auto">
              {f.results.map((store, i) => (
                <StoreRow
                  key={store.slug}
                  store={store}
                  index={i}
                  active={store.slug === f.selected}
                  now={f.now}
                  onFocus={() => f.setSelected(store.slug)}
                />
              ))}
            </ul>
          ) : (
            <p className="py-10 text-[13px] text-sa-muted">{t("stores.noMatch")}</p>
          )}
        </div>
        <div className="order-1 lg:order-2">
          <StoreMap
            className="h-[360px] w-full overflow-hidden border border-sa-border lg:sticky lg:top-28 lg:h-[600px]"
            pins={pins}
            activeId={f.selected}
            onSelect={f.setSelected}
            pinColor="var(--color-terra)"
            activePinColor="var(--sa-action-primary-hover)"
            language={locale}
            label={t("stores.mapLabel", { brand })}
          />
        </div>
      </div>
    </div>
  );
}
