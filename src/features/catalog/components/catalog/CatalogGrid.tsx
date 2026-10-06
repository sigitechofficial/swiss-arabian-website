import { PromotionCampaignTile } from "@/features/promotions/components/PromotionOffers";
import { WishlistStatusScope } from "@/features/wishlist/components/WishlistStatusScope";
import { catalogOfferTile, productGrid } from "@/styles/shopChrome";
import { badgeForProduct, type DiscoveryOffer, type PromotionDiscovery } from "@/features/promotions/types/discovery";
import type { CatalogProduct } from "../../constants/catalogProducts";
import { gridEmpty } from "../../catalogChrome";
import { CatalogProductCard } from "./CatalogProductCard";

/** First tile after four products, the next after eight. A short list keeps them at the end. */
function offerTileAt(slot: number, productCount: number): number {
  return Math.min((slot + 1) * 4, productCount);
}

type CatalogGridProps = {
  products: CatalogProduct[];
  collectionSlug?: string;
  campaignTiles: DiscoveryOffer[];
  discovery: PromotionDiscovery | null | undefined;
};

export function CatalogGrid({ products, collectionSlug, campaignTiles, discovery }: CatalogGridProps) {
  if (products.length === 0) {
    return <p className={gridEmpty}>No products match these filters.</p>;
  }

  return (
    <WishlistStatusScope>
      <ul className={productGrid} role="list">
        {products.flatMap((product, index) => {
          const badge = badgeForProduct(discovery, product.id);
          const card = (
            <CatalogProductCard
              key={product.id}
              product={product}
              collectionSlug={collectionSlug}
              promotionBadge={badge?.badge}
              promotionLabel={badge?.title}
            />
          );
          const tiles = campaignTiles.flatMap((offer, slot) => {
            const at = offerTileAt(slot, products.length);
            if (index !== at || at === products.length) return [];
            return [
              <li key={offer.campaignCode} className={catalogOfferTile}>
                <PromotionCampaignTile offer={offer} />
              </li>,
            ];
          });
          return [...tiles, card];
        })}
        {campaignTiles.flatMap((offer, slot) => {
          const at = offerTileAt(slot, products.length);
          if (at !== products.length) return [];
          return [
            <li key={offer.campaignCode} className={catalogOfferTile}>
              <PromotionCampaignTile offer={offer} />
            </li>,
          ];
        })}
      </ul>
    </WishlistStatusScope>
  );
}
