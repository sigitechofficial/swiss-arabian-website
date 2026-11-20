"use client";

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { intlLocale } from "@/lib/i18n/locales";
import type { MessageKey } from "@/lib/i18n/messages";
import { useShopLocale } from "@/lib/i18n/ShopLocaleProvider";
import { linkSlots, TextWithLinks } from "@/lib/i18n/TextWithLinks";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { pageContainer } from "@/styles/siteChrome";
import {
  compAccBtn,
  compHeading,
  compItem,
  compMark,
  compPanel,
  compPanels,
  compTab,
  compTabActive,
  compTabs,
  composition,
  compositionEm,
  compositionEyebrow,
  compositionIntro,
  compositionTitle,
  notes,
  notesBar,
  notesKey,
  notesLevel,
  notesNames,
  notesRow,
  pdpCode,
  specs,
  specsRow,
} from "@/styles/pdpChrome";
import { COLLECTION_LABELS, type CatalogProduct } from "../../constants/catalogProducts";
import type { ProductDetailContent } from "../../constants/productDetailContent";
import type { StorefrontPdpMetafields } from "../../types/pdpMetafields";

/** Composition tabs; `label` is a message key. */
const TABS = [
  { id: "story", label: "pdp.composition.tab.story" },
  { id: "notes", label: "pdp.composition.tab.notes" },
  { id: "details", label: "pdp.composition.tab.details" },
  { id: "wear", label: "pdp.composition.tab.wear" },
  { id: "ship", label: "pdp.composition.tab.ship" },
  { id: "auth", label: "pdp.composition.tab.auth" },
] as const satisfies readonly { id: string; label: MessageKey }[];

/** The house's country of origin, named in the page's language. */
function originName(locale: string): string {
  try {
    return new Intl.DisplayNames([intlLocale(locale)], { type: "region" }).of("AE") ?? "AE";
  } catch {
    return "AE";
  }
}

type TabId = (typeof TABS)[number]["id"];

export type CompositionNote = {
  level: string;
  names: string;
  bar?: number;
};

type PdpCompositionProps = {
  product: CatalogProduct;
  content: ProductDetailContent;
  metafields: StorefrontPdpMetafields | null | undefined;
  formatLabel: string;
  notesHeading: string;
  notesRows: CompositionNote[];
  notesBlurb?: string;
  showNotes: boolean;
  showLongevityBars: boolean;
  shippingCopy: string;
  resetKey: string;
};

function productCode(product: CatalogProduct): string {
  if (product.sku?.trim()) return product.sku.trim();
  const base = product.title.replace(/\s+/g, "").toUpperCase();
  const size = product.concentration === "extrait" ? "EXT50" : "EDP100";
  return `SA-${base}-${size}`;
}

function CompItem({
  label,
  open,
  onToggle,
  children,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className={compItem}>
      <h3 className={compHeading}>
        <button type="button" className={compAccBtn} aria-expanded={open} onClick={onToggle}>
          {label} <span className={compMark} aria-hidden="true" />
        </button>
      </h3>
      <div className={compPanel} role="tabpanel" hidden={!open}>
        {children}
      </div>
    </div>
  );
}

export function PdpComposition({
  product,
  content,
  metafields,
  formatLabel,
  notesHeading,
  notesRows,
  notesBlurb,
  showNotes,
  showLongevityBars,
  shippingCopy,
  resetKey,
}: PdpCompositionProps) {
  const t = useShopCopy();
  const locale = useShopLocale();

  const compositionTabs = useMemo(() => {
    return TABS.filter((tab) => {
      if (tab.id === "notes") return showNotes;
      if (tab.id === "ship") return Boolean(shippingCopy);
      return true;
    });
  }, [showNotes, shippingCopy]);

  // Tabs on desktop (one panel stays open) and an accordion below 767px,
  // where every item starts closed. Until the shopper picks a tab (or the
  // rotation moves on), the open tab is that default for the screen size.
  const isMobile = useMediaQuery("(max-width: 767px)");
  const defaultTab: TabId | null = isMobile ? null : compositionTabs[0]?.id ?? "story";
  const [chosenTab, setChosenTab] = useState<TabId | null | undefined>(undefined);
  const [tabsPaused, setTabsPaused] = useState(false);
  const activeTab = chosenTab === undefined ? defaultTab : chosenTab;

  // New product or different tab set: back to the default, rotation resumed.
  const tabsKey = `${resetKey}|${compositionTabs.map((tab) => tab.id).join(",")}`;
  const [lastTabsKey, setLastTabsKey] = useState(tabsKey);
  if (lastTabsKey !== tabsKey) {
    setLastTabsKey(tabsKey);
    setChosenTab(undefined);
    setTabsPaused(false);
  }

  useEffect(() => {
    if (tabsPaused || typeof window === "undefined") return;
    const desktop = window.matchMedia("(min-width: 768px)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!desktop.matches || reduce.matches) return;

    const tick = () => {
      if (!desktop.matches) return;
      setChosenTab((chosen) => {
        const current = chosen === undefined ? defaultTab : chosen;
        const index = compositionTabs.findIndex((tab) => tab.id === current);
        const next = compositionTabs[(index < 0 ? 0 : index + 1) % Math.max(compositionTabs.length, 1)];
        return next?.id ?? current ?? "story";
      });
    };

    const id = window.setInterval(tick, 3000);
    return () => window.clearInterval(id);
  }, [tabsPaused, resetKey, compositionTabs, defaultTab]);

  return (
    <section className={composition} aria-labelledby="composition-heading">
      <div className={pageContainer}>
        <p className={compositionEyebrow}>{t("pdp.composition.eyebrow")}</p>
        <h2 className={compositionTitle} id="composition-heading">
          <TextWithLinks
            text={t("pdp.composition.title", linkSlots(["em"]))}
            links={{ em: <em className={compositionEm}>{t("pdp.composition.titleEm")}</em> }}
          />
        </h2>

        <div className={compTabs} role="tablist" aria-label={t("pdp.composition.tabs")}>
          {compositionTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`${compTab} ${activeTab === tab.id ? compTabActive : ""}`}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => {
                setTabsPaused(true);
                setChosenTab(tab.id);
              }}
            >
              {tab.id === "notes" ? notesHeading : t(tab.label)}
            </button>
          ))}
        </div>

        <div className={compPanels}>
          {compositionTabs.map((tab) => (
            <CompItem
              key={tab.id}
              label={tab.id === "notes" ? notesHeading : t(tab.label)}
              open={activeTab === tab.id}
              onToggle={() => {
                setTabsPaused(true);
                setChosenTab(tab.id);
              }}
            >
              {tab.id === "story" ? <p className={compositionIntro}>{content.story}</p> : null}
              {tab.id === "notes" ? (
                <>
                  <ul className={notes} role="list">
                    {notesRows.map((row) => (
                      <li className={notesRow} key={row.level}>
                        <p className={notesLevel}>{row.level}</p>
                        <p className={notesNames}>{row.names}</p>
                        {showLongevityBars && row.bar != null ? (
                          <div
                            className={notesBar}
                            aria-hidden="true"
                            style={{ "--bar": `${row.bar}%` } as CSSProperties}
                          />
                        ) : null}
                      </li>
                    ))}
                  </ul>
                  {notesBlurb ? <p className={compositionIntro}>{notesBlurb}</p> : null}
                  {showLongevityBars ? (
                    <p className={notesKey}>{t("pdp.composition.barKey")}</p>
                  ) : null}
                </>
              ) : null}
              {tab.id === "details" ? (
                <dl className={specs}>
                  {metafields?.fragrance_family_text?.trim() ? (
                    <div className={specsRow}>
                      <dt>{t("pdp.composition.family")}</dt>
                      <dd>{metafields.fragrance_family_text.trim()}</dd>
                    </div>
                  ) : null}
                  <div className={specsRow}>
                    <dt>{t("pdp.composition.perfumer")}</dt>
                    <dd>{t("pdp.composition.notPublished")}</dd>
                  </div>
                  <div className={specsRow}>
                    <dt>{t("pdp.composition.format")}</dt>
                    <dd>{formatLabel}</dd>
                  </div>
                  <div className={specsRow}>
                    <dt>{t("pdp.composition.collection")}</dt>
                    <dd>{COLLECTION_LABELS[product.collection] ?? t("pdp.composition.signature")}</dd>
                  </div>
                  <div className={specsRow}>
                    <dt>{t("pdp.composition.origin")}</dt>
                    <dd>{originName(locale)}</dd>
                  </div>
                </dl>
              ) : null}
              {tab.id === "wear" ? <p>{content.wear}</p> : null}
              {tab.id === "ship" && content.shipping ? <p>{content.shipping}</p> : null}
              {tab.id === "auth" ? <p>{content.authenticity}</p> : null}
            </CompItem>
          ))}
        </div>

        <p className={pdpCode}>{t("pdp.composition.code", { code: productCode(product) })}</p>
      </div>
    </section>
  );
}
