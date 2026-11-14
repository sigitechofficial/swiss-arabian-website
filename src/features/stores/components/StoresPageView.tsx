"use client";

import { Reveal } from "@/components/motion";
import { brandDisplayName } from "@/lib/brand";
import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { useShopLocale, useShopTranslator } from "@/lib/i18n/ShopLocaleProvider";
import type { StoreAreaData, StoreLocatorData } from "../types";
import { storeAreaPath, storesPath } from "../utils/storeLinks";
import { SaStoreFinder } from "./SaStoreFinder";

function SaBreadcrumbs({ items }: { items: Array<{ label: string; href?: string }> }) {
  const t = useShopTranslator();
  return (
    <nav aria-label={t("stores.breadcrumb")} className="text-[12px] text-sa-muted">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1.5">
            {i > 0 ? <span aria-hidden>/</span> : null}
            {item.href ? (
              <LocaleLink href={item.href} className="hover:text-terra">
                {item.label}
              </LocaleLink>
            ) : (
              <span aria-current="page" className="text-sa-secondary">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export { SaBreadcrumbs };

/** Links to every area page ("Dubai (17)"). */
function AreaLinks({ title, areas }: { title: string; areas: Array<{ slug: string; name: string; storeCount?: number }> }) {
  if (!areas.length) return null;
  return (
    <section className="mt-16 border-t border-sa-border pt-10" aria-labelledby="store-areas-heading">
      <h2 id="store-areas-heading" className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">
        {title}
      </h2>
      <ul className="mt-4 flex flex-wrap gap-2.5">
        {areas.map((a) => (
          <li key={a.slug}>
            <LocaleLink
              href={storeAreaPath(a.slug)}
              className="inline-block border border-sa-border px-4 py-2 text-[13px] font-medium text-sa-primary transition-colors hover:border-terra hover:text-terra"
            >
              {a.name}
              {a.storeCount != null ? <span className="ms-1.5 text-sa-muted">({a.storeCount})</span> : null}
            </LocaleLink>
          </li>
        ))}
      </ul>
    </section>
  );
}

const PAGE = "mx-auto max-w-[1280px] px-4 pb-16 pt-10 sm:px-6 lg:px-10 lg:pb-20 lg:pt-12";

/** Swiss Arabian `StoreLocatorPageView` (/stores): every shop of the market. */
export function StoresPageView({ data }: { data: StoreLocatorData }) {
  const t = useShopTranslator();
  const locale = useShopLocale();
  const brand = brandDisplayName(locale);
  return (
    <div className="bg-page">
      <div className={PAGE}>
        <SaBreadcrumbs items={[{ label: t("home"), href: "/" }, { label: t("pages.stores.title") }]} />
        <Reveal fade>
          <header className="mt-6 max-w-[720px]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">{t("stores.eyebrow")}</p>
            <h1 className="mt-3 font-sans text-[clamp(2rem,4.5vw,3rem)] font-medium tracking-[-0.02em] text-sa-primary">
              {t("stores.title", { brand })}
            </h1>
            <p className="mt-4 text-[15px] leading-relaxed text-sa-secondary">{t("stores.lead")}</p>
          </header>
        </Reveal>
        <div className="mt-8">
          <SaStoreFinder stores={data.stores} areas={data.areas} />
        </div>
        <AreaLinks title={t("stores.byArea")} areas={data.areas} />
      </div>
    </div>
  );
}

/** Swiss Arabian `StoreAreaPageView` (/stores/<area>): one emirate / city. */
export function StoreAreaPageView({ data }: { data: StoreAreaData }) {
  const t = useShopTranslator();
  const locale = useShopLocale();
  const brand = brandDisplayName(locale);
  return (
    <div className="bg-page">
      <div className={PAGE}>
        <SaBreadcrumbs
          items={[{ label: t("home"), href: "/" }, { label: t("pages.stores.title"), href: storesPath() }, { label: data.area.name }]}
        />
        <header className="mt-6 max-w-[720px]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">{t("stores.eyebrow")}</p>
          <h1 className="mt-3 font-sans text-[clamp(2rem,4.5vw,3rem)] font-medium tracking-[-0.02em] text-sa-primary">
            {t("stores.storesIn", { area: data.area.name })}
          </h1>
          <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-sa-secondary">
            {data.area.intro || t("stores.areaLead", { brand, area: data.area.name })}
          </p>
        </header>
        <div className="mt-8">
          <SaStoreFinder stores={data.stores} fixedArea />
        </div>
        <AreaLinks title={t("stores.otherAreas")} areas={data.otherAreas} />
        <p className="mt-6">
          <LocaleLink href={storesPath()} className="text-[13px] font-semibold text-terra hover:underline">
            {t("stores.allStores")}
          </LocaleLink>
        </p>
      </div>
    </div>
  );
}
