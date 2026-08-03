"use client";

import Image from "next/image";
import Link from "next/link";
import {
  formatUsd,
  shaghafSpotlight,
} from "@/features/home/data/homeContent";
import { notesFromFamily } from "@/features/cart/data/cartContent";
import { useAddToCart } from "@/features/cart/hooks/useAddToCart";

export function ShaghafSection() {
  const addToCart = useAddToCart();

  return (
    <section className="bg-ash py-16" aria-label="The Shaghaf collection">
      <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-6 px-4 sm:px-6 lg:grid-cols-[1fr_1.2fr] lg:px-10">
        <div className="sa-grad-shaghaf flex min-h-[420px] flex-col justify-center p-10 text-white lg:sticky lg:top-32 lg:h-[calc(100vh-200px)] lg:max-h-[640px]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/80">
            The Collection
          </p>
          <h2 className="mt-3 font-sans text-5xl font-semibold tracking-tight text-white lg:text-6xl">
            Shaghaf
          </h2>
          <p className="mt-4 max-w-xs text-[14.5px] leading-relaxed text-white/85">
            Our most-loved line — oud, amber and gourmand warmth. &quot;Shaghaf&quot;
            means a deep, consuming passion.
          </p>
          <Link
            href="/collections/shaghaf"
            className="mt-7 inline-block w-fit bg-white px-8 py-3 text-[13px] font-semibold text-ink transition-colors hover:bg-cream"
          >
            Shop Shaghaf
          </Link>
        </div>

        <div className="flex flex-col gap-5 bg-cream p-6 dark:bg-section-soft lg:p-8">
          {shaghafSpotlight.map((item, index) => {
            const isLast = index === shaghafSpotlight.length - 1;
            return (
              <article
                key={item.id}
                className={isLast ? undefined : "border-b border-sa-border pb-6"}
              >
                <Image
                  src={item.image}
                  alt={item.name}
                  width={320}
                  height={320}
                  className="mx-auto aspect-square w-full max-w-[320px] object-contain"
                />
                <div className="mt-3 flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <p className="truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-sa-muted">
                      {item.family}
                    </p>
                    <h3 className="font-sans text-xl font-semibold text-sa-primary">
                      <Link href={`/products/${item.slug}`}>{item.name}</Link>
                    </h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-sans text-[17px] font-bold text-sa-primary">
                      {formatUsd(item.price)}
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        addToCart({
                          productId: item.id,
                          variantId: item.id,
                          slug: item.slug,
                          title: item.name,
                          imageUrl: item.image,
                          unitPrice: item.price,
                          currency: "USD",
                          notes: notesFromFamily(item.family),
                        })
                      }
                      className="border border-sa-primary px-4 py-1.5 text-[12.5px] font-semibold text-sa-primary transition-colors hover:bg-sa-primary hover:text-page"
                    >
                      Add +
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
