"use client";

import { configuredLanguageOptions } from "@/features/markets/utils/marketLanguageOptions";
import { useLocaleConfig } from "@/lib/i18n/ShopLocaleProvider";
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
  // Markets come from the backend only (admin: Markets). Until it lists some, there is
  // no market picker — never a built-in list of markets that may not exist.
  const regionOptions = chrome.regionOptions;
  const showRegions = regionOptions.length > 0;
  const localeConfig = useLocaleConfig();
  const languages = chrome.languageOptions.length
    ? chrome.languageOptions
    : configuredLanguageOptions(localeConfig);
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
            {showRegions ? (
              <>
                <TopbarMenu
                  label={copy("shipTo")}
                  value={chrome.regionId}
                  options={regionOptions}
                  open={chrome.openUtil === "region"}
                  onOpenChange={(open) => chrome.setOpenUtil(open ? "region" : null)}
                  onChange={chrome.setMarketId}
                />
                <span className={topbarSep} aria-hidden="true" />
              </>
            ) : null}
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
