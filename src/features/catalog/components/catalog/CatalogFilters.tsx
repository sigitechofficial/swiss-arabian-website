"use client";

import { useShopCopy } from "@/lib/i18n/useShopCopy";
import type { Concentration } from "../../constants/catalogProducts";
import type { StorefrontFacetOption } from "../../types/catalogFacets";
import {
  filtersApply,
  filtersBackdrop,
  filtersBody,
  filtersClose,
  filtersFoot,
  filtersGroup,
  filtersHead,
  filtersLabel,
  filtersRail,
  filtersTitle,
  priceFill,
  priceInput,
  priceRange,
  priceSlider,
  priceTrack,
  priceValues,
  railFilterCount,
} from "../../catalogChrome";
import { CatalogFilterChoices } from "./CatalogFilterChoices";

type CatalogFiltersProps = {
  open: boolean;
  onClose: () => void;
  currency: string;
  priceFloor: number;
  priceCeil: number;
  priceMin: number;
  priceMax: number;
  fillLeft: number;
  fillRight: number;
  onPriceMin: (value: number) => void;
  onPriceMax: (value: number) => void;
  showPrice: boolean;
  allCount: number;
  serverFiltered: boolean;
  showConcentration: boolean;
  concentration: string;
  concentrationOptions: StorefrontFacetOption[];
  onConcentration: (value: "all" | Concentration | string) => void;
  showCollection: boolean;
  collection: string;
  collectionOptions: StorefrontFacetOption[];
  onCollection: (value: string) => void;
  showNotes: boolean;
  note: string;
  noteOptions: StorefrontFacetOption[];
  onNote: (value: string) => void;
  showFragranceFamily: boolean;
  fragranceFamily: string;
  fragranceFamilyOptions: StorefrontFacetOption[];
  onFragranceFamily: (value: string) => void;
  onApply: () => void;
};

export function CatalogFilters({
  open,
  onClose,
  currency,
  priceFloor,
  priceCeil,
  priceMin,
  priceMax,
  fillLeft,
  fillRight,
  onPriceMin,
  onPriceMax,
  showPrice,
  allCount,
  serverFiltered,
  showConcentration,
  concentration,
  concentrationOptions,
  onConcentration,
  showCollection,
  collection,
  collectionOptions,
  onCollection,
  showNotes,
  note,
  noteOptions,
  onNote,
  showFragranceFamily,
  fragranceFamily,
  fragranceFamilyOptions,
  onFragranceFamily,
  onApply,
}: CatalogFiltersProps) {
  const copy = useShopCopy();
  return (
    <>
      <button
        type="button"
        className={filtersBackdrop(open)}
        aria-label="Close filters"
        tabIndex={open ? 0 : -1}
        onClick={onClose}
      />
      <aside className={filtersRail(open)} aria-label="Filters">
        <div className={filtersHead}>
          <p className={filtersTitle}>{copy("filterBy")}</p>
          <button type="button" className={filtersClose} aria-label="Close filters" onClick={onClose}>
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M5 5l10 10M15 5L5 15" />
            </svg>
          </button>
        </div>

        <div className={filtersBody}>
          {showPrice ? (
            <div className={filtersGroup} role="group" aria-label="Price">
              <p className={filtersLabel}>Price</p>
              <div className={priceRange}>
                <div className={priceValues}>
                  <span>
                    {currency} <strong>{priceMin.toFixed(0)}</strong>
                  </span>
                  <span>
                    {currency} <strong>{priceMax.toFixed(0)}</strong>
                  </span>
                </div>
                <div className={priceSlider}>
                  <div className={priceTrack} />
                  <div
                    className={priceFill}
                    style={{ insetInlineStart: `${fillLeft}%`, insetInlineEnd: `${fillRight}%` }}
                  />
                  <input
                    className={priceInput}
                    type="range"
                    min={priceFloor}
                    max={priceCeil}
                    value={priceMin}
                    step={1}
                    aria-label="Minimum price"
                    onChange={(event) => onPriceMin(Math.min(Number(event.target.value), priceMax))}
                  />
                  <input
                    className={priceInput}
                    type="range"
                    min={priceFloor}
                    max={priceCeil}
                    value={priceMax}
                    step={1}
                    aria-label="Maximum price"
                    onChange={(event) => onPriceMax(Math.max(Number(event.target.value), priceMin))}
                  />
                </div>
              </div>
            </div>
          ) : null}

          {showConcentration ? (
            <CatalogFilterChoices
              label="Concentration"
              allLabel="All "
              allSuffix={<span className={railFilterCount}>({allCount})</span>}
              value={concentration}
              options={concentrationOptions}
              onChange={onConcentration}
            />
          ) : null}

          {showCollection ? (
            <CatalogFilterChoices
              label="Collection"
              allLabel="All collections"
              allSuffix={serverFiltered ? <span className={railFilterCount}> ({allCount})</span> : null}
              value={collection}
              options={collectionOptions}
              onChange={onCollection}
            />
          ) : null}

          {showNotes ? (
            <CatalogFilterChoices
              label="Featured note"
              allLabel="All notes"
              allSuffix={serverFiltered ? <span className={railFilterCount}> ({allCount})</span> : null}
              value={note}
              options={noteOptions}
              onChange={onNote}
            />
          ) : null}

          {showFragranceFamily ? (
            <CatalogFilterChoices
              label="Fragrance family"
              allLabel="All families"
              allSuffix={serverFiltered ? <span className={railFilterCount}> ({allCount})</span> : null}
              value={fragranceFamily}
              options={fragranceFamilyOptions}
              onChange={onFragranceFamily}
            />
          ) : null}
        </div>

        <div className={filtersFoot}>
          <button type="button" className={filtersApply} onClick={onApply}>
            Apply Filters
          </button>
        </div>
      </aside>
    </>
  );
}
