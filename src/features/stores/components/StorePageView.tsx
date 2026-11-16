"use client";

import { MediaImage } from "@/components/ui/MediaImage";
import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { useShopLocale, useShopTranslator } from "@/lib/i18n/ShopLocaleProvider";
import { intlLocale } from "@/lib/i18n/locales";
import { useNow } from "../hooks/useStoreLocator";
import type { StoreDetail } from "../types";
import { STORE_DAYS, dayName, hasHours, hoursOn, weekAhead } from "../utils/openingHours";
import { directionsUrl, mapsUrl, storeAreaPath, storePath, storesPath, telUrl, whatsappUrl } from "../utils/storeLinks";
import { reviewMonth, shownReviews } from "../utils/storeReviews";
import { dayHoursText } from "../utils/storeText";
import { StoreMap } from "./map/StoreMap";
import { SaStatusLine } from "./SaStoreFinder";
import { SaBreadcrumbs } from "./StoresPageView";

const H2 = "text-[11px] font-semibold uppercase tracking-[0.18em] text-gold";
const PRIMARY = "inline-flex items-center justify-center bg-terra px-6 py-3 text-[13px] font-semibold text-white transition-colors hover:bg-[var(--sa-action-primary-hover)]";
const SECONDARY =
  "inline-flex items-center justify-center border border-sa-primary px-6 py-3 text-[13px] font-semibold text-sa-primary transition-colors hover:border-terra hover:text-terra";

/** Swiss Arabian `StorePageView` (/stores/<area>/<store>). */
export function StorePageView({ store }: { store: StoreDetail }) {
  const t = useShopTranslator();
  const locale = useShopLocale();
  const intl = intlLocale(locale);
  const now = useNow();
  const reviews = shownReviews(store);
  const closed = store.openState === "CLOSED_PERMANENTLY";
  // Server HTML (and the first paint) shows the plain week, Monday first; in the
  // browser it becomes "today and the next six days" with holidays applied.
  const days = now ? weekAhead(store, now) : STORE_DAYS.map((day) => hoursOn({ ...store, specialHours: [] }, "", day));

  return (
    <div className="bg-page">
      <div className="mx-auto max-w-[1280px] px-4 pb-16 pt-10 sm:px-6 lg:px-10 lg:pb-20 lg:pt-12">
        <SaBreadcrumbs
          items={[
            { label: t("home"), href: "/" },
            { label: t("pages.stores.title"), href: storesPath() },
            { label: store.area.name, href: storeAreaPath(store.areaSlug) },
            { label: store.name },
          ]}
        />

        <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(360px,520px)] lg:gap-14">
          <div className="min-w-0">
            <p className={H2}>{t(`stores.type.${store.storeType}`)}</p>
            <h1 className="mt-3 font-sans text-[clamp(2rem,4.5vw,3rem)] font-medium tracking-[-0.02em] text-sa-primary">{store.name}</h1>
            <SaStatusLine store={store} now={now} className="mt-3 block text-[14px]" />

            {closed ? (
              <div className="mt-6 border border-sa-border bg-surface p-5">
                <p className="font-semibold text-sa-primary">{t("stores.closedTitle")}</p>
                <p className="mt-1 text-[14px] text-sa-secondary">{t("stores.closedText")}</p>
              </div>
            ) : null}

            <section className="mt-8" aria-labelledby="store-address">
              <h2 id="store-address" className={H2}>
                {t("stores.address")}
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-sa-primary">{store.address}</p>
              {store.directionsNote ? (
                <p className="mt-2 text-[14px] text-sa-secondary">
                  <span className="font-semibold">{t("stores.howToFind")}: </span>
                  {store.directionsNote}
                </p>
              ) : null}
              {!closed ? (
                <div className="mt-5 flex flex-wrap gap-3">
                  <a href={directionsUrl(store)} target="_blank" rel="noreferrer" className={PRIMARY}>
                    {t("stores.directions")}
                  </a>
                  {store.phone ? (
                    <a href={telUrl(store.phone)} className={SECONDARY}>
                      {t("stores.call")}&nbsp;<span dir="ltr">{store.phone}</span>
                    </a>
                  ) : null}
                  {store.whatsapp ? (
                    <a href={whatsappUrl(store.whatsapp)} target="_blank" rel="noreferrer" className={SECONDARY}>
                      {t("stores.whatsapp")}
                    </a>
                  ) : null}
                  {store.email ? (
                    <a href={`mailto:${store.email}`} className={SECONDARY}>
                      {t("stores.email")}
                    </a>
                  ) : null}
                </div>
              ) : null}
            </section>

            {!closed ? (
              <section className="mt-10" aria-labelledby="store-hours">
                <h2 id="store-hours" className={H2}>
                  {t("stores.hoursTitle")}
                </h2>
                {hasHours(store) ? (
                  <table className="mt-3 w-full max-w-[460px] text-[14px]">
                    <tbody>
                      {days.map((d, i) => (
                        <tr key={d.day} className={`border-b border-sa-border ${now && i === 0 ? "font-semibold text-sa-primary" : "text-sa-secondary"}`}>
                          <th scope="row" className="py-2.5 pe-4 text-start font-[inherit]">
                            {now && i === 0 ? t("stores.today") : dayName(d.day, intl)}
                            {d.label ? <span className="ms-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-gold">{d.label}</span> : null}
                          </th>
                          <td className="py-2.5 text-end tabular-nums">
                            {dayHoursText(d, t, intl)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="mt-2 text-[14px] text-sa-secondary">{t("stores.noHours")}</p>
                )}
              </section>
            ) : null}

            {store.services.length ? (
              <section className="mt-10" aria-labelledby="store-services">
                <h2 id="store-services" className={H2}>
                  {t("stores.services")}
                </h2>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {store.services.map((s) => (
                    <li key={s} className="border border-sa-border px-3 py-1.5 text-[13px] text-sa-primary">
                      {t(`stores.service.${s}`)}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {store.googleRating != null || store.googleMapsUri || store.googleReviewUri ? (
              <section className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px]">
                {store.googleRating != null ? (
                  <span className="text-sa-primary">
                    <span aria-hidden className="text-gold">★ </span>
                    {t("stores.googleRating", { rating: store.googleRating.toFixed(1) })}
                    {store.googleReviewCount ? <span className="text-sa-muted"> · {t("stores.reviews", { count: store.googleReviewCount })}</span> : null}
                  </span>
                ) : null}
                <a href={mapsUrl(store)} target="_blank" rel="noreferrer" className="font-semibold text-terra hover:underline">
                  {t("stores.readReviews")}
                </a>
                {store.googleReviewUri ? (
                  <a href={store.googleReviewUri} target="_blank" rel="noreferrer" className="font-semibold text-terra hover:underline">
                    {t("stores.writeReview")}
                  </a>
                ) : null}
              </section>
            ) : null}

            {reviews.length ? (
              <section className="mt-10 max-w-[640px]" aria-labelledby="store-reviews">
                <h2 id="store-reviews" className={H2}>
                  {t("stores.googleReviewsTitle")}
                </h2>
                <ul className="mt-3 flex flex-col gap-4">
                  {reviews.map((r) => (
                    <li key={r.id} className="border-b border-sa-border pb-4 last:border-b-0">
                      <p className="flex flex-wrap items-baseline gap-x-2 text-[13px]">
                        <span className="text-gold" role="img" aria-label={t("stores.reviewStars", { rating: r.rating })}>
                          {"★".repeat(r.rating)}
                          <span className="text-sa-border">{"★".repeat(5 - r.rating)}</span>
                        </span>
                        <span className="font-semibold text-sa-primary">{r.author ?? t("stores.anonymousReviewer")}</span>
                        <span className="text-sa-muted">{reviewMonth(r.createdAt, intlLocale(locale))}</span>
                      </p>
                      <p className="mt-1.5 line-clamp-4 whitespace-pre-line text-[14px] leading-relaxed text-sa-secondary">{r.text}</p>
                      {r.reply ? (
                        <p className="mt-2 border-s-2 border-sa-border ps-3 text-[13px] text-sa-muted">
                          <span className="font-semibold text-sa-primary">{t("stores.reviewReply")}: </span>
                          {r.reply}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {store.description ? (
              <section className="mt-10 max-w-[640px]" aria-labelledby="store-about">
                <h2 id="store-about" className={H2}>
                  {t("stores.about")}
                </h2>
                <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-sa-secondary">{store.description}</p>
              </section>
            ) : null}
          </div>

          <div className="flex flex-col gap-6">
            <StoreMap
              className="h-[320px] w-full overflow-hidden border border-sa-border lg:h-[420px]"
              pins={[{ id: store.slug, latitude: store.latitude, longitude: store.longitude, title: store.name }]}
              activeId={null}
              pinColor="var(--color-terra)"
              activePinColor="var(--sa-action-primary-hover)"
              language={locale}
              label={t("stores.mapOne", { name: store.name })}
            />
            {store.photos.length ? (
              <div className="grid grid-cols-2 gap-3">
                {store.photos.slice(0, 4).map((p, i) => (
                  <div key={p.url} className={`relative aspect-[4/3] overflow-hidden border border-sa-border ${i === 0 && store.photos.length % 2 ? "col-span-2" : ""}`}>
                    <MediaImage src={p.url} alt={p.alt || t("stores.photo", { name: store.name })} fill sizes="(min-width:1024px) 260px, 50vw" className="object-cover" />
                  </div>
                ))}
              </div>
            ) : null}
            {store.photos.length && store.photosFrom === "google" ? (
              <p className="-mt-3 text-[12px] text-sa-muted">{t("stores.photosFromGoogle")}</p>
            ) : null}
          </div>
        </div>

        {store.nearby.length ? (
          <section className="mt-16 border-t border-sa-border pt-10" aria-labelledby="store-nearby">
            <h2 id="store-nearby" className={H2}>
              {t("stores.nearby")}
            </h2>
            <ul className="mt-5 grid gap-4 sm:grid-cols-3">
              {store.nearby.map((n) => (
                <li key={n.slug} className="border border-sa-border p-5">
                  <LocaleLink href={storePath(n)} className="text-[15px] font-semibold text-sa-primary hover:text-terra">
                    {n.name}
                  </LocaleLink>
                  <p className="mt-1 text-[12.5px] text-sa-secondary">{n.address}</p>
                  <p className="mt-1 text-[12px] text-sa-muted">{t("stores.kmAway", { km: n.distanceKm.toFixed(1) })}</p>
                  <SaStatusLine store={n} now={now} className="mt-2 block" />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="mt-16 flex flex-col items-start gap-4 border border-sa-border p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-sa-primary">{t("stores.shopOnline")}</p>
            <p className="mt-1 text-[14px] text-sa-secondary">{t("stores.shopOnlineText")}</p>
          </div>
          <LocaleLink href="/collections" className={PRIMARY}>
            {t("stores.browse")}
          </LocaleLink>
        </section>
      </div>
    </div>
  );
}
