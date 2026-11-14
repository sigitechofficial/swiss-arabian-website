"use client";

import { useEffect, useMemo, type FormEvent } from "react";
import { brandDisplayName } from "@/lib/brand";
import { useShopLocale, useShopTranslator } from "@/lib/i18n/ShopLocaleProvider";
import { intlLocale } from "@/lib/i18n/locales";
import { StoreMap } from "@/features/stores/components/map/StoreMap";
import { useStoreLocator, type LocatorStore } from "@/features/stores/hooks/useStoreLocator";
import type { StoreAreaSummary, StoreCard } from "@/features/stores/types";
import { directionsUrl, storePath, telUrl } from "@/features/stores/utils/storeLinks";
import { storeStatusText, type StatusTone } from "@/features/stores/utils/storeText";
import { Button, Chip, cx } from "../../ui";
import { SapilLink } from "../shared/SapilLink";

const TONE: Record<StatusTone, string> = {
  open: "text-sapil-ok",
  warn: "text-[#9a6200]",
  closed: "text-sapil-muted",
  muted: "text-sapil-muted",
};

export function SapilStoreStatus({ store, now, className }: { store: StoreCard; now: Date | null; className?: string }) {
  const t = useShopTranslator();
  const locale = useShopLocale();
  const status = storeStatusText(store, now, t, intlLocale(locale));
  if (!status) return null;
  return (
    <span className={cx("text-[14px]", className)}>
      <b className={cx("font-[600]", TONE[status.tone])}>{status.text}</b>
      {status.detail ? <span className="text-sapil-ink-2"> · {status.detail}</span> : null}
    </span>
  );
}

function SapilStoreItem({ store, active, now, onFocus }: { store: LocatorStore; active: boolean; now: Date | null; onFocus: () => void }) {
  const t = useShopTranslator();
  return (
    <li
      id={`store-${store.slug}`}
      onMouseEnter={onFocus}
      className={cx(
        "rounded-sapil border bg-sapil-card p-[20px] [transition:border-color_.18s]",
        active ? "border-sapil-accent" : "border-sapil-line",
      )}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-[8px]">
        <SapilLink href={storePath(store)} className="font-sapil-serif text-[22px] leading-[1.2] hover:text-sapil-accent">
          {store.name}
        </SapilLink>
        <span className="text-[12px] font-[600] uppercase tracking-[.12em] text-sapil-muted">{t(`stores.type.${store.storeType}`)}</span>
      </div>
      <p className="mt-[6px] text-[14px] text-sapil-ink-2">{store.address}</p>
      <div className="mt-[6px] flex flex-wrap gap-x-[12px]">
        <SapilStoreStatus store={store} now={now} />
        {store.distanceKm != null ? (
          <span className="text-[14px] text-sapil-muted">{t("stores.kmAway", { km: store.distanceKm.toFixed(1) })}</span>
        ) : null}
      </div>
      <div className="mt-[14px] flex flex-wrap items-center gap-[16px]">
        <Button variant="link" href={directionsUrl(store)} LinkComponent={SapilLink}>
          {t("stores.directions")}
        </Button>
        {store.phone ? (
          <a href={telUrl(store.phone)} className="text-[15px] font-[600] hover:text-sapil-accent" dir="ltr">
            {store.phone}
          </a>
        ) : null}
        <Button variant="link" href={storePath(store)} LinkComponent={SapilLink}>
          {t("stores.viewStore")}
        </Button>
      </div>
    </li>
  );
}

/** Sapil store finder: search, near me, filter chips, store cards and the map. */
export function SapilStoreFinder({ stores, areas, fixedArea }: { stores: StoreCard[]; areas?: StoreAreaSummary[]; fixedArea?: boolean }) {
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
  const geoMessage = f.geo === "denied" ? t("stores.locationDenied") : f.geo === "unavailable" ? t("stores.locationUnavailable") : null;

  return (
    <div>
      <form onSubmit={submit} role="search" className="flex flex-wrap gap-[12px]">
        <label className="flex min-w-[240px] flex-1 items-center gap-[10px] h-[50px] rounded-full border border-sapil-line-2 bg-sapil-card px-[20px] focus-within:border-sapil-ink">
          <span className="sr-only">{t("stores.searchLabel")}</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden className="text-sapil-muted">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            type="search"
            value={f.query}
            onChange={(e) => f.setQuery(e.target.value)}
            placeholder={t("stores.searchPlaceholder")}
            className="w-full bg-transparent text-[15px] outline-none placeholder:text-sapil-muted"
          />
        </label>
        <Button variant="line" onClick={f.locate} disabled={f.geo === "locating"}>
          {f.geo === "locating" ? t("stores.locating") : t("stores.useLocation")}
        </Button>
        <Button type="submit">{t("stores.search")}</Button>
      </form>
      {geoMessage ? (
        <p role="status" className="mt-[12px] text-[14px] text-sapil-ink-2">
          {geoMessage}
        </p>
      ) : null}

      <div role="group" aria-label={t("stores.filters")} className="mt-[16px] flex flex-wrap gap-[8px]">
        {!fixedArea && areas && areas.length > 1 ? (
          <>
            <Chip pressed={!f.area} onClick={() => f.setArea("")}>
              {t("stores.allAreas")}
            </Chip>
            {areas.map((a) => (
              <Chip key={a.slug} pressed={f.area === a.slug} count={a.storeCount} onClick={() => f.setArea(f.area === a.slug ? "" : a.slug)}>
                {a.name}
              </Chip>
            ))}
          </>
        ) : null}
        <Chip pressed={f.openNow} onClick={() => f.setOpenNow(!f.openNow)}>
          {t("stores.openNow")}
        </Chip>
        {f.types.length > 1
          ? f.types.map((type) => (
              <Chip key={type} pressed={f.type === type} onClick={() => f.setType(f.type === type ? "" : type)}>
                {t(`stores.type.${type}`)}
              </Chip>
            ))
          : null}
      </div>

      <div className="mt-[28px] grid grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-[24px] max-900:grid-cols-1">
        <div className="min-w-0 max-900:order-2">
          <p aria-live="polite" className="text-[14px] text-sapil-muted">
            {t("stores.count", { count: f.results.length })}
            {f.sortedByDistance ? ` · ${t("stores.sortedByDistance")}` : ""}
            {f.filtered ? (
              <button type="button" onClick={f.clear} className="ms-[12px] font-[600] text-sapil-ink underline">
                {t("stores.clearFilters")}
              </button>
            ) : null}
          </p>
          {f.results.length ? (
            <ul className="mt-[12px] flex flex-col gap-[12px] max-h-[680px] overflow-y-auto pe-[6px] max-900:max-h-none max-900:overflow-visible max-900:pe-0">
              {f.results.map((s) => (
                <SapilStoreItem key={s.slug} store={s} active={s.slug === f.selected} now={f.now} onFocus={() => f.setSelected(s.slug)} />
              ))}
            </ul>
          ) : (
            <div className="mt-[12px] rounded-sapil border border-dashed border-sapil-line-2 p-[36px] text-center text-sapil-ink-2">{t("stores.noMatch")}</div>
          )}
        </div>
        <div className="max-900:order-1">
          <StoreMap
            className="h-[640px] w-full overflow-hidden rounded-sapil border border-sapil-line sticky top-[120px] max-900:static max-900:h-[340px]"
            pins={pins}
            activeId={f.selected}
            onSelect={f.setSelected}
            pinColor="var(--sapil-accent)"
            activePinColor="var(--sapil-accent-2)"
            language={locale}
            label={t("stores.mapLabel", { brand })}
          />
        </div>
      </div>
    </div>
  );
}
