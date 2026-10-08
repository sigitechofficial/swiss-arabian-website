"use client";

import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { chromeNavLinks, useNavigation } from "@/features/navigation";
import { useMarket } from "@/providers/MarketProvider";
import {
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

export function LandingCollections() {
  const copy = useShopCopy();
  const { marketId } = useMarket();
  const { chromeItems, isLoading } = useNavigation(marketId || undefined);
  const doors = chromeNavLinks(chromeItems);

  return (
    <section className={`${collectionsSection} pt-[clamp(1.25rem,3vw,2rem)] pb-[clamp(3.5rem,8vw,7rem)]`} aria-labelledby="collTitle" aria-busy={isLoading && doors.length === 0}>
      <div className={pageContainer}>
        <header className={sectionHead}>
          <h2 className={sectionTitle} id="collTitle">
            {copy("shopByCategories")}
          </h2>
          <p className={lead}>{copy("enterTheHouse")}</p>
        </header>

        <div className={collectionGrid}>
          {isLoading && doors.length === 0
            ? Array.from({ length: 4 }, (_, index) => (
                <span key={index} className={`${collectionCard} block h-40 animate-pulse bg-[var(--ink)]/10`} />
              ))
            : doors.map((door) => (
                <LocaleLink key={door.href} className={collectionCard} href={door.href}>
                  <span className={collectionBody}>
                    <span className={collectionTitle}>{door.label}</span>
                    <span className={`${linkUnderline} ${linkUnderlineLight}`}>{copy("explore")}</span>
                  </span>
                </LocaleLink>
              ))}
        </div>
      </div>
    </section>
  );
}
