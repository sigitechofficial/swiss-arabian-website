"use client";

import { MediaImage } from "@/components/ui/MediaImage";
import { brandDisplayName } from "@/lib/brand";
import { useShopLocale, useShopTranslator } from "@/lib/i18n/ShopLocaleProvider";
import { intlLocale } from "@/lib/i18n/locales";
import { StoreMap } from "@/features/stores/components/map/StoreMap";
import { useNow } from "@/features/stores/hooks/useStoreLocator";
import type { StoreAreaData, StoreDetail, StoreLocatorData } from "@/features/stores/types";
import { STORE_DAYS, dayName, hasHours, hoursOn, weekAhead } from "@/features/stores/utils/openingHours";
import {
  directionsUrl,
  mapsUrl,
  storeAreaPath,
  storePath,
  storesPath,
  telUrl,
  whatsappUrl,
} from "@/features/stores/utils/storeLinks";
import { dayHoursText } from "@/features/stores/utils/storeText";
import { reviewMonth, shownReviews } from "@/features/stores/utils/storeReviews";
import { Breadcrumbs, Button, EYEBROW, Wrap, cx } from "../../ui";
import { SapilLink } from "../../components/shared/SapilLink";
import { SapilStoreFinder, SapilStoreStatus } from "../../components/content/SapilStoreFinder";

const H1 = "font-sapil-display !font-[400] text-[clamp(40px,5vw,72px)] !leading-[1.02] mt-[14px] mb-[12px]";
const H2 = "font-sapil-serif text-[24px] leading-[1.2] mb-[12px]";
const CARD = "rounded-sapil border border-sapil-line bg-sapil-card p-[24px]";

function AreaChips({ title, areas }: { title: string; areas: Array<{ slug: string; name: string; storeCount?: number }> }) {
  if (!areas.length) return null;
  return (
    <section className="mt-[56px]" aria-labelledby="store-areas">
      <h2 id="store-areas" className={H2}>
        {title}
      </h2>
      <ul className="flex flex-wrap gap-[8px]">
        {areas.map((a) => (
          <li key={a.slug}>
            <SapilLink
              href={storeAreaPath(a.slug)}
              className="h-[40px] px-[16px] rounded-full border border-sapil-line-2 bg-sapil-card text-[14px] font-[500] inline-flex items-center gap-[8px] hover:border-sapil-ink"
            >
              {a.name}
              {a.storeCount != null ? <small className="text-sapil-muted">{a.storeCount}</small> : null}
            </SapilLink>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Sapil `StoreLocatorPageView` (/stores). */
export function SapilStoreLocatorPage({ data }: { data: StoreLocatorData }) {
  const t = useShopTranslator();
  const locale = useShopLocale();
  const brand = brandDisplayName(locale);
  return (
    <Wrap className="pb-[88px]">
      <Breadcrumbs label={t("stores.breadcrumb")} items={[{ label: t("home"), href: "/" }, { label: t("pages.stores.title") }]} LinkComponent={SapilLink} />
      <header className="max-w-[760px] mt-[24px] mb-[32px]">
        <p className={EYEBROW}>{t("stores.eyebrow")}</p>
        <h1 className={H1}>{t("stores.title", { brand })}</h1>
        <p className="text-sapil-ink-2 text-[17px]">{t("stores.lead")}</p>
      </header>
      <SapilStoreFinder stores={data.stores} areas={data.areas} />
      <AreaChips title={t("stores.byArea")} areas={data.areas} />
    </Wrap>
  );
}

/** Sapil `StoreAreaPageView` (/stores/<area>). */
export function SapilStoreAreaPage({ data }: { data: StoreAreaData }) {
  const t = useShopTranslator();
  const locale = useShopLocale();
  const brand = brandDisplayName(locale);
  return (
    <Wrap className="pb-[88px]">
      <Breadcrumbs
        label={t("stores.breadcrumb")}
        items={[{ label: t("home"), href: "/" }, { label: t("pages.stores.title"), href: storesPath() }, { label: data.area.name }]}
        LinkComponent={SapilLink}
      />
      <header className="max-w-[760px] mt-[24px] mb-[32px]">
        <p className={EYEBROW}>{t("stores.eyebrow")}</p>
        <h1 className={H1}>{t("stores.storesIn", { area: data.area.name })}</h1>
        <p className="text-sapil-ink-2 text-[17px] whitespace-pre-line">{data.area.intro || t("stores.areaLead", { brand, area: data.area.name })}</p>
      </header>
      <SapilStoreFinder stores={data.stores} fixedArea />
      <AreaChips title={t("stores.otherAreas")} areas={data.otherAreas} />
      <p className="mt-[24px]">
        <Button variant="link" href={storesPath()} LinkComponent={SapilLink}>
          {t("stores.allStores")}
        </Button>
      </p>
    </Wrap>
  );
}

/** Sapil `StorePageView` (/stores/<area>/<store>). */
export function SapilStorePage({ store }: { store: StoreDetail }) {
  const t = useShopTranslator();
  const locale = useShopLocale();
  const intl = intlLocale(locale);
  const now = useNow();
  const reviews = shownReviews(store);
  const closed = store.openState === "CLOSED_PERMANENTLY";
  const days = now ? weekAhead(store, now) : STORE_DAYS.map((day) => hoursOn({ ...store, specialHours: [] }, "", day));

  return (
    <Wrap className="pb-[88px]">
      <Breadcrumbs
        label={t("stores.breadcrumb")}
        items={[
          { label: t("home"), href: "/" },
          { label: t("pages.stores.title"), href: storesPath() },
          { label: store.area.name, href: storeAreaPath(store.areaSlug) },
          { label: store.name },
        ]}
        LinkComponent={SapilLink}
      />
      <div className="mt-[24px] grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-[32px] max-900:grid-cols-1">
        <div className="min-w-0">
          <p className={EYEBROW}>{t(`stores.type.${store.storeType}`)}</p>
          <h1 className={H1}>{store.name}</h1>
          <SapilStoreStatus store={store} now={now} className="text-[16px]" />

          {closed ? (
            <div className={cx(CARD, "mt-[20px]")}>
              <b className="block font-sapil-serif font-[400] text-[22px]">{t("stores.closedTitle")}</b>
              <p className="mt-[4px] text-sapil-ink-2">{t("stores.closedText")}</p>
            </div>
          ) : null}

          <section className={cx(CARD, "mt-[24px]")} aria-labelledby="store-address">
            <h2 id="store-address" className={H2}>
              {t("stores.address")}
            </h2>
            <p className="text-[16px]">{store.address}</p>
            {store.directionsNote ? (
              <p className="mt-[8px] text-[15px] text-sapil-ink-2">
                <b className="font-[600] text-sapil-ink">{t("stores.howToFind")}: </b>
                {store.directionsNote}
              </p>
            ) : null}
            {!closed ? (
              <div className="mt-[20px] flex flex-wrap gap-[12px]">
                <Button href={directionsUrl(store)} LinkComponent={SapilLink}>
                  {t("stores.directions")}
                </Button>
                {store.phone ? (
                  <Button variant="line" href={telUrl(store.phone)} LinkComponent={SapilLink}>
                    {t("stores.call")} <span dir="ltr">{store.phone}</span>
                  </Button>
                ) : null}
                {store.whatsapp ? (
                  <Button variant="line" href={whatsappUrl(store.whatsapp)} LinkComponent={SapilLink}>
                    {t("stores.whatsapp")}
                  </Button>
                ) : null}
                {store.email ? (
                  <Button variant="line" href={`mailto:${store.email}`} LinkComponent={SapilLink}>
                    {t("stores.email")}
                  </Button>
                ) : null}
              </div>
            ) : null}
          </section>

          {!closed ? (
            <section className={cx(CARD, "mt-[16px]")} aria-labelledby="store-hours">
              <h2 id="store-hours" className={H2}>
                {t("stores.hoursTitle")}
              </h2>
              {hasHours(store) ? (
                <table className="w-full text-[15px]">
                  <tbody>
                    {days.map((d, i) => (
                      <tr key={d.day} className={cx("border-b border-sapil-line last:border-0", now && i === 0 ? "font-[600]" : "text-sapil-ink-2")}>
                        <th scope="row" className="py-[10px] pe-[16px] text-start font-[inherit]">
                          {now && i === 0 ? t("stores.today") : dayName(d.day, intl)}
                          {d.label ? <span className="ms-[8px] text-[12px] font-[600] text-sapil-accent">{d.label}</span> : null}
                        </th>
                        <td className="py-[10px] text-end tabular-nums">
                          {dayHoursText(d, t, intl)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-sapil-ink-2">{t("stores.noHours")}</p>
              )}
            </section>
          ) : null}

          {store.services.length ? (
            <section className={cx(CARD, "mt-[16px]")} aria-labelledby="store-services">
              <h2 id="store-services" className={H2}>
                {t("stores.services")}
              </h2>
              <ul className="flex flex-wrap gap-[8px]">
                {store.services.map((s) => (
                  <li key={s} className="h-[36px] px-[14px] rounded-full bg-sapil-accent-soft text-[14px] inline-flex items-center">
                    {t(`stores.service.${s}`)}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {store.description ? (
            <section className="mt-[24px]" aria-labelledby="store-about">
              <h2 id="store-about" className={H2}>
                {t("stores.about")}
              </h2>
              <p className="text-sapil-ink-2 text-[16px] whitespace-pre-line">{store.description}</p>
            </section>
          ) : null}

          {reviews.length ? (
            <section className="mt-[24px]" aria-labelledby="store-reviews">
              <h2 id="store-reviews" className={H2}>
                {t("stores.googleReviewsTitle")}
              </h2>
              <ul className="flex flex-col gap-[12px]">
                {reviews.map((r) => (
                  <li key={r.id} className="bg-sapil-white rounded-[18px] p-[16px]">
                    <p className="flex flex-wrap items-baseline gap-x-[8px] text-[14px]">
                      <span className="text-sapil-accent" role="img" aria-label={t("stores.reviewStars", { rating: r.rating })}>
                        {"★".repeat(r.rating)}
                        <span className="text-sapil-line-2">{"★".repeat(5 - r.rating)}</span>
                      </span>
                      <b className="font-[600]">{r.author ?? t("stores.anonymousReviewer")}</b>
                      <span className="text-sapil-muted">{reviewMonth(r.createdAt, intl)}</span>
                    </p>
                    <p className="mt-[6px] text-[15px] text-sapil-ink-2 whitespace-pre-line line-clamp-4">{r.text}</p>
                    {r.reply ? (
                      <p className="mt-[8px] border-s-2 border-sapil-line ps-[10px] text-[14px] text-sapil-muted">
                        <b className="font-[600] text-sapil-ink">{t("stores.reviewReply")}: </b>
                        {r.reply}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <div className="mt-[20px] flex flex-wrap items-center gap-[16px] text-[15px]">
            {store.googleRating != null ? (
              <span>
                <span aria-hidden className="text-sapil-accent">★ </span>
                {t("stores.googleRating", { rating: store.googleRating.toFixed(1) })}
                {store.googleReviewCount ? <span className="text-sapil-muted"> · {t("stores.reviews", { count: store.googleReviewCount })}</span> : null}
              </span>
            ) : null}
            <Button variant="link" href={mapsUrl(store)} LinkComponent={SapilLink}>
              {t("stores.readReviews")}
            </Button>
            {store.googleReviewUri ? (
              <Button variant="link" href={store.googleReviewUri} LinkComponent={SapilLink}>
                {t("stores.writeReview")}
              </Button>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-[16px]">
          <StoreMap
            className="h-[460px] w-full overflow-hidden rounded-sapil border border-sapil-line max-900:h-[320px]"
            pins={[{ id: store.slug, latitude: store.latitude, longitude: store.longitude, title: store.name }]}
            activeId={null}
            pinColor="var(--sapil-accent)"
            activePinColor="var(--sapil-accent-2)"
            language={locale}
            label={t("stores.mapOne", { name: store.name })}
          />
          {store.photos.length ? (
            <div className="grid grid-cols-2 gap-[12px]">
              {store.photos.slice(0, 4).map((p) => (
                <div key={p.url} className="relative aspect-[4/3] overflow-hidden rounded-sapil bg-sapil-sand">
                  <MediaImage src={p.url} alt={p.alt || t("stores.photo", { name: store.name })} fill sizes="(max-width:900px) 50vw, 340px" className="object-cover" />
                </div>
              ))}
            </div>
          ) : null}
          {store.photos.length && store.photosFrom === "google" ? (
            <p className="text-[13px] text-sapil-muted">{t("stores.photosFromGoogle")}</p>
          ) : null}
        </div>
      </div>

      {store.nearby.length ? (
        <section className="mt-[56px]" aria-labelledby="store-nearby">
          <h2 id="store-nearby" className={H2}>
            {t("stores.nearby")}
          </h2>
          <ul className="grid grid-cols-3 gap-[16px] max-900:grid-cols-1">
            {store.nearby.map((n) => (
              <li key={n.slug} className={CARD}>
                <SapilLink href={storePath(n)} className="font-sapil-serif text-[20px] hover:text-sapil-accent">
                  {n.name}
                </SapilLink>
                <p className="mt-[4px] text-[14px] text-sapil-ink-2">{n.address}</p>
                <p className="mt-[4px] text-[14px] text-sapil-muted">{t("stores.kmAway", { km: n.distanceKm.toFixed(1) })}</p>
                <SapilStoreStatus store={n} now={now} className="mt-[6px] block" />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className={cx(CARD, "mt-[56px] flex flex-wrap items-center justify-between gap-[16px] bg-sapil-sand")}>
        <div>
          <b className="block font-sapil-serif font-[400] text-[24px]">{t("stores.shopOnline")}</b>
          <p className="mt-[4px] text-sapil-ink-2">{t("stores.shopOnlineText")}</p>
        </div>
        <Button href="/collections" LinkComponent={SapilLink}>
          {t("stores.browse")}
        </Button>
      </section>
    </Wrap>
  );
}
