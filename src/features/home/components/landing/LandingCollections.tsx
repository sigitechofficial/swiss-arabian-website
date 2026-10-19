"use client";

import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { chromeNavLinks, useNavigation } from "@/features/navigation";
import { useMarket } from "@/providers/MarketProvider";
import {
  collectionArt,
  collectionBody,
  collectionCard,
  collectionGrid,
  collectionTitle,
  collectionsSection,
  lead,
  linkUnderline,
  linkUnderlineLight,
  sectionHead,
  sectionTitle,
} from "@/styles/landingChrome";
import { pageContainer } from "@/styles/siteChrome";

export type LandingCollectionItem = {
  id: string;
  href: string;
  label: string;
  image?: string | null;
  ctaLabel?: string | null;
};

export type LandingCollectionsProps = {
  heading?: string | null;
  subtitle?: string | null;
  items?: LandingCollectionItem[];
  variant?: "grid" | "carousel";
  exploreLabel?: string | null;
};

export function LandingCollections({
  heading,
  subtitle,
  items: itemsProp,
  variant = "grid",
  exploreLabel,
}: LandingCollectionsProps = {}) {
  const copy = useShopCopy();
  const { marketId } = useMarket();
  const { chromeItems, isLoading } = useNavigation(marketId || undefined);
  const doors = chromeNavLinks(chromeItems);
  const fromCms = itemsProp !== undefined;

  const items: LandingCollectionItem[] = fromCms
    ? itemsProp
    : doors.map((door) => ({
        id: door.href,
        href: door.href,
        label: door.label,
      }));

  const title = heading?.trim() || copy("shopByCategories");
  const leadText = subtitle?.trim() || (fromCms ? null : copy("enterTheHouse"));
  const ctaDefault = exploreLabel?.trim() || copy("explore");
  const listClass =
    variant === "carousel"
      ? "flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      : collectionGrid;
  const cardClass =
    variant === "carousel"
      ? `${collectionCard} min-w-[220px] shrink-0 snap-start`
      : collectionCard;

  return (
    <section
      className={`${collectionsSection} pt-[clamp(1.25rem,3vw,2rem)] pb-[clamp(3.5rem,8vw,7rem)]`}
      aria-labelledby="collTitle"
      aria-busy={!fromCms && isLoading && items.length === 0}
    >
      <div className={pageContainer}>
        <header className={sectionHead}>
          <h2 className={sectionTitle} id="collTitle">
            {title}
          </h2>
          {leadText ? <p className={lead}>{leadText}</p> : null}
        </header>

        <div className={listClass}>
          {!fromCms && isLoading && items.length === 0
            ? Array.from({ length: 4 }, (_, index) => (
                <span
                  key={index}
                  className={`${collectionCard} block h-40 animate-pulse bg-[var(--ink)]/10`}
                />
              ))
            : items.map((item) => (
                <LocaleLink key={item.id} className={cardClass} href={item.href}>
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.image}
                      alt=""
                      className={collectionArt}
                      loading="lazy"
                    />
                  ) : null}
                  <span className={collectionBody}>
                    <span className={collectionTitle}>{item.label}</span>
                    <span className={`${linkUnderline} ${linkUnderlineLight}`}>
                      {item.ctaLabel?.trim() || ctaDefault}
                    </span>
                  </span>
                </LocaleLink>
              ))}
        </div>
      </div>
    </section>
  );
}
