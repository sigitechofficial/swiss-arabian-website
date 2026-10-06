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
  return (
    <div className={toolbar}>
      <button type="button" className={filtersButton} aria-expanded={filtersOpen} onClick={onToggleFilters}>
        Filters
      </button>
      <p className={catalogCount} aria-live="polite">
        Showing {shown} of {total}
      </p>
      <label className={catalogSort}>
        <span className={catalogSortLabel}>Sort by</span>
        <select
          className={catalogSortSelect}
          style={catalogSortSelectStyle}
          value={sort}
          onChange={(event) => onSort(event.target.value as SortOption)}
        >
          <option value="featured">Featured</option>
          <option value="newest">Newest</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          {serverFiltered ? null : (
            <>
              <option value="rating">Customer Ratings</option>
              <option value="bestselling">Best Selling</option>
            </>
          )}
        </select>
      </label>
    </div>
  );
}
