"use client";

import { useEffect, useLayoutEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
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

const TABS = [
  { id: "story", label: "Story" },
  { id: "notes", label: "Notes" },
  { id: "details", label: "Details" },
  { id: "wear", label: "How to wear" },
  { id: "ship", label: "Shipping" },
  { id: "auth", label: "Authenticity" },
] as const;

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
  const [activeTab, setActiveTab] = useState<TabId | null>("notes");
  const [tabsPaused, setTabsPaused] = useState(false);

  const compositionTabs = useMemo(() => {
    return TABS.filter((tab) => {
      if (tab.id === "notes") return showNotes;
      if (tab.id === "ship") return Boolean(shippingCopy);
      return true;
    });
  }, [showNotes, shippingCopy]);

  // Tabs on desktop (one panel stays open) and an accordion below 767px,
  // where every item starts closed. useLayoutEffect runs before paint so
  // the Notes panel does not flash open.
  useLayoutEffect(() => {
    const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;
    setActiveTab(isMobile ? null : compositionTabs[0]?.id ?? "story");
  }, [resetKey, compositionTabs]);

  useEffect(() => {
    setTabsPaused(false);
  }, [resetKey]);

  useEffect(() => {
    if (tabsPaused || typeof window === "undefined") return;
    const desktop = window.matchMedia("(min-width: 768px)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!desktop.matches || reduce.matches) return;

    const tick = () => {
      if (!desktop.matches) return;
      setActiveTab((current) => {
        const index = compositionTabs.findIndex((tab) => tab.id === current);
        const next = compositionTabs[(index < 0 ? 0 : index + 1) % Math.max(compositionTabs.length, 1)];
        return next?.id ?? current ?? "story";
      });
    };

    const id = window.setInterval(tick, 3000);
    return () => window.clearInterval(id);
  }, [tabsPaused, resetKey, compositionTabs]);

  return (
    <section className={composition} aria-labelledby="composition-heading">
      <div className={pageContainer}>
        <p className={compositionEyebrow}>The composition</p>
        <h2 className={compositionTitle} id="composition-heading">
          How it is <em className={compositionEm}>built.</em>
        </h2>

        <div className={compTabs} role="tablist" aria-label="Composition details">
          {compositionTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`${compTab} ${activeTab === tab.id ? compTabActive : ""}`}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => {
                setTabsPaused(true);
                setActiveTab(tab.id);
              }}
            >
              {tab.id === "notes" ? notesHeading : tab.label}
            </button>
          ))}
        </div>

        <div className={compPanels}>
          {compositionTabs.map((tab) => (
            <CompItem
              key={tab.id}
              label={tab.id === "notes" ? notesHeading : tab.label}
              open={activeTab === tab.id}
              onToggle={() => {
                setTabsPaused(true);
                setActiveTab((current) => (current === tab.id ? current : tab.id));
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
                    <p className={notesKey}>Bar length — how long each layer stays on skin.</p>
                  ) : null}
                </>
              ) : null}
              {tab.id === "details" ? (
                <dl className={specs}>
                  {metafields?.fragrance_family_text?.trim() ? (
                    <div className={specsRow}>
                      <dt>Family</dt>
                      <dd>{metafields.fragrance_family_text.trim()}</dd>
                    </div>
                  ) : null}
                  <div className={specsRow}>
                    <dt>Perfumer</dt>
                    <dd>Not published</dd>
                  </div>
                  <div className={specsRow}>
                    <dt>Format</dt>
                    <dd>{formatLabel}</dd>
                  </div>
                  <div className={specsRow}>
                    <dt>Collection</dt>
                    <dd>{COLLECTION_LABELS[product.collection] ?? "Signature"}</dd>
                  </div>
                  <div className={specsRow}>
                    <dt>Origin</dt>
                    <dd>United Arab Emirates</dd>
                  </div>
                </dl>
              ) : null}
              {tab.id === "wear" ? <p>{content.wear}</p> : null}
              {tab.id === "ship" && content.shipping ? <p>{content.shipping}</p> : null}
              {tab.id === "auth" ? <p>{content.authenticity}</p> : null}
            </CompItem>
          ))}
        </div>

        <p className={pdpCode}>Product code: {productCode(product)}</p>
      </div>
    </section>
  );
}
