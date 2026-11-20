"use client";

import { useShopCopy } from "@/lib/i18n/useShopCopy";
import type { SortOption } from "../../constants/catalogProducts";
import {
  catalogCount,
  catalogSort,
  catalogSortLabel,
  catalogSortSelect,
  catalogSortSelectStyle,
  filtersButton,
  toolbar,
} from "../../catalogChrome";

type CatalogToolbarProps = {
  filtersOpen: boolean;
  onToggleFilters: () => void;
  shown: number;
  total: number;
  sort: SortOption;
  onSort: (sort: SortOption) => void;
  serverFiltered: boolean;
};

export function CatalogToolbar({
  filtersOpen,
  onToggleFilters,
  shown,
  total,
  sort,
  onSort,
  serverFiltered,
}: CatalogToolbarProps) {
  const t = useShopCopy();
  return (
    <div className={toolbar}>
      <button type="button" className={filtersButton} aria-expanded={filtersOpen} onClick={onToggleFilters}>
        {t("catalog.toolbar.filters")}
      </button>
      <p className={catalogCount} aria-live="polite">
        {t("search.showing", { shown, total })}
      </p>
      <label className={catalogSort}>
        <span className={catalogSortLabel}>{t("catalog.toolbar.sortBy")}</span>
        <select
          className={catalogSortSelect}
          style={catalogSortSelectStyle}
          value={sort}
          onChange={(event) => onSort(event.target.value as SortOption)}
        >
          <option value="featured">{t("catalog.sort.featured")}</option>
          <option value="newest">{t("search.sortOption.newest")}</option>
          <option value="price-asc">{t("catalog.sort.priceAsc")}</option>
          <option value="price-desc">{t("catalog.sort.priceDesc")}</option>
          {serverFiltered ? null : (
            <>
              <option value="rating">{t("catalog.sort.rating")}</option>
              <option value="bestselling">{t("catalog.sort.bestSelling")}</option>
            </>
          )}
        </select>
      </label>
    </div>
  );
}
