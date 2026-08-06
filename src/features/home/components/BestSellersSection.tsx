"use client";

import Image from "next/image";
import {
  bestSellerFeatured,
  bestSellers,
  formatUsd,
} from "@/features/home/data/homeContent";
import { notesFromFamily } from "@/features/cart/data/cartContent";
import { useAddToCart } from "@/features/cart/hooks/useAddToCart";
import { Stagger, StaggerItem } from "@/components/motion";
import { ProductCard } from "./ProductCard";
import { Accent, SectionHeader } from "./SectionHeader";

export function BestSellersSection() {
  const addToCart = useAddToCart();
  const featured = bestSellerFeatured;

  return (
    <section id="best-sellers" className="bg-ash py-16" aria-label="Best sellers">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-10">
        <SectionHeader
          eyebrow="Most Worn · This Season"
          title={
            <>
              Best <Accent>Sellers</Accent>
            </>
          }
          href="/products"
          linkLabel="View all 48"
        />
        <Stagger className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          <StaggerItem className="col-span-2">
            <article className="sa-grad-house relative flex h-full flex-col justify-end overflow-hidden p-6 text-white">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-light">
                № 01 · Most loved
              </p>
              <Image
                src={featured.image}
                alt={featured.name}
                width={240}
                height={240}
                className="mx-auto my-4 aspect-square w-full max-w-[240px] object-contain"
              />
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-white/70">
                {featured.family}
              </p>
              <h3 className="font-sans text-[22px] font-bold text-white">
                {featured.name}
              </h3>
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="font-sans text-[17px] font-bold">
                  {formatUsd(featured.price)}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    addToCart({
                      productId: featured.id,
                      variantId: featured.id,
                      slug: featured.slug,
                      title: featured.name,
                      imageUrl: featured.image,
                      unitPrice: featured.price,
                      currency: "USD",
                      notes: notesFromFamily(featured.family),
                    })
                  }
                  className="bg-white px-4 py-2.5 text-[12.5px] font-semibold text-ink transition-colors hover:bg-cream sm:px-6"
                >
                  Add
                </button>
              </div>
            </article>
          </StaggerItem>
          {bestSellers.map((product) => (
            <StaggerItem key={product.id}>
              <ProductCard product={product} />
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
