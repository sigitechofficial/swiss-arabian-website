import type { ReactNode } from "react";
import Link from "next/link";
import { pageContainer } from "@/styles/siteChrome";
import { related as relatedSection, relatedAll, relatedGrid, relatedHead, relatedTitle } from "@/styles/pdpChrome";
import type { CatalogProduct } from "../../constants/catalogProducts";
import { PdpRelatedCard } from "./PdpRelatedCard";

type PdpRelatedRailProps = {
  id: string;
  heading: ReactNode;
  seeAllHref: string;
  products: CatalogProduct[];
  collectionSlug?: string;
};

export function PdpRelatedRail({
  id,
  heading,
  seeAllHref,
  products,
  collectionSlug,
}: PdpRelatedRailProps) {
  if (!products.length) return null;

  return (
    <section className={relatedSection} aria-labelledby={id}>
      <div className={pageContainer}>
        <div className={relatedHead}>
          <h2 className={relatedTitle} id={id}>
            {heading}
          </h2>
          <Link className={relatedAll} href={seeAllHref}>
            See all
          </Link>
        </div>
        <ul className={relatedGrid} role="list">
          {products.map((item) => (
            <PdpRelatedCard key={item.id} product={item} collectionSlug={collectionSlug} />
          ))}
        </ul>
      </div>
    </section>
  );
}
