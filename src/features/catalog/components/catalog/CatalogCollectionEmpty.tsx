import Link from "next/link";
import { pageContainer } from "@/styles/siteChrome";
import { emptyArt, emptyCta, emptyEyebrow, emptyState, emptyText, emptyTitle } from "../../catalogChrome";

export function CatalogCollectionEmpty() {
  return (
    <div className={pageContainer}>
      <div className={emptyState} role="status">
        <img className={emptyArt} src="/assets/catalog/empty-products.svg" alt="" width={180} height={180} />
        <p className={emptyEyebrow}>Coming soon</p>
        <h3 className={emptyTitle}>No fragrances here yet</h3>
        <p className={emptyText}>
          We’re still filling this collection. Explore the rest of the house in the meantime.
        </p>
        <Link className={emptyCta} href="/products">
          Browse all fragrances
        </Link>
      </div>
    </div>
  );
}
