"use client";

import { TOPBAR_LANGUAGES, TOPBAR_REGIONS } from "@/features/home/constants/chromeNav";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { pageContainer, topbar, topbarBoutique, topbarInner, topbarInnerBoutique, topbarSep, topbarSpacer, topbarUtils } from "@/styles/siteChrome";
import { TopbarMenu } from "../TopbarMenu";
import { TopbarTicker } from "../TopbarTicker";
import type { NavbarChrome } from "./useNavbarChrome";

export function NavbarTopbar({
  chrome,
  hideUtils = false,
  boutique = false,
}: {
  chrome: NavbarChrome;
  hideUtils?: boolean;
  boutique?: boolean;
}) {
  const copy = useShopCopy();
  const regionOptions =
    chrome.regionOptions.length > 0
      ? chrome.regionOptions
      : boutique
        ? TOPBAR_REGIONS.map(({ id, label, flag, countryCode }) => ({
            id,
            label,
            flag,
            countryCode,
          }))
        : TOPBAR_REGIONS;
  const languages = chrome.languageOptions.length
    ? chrome.languageOptions
    : TOPBAR_LANGUAGES;
  const languageOptions = boutique
    ? languages.map((option) => ({
        ...option,
        label: option.id.toUpperCase(),
      }))
    : languages;

  return (
    <div className={boutique ? `${topbar} ${topbarBoutique}` : topbar} data-topbar>
      <div className={`${pageContainer} ${topbarInner} ${boutique ? topbarInnerBoutique : ""}`} data-topbar-inner>
        {hideUtils ? null : <span className={topbarSpacer} aria-hidden="true" />}
        <TopbarTicker />
        {hideUtils ? null : (
          <div className={topbarUtils} data-topbar-utils>
            <TopbarMenu
              label={copy("shipTo")}
              value={chrome.regionId}
              options={regionOptions}
              open={chrome.openUtil === "region"}
              onOpenChange={(open) => chrome.setOpenUtil(open ? "region" : null)}
              onChange={chrome.setMarketId}
            />
            <span className={topbarSep} aria-hidden="true" />
            <TopbarMenu
              label={copy("language")}
              value={chrome.languageId}
              options={languageOptions}
              open={chrome.openUtil === "lang"}
              onOpenChange={(open) => chrome.setOpenUtil(open ? "lang" : null)}
              onChange={chrome.setLanguageId}
            />
          </div>
        )}
      </div>
    </div>
  );
}
