"use client";

import Image from "next/image";
import Link from "next/link";
import {
  formatUsd,
  shaghafSpotlight,
} from "@/features/home/data/homeContent";
import { homeAssets } from "@/features/home/constants/homeAssets";
import { useAddCatalogProduct } from "@/features/cart/hooks/useAddCatalogProduct";

export function ShaghafSection() {
  const addCatalogProduct = useAddCatalogProduct();

  return (
    <section className="bg-ash py-16" aria-label="The Shaghaf collection">
      <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-6 px-4 sm:px-6 lg:grid-cols-[1fr_1.2fr] lg:px-10">
        <div className="relative min-h-[420px] overflow-hidden lg:sticky lg:top-32 lg:h-[calc(100dvh-8rem)] lg:self-start">
          <Image
            src={homeAssets.shaghaf.panel}
            alt="Shaghaf Nectar Blush"
            fill
            className="object-cover object-center"
            sizes="(max-width: 1024px) 100vw, 45vw"
            priority={false}
          />
          <div className="absolute inset-x-0 bottom-0 z-[1] flex justify-center p-6 sm:p-8">
            <Link
              href="/collections/shaghaf"
              className="bg-terra px-8 py-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-white transition-colors hover:bg-[#a25e48]"
            >
              Shop now
            </Link>
          </div>
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
                <div className="mt-3 flex items-end gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-sa-muted">
                      {item.family}
                    </p>
                    <h3 className="font-sans text-xl font-semibold text-sa-primary">
                      <Link href={`/products/${item.slug}`}>{item.name}</Link>
                    </h3>
                  </div>
                  <div className="ml-auto flex shrink-0 items-center gap-3">
                    <p className="font-sans text-[17px] font-bold text-sa-primary">
                      {formatUsd(item.price)}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        void addCatalogProduct({
                          slug: item.slug,
                          title: item.name,
                          imageUrl: item.image,
                          price: item.price,
                          family: item.family,
                        });
                      }}
                      className="border border-sa-primary px-4 py-1.5 text-[12.5px] font-semibold text-sa-primary transition-colors hover:bg-sa-primary hover:text-page"
                    >
                      Add
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
