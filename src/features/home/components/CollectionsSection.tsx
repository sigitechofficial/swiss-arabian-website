import Image from "next/image";
import Link from "next/link";
import { homeAssets } from "@/features/home/constants/homeAssets";
import { Accent, SectionHeader } from "./SectionHeader";

export function CollectionsSection() {
  const c = homeAssets.collections;

  return (
    <section
      className="mx-auto max-w-[1280px] px-4 py-16 sm:px-6 lg:px-10"
      aria-label="Discover our collections"
    >
      <SectionHeader
        eyebrow="Shop By"
        title={
          <>
            Discover our <Accent>collections</Accent>
          </>
        }
        href="/collections"
        linkLabel="Browse everything"
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Link
          href="/products?gender=men"
          className="group relative block min-h-[280px] overflow-hidden md:row-span-2 md:min-h-[436px]"
        >
          <Image
            src={c.forHim}
            alt="Fragrances for him"
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          <span className="sa-grad-bento absolute inset-0" />
          <span className="absolute bottom-6 left-6 text-white">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80">
              For Him
            </span>
            <span className="mt-1 block font-sans text-3xl font-semibold leading-tight">
              Fragrances
              <br />
              for him
            </span>
            <span className="mt-3 inline-block border-b border-white/70 pb-0.5 text-[12px] font-semibold uppercase tracking-[0.12em]">
              Shop men&apos;s
            </span>
          </span>
        </Link>

        <Link
          href="/products?gender=women"
          className="group relative block min-h-[210px] overflow-hidden"
        >
          <Image
            src={c.forHer}
            alt="Fragrances for her"
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          <span className="sa-grad-bento absolute inset-0" />
          <span className="absolute bottom-5 left-6 text-white">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80">
              For Her
            </span>
            <span className="mt-1 block font-sans text-2xl font-semibold leading-tight">
              Fragrances for her
            </span>
            <span className="mt-2 inline-block border-b border-white/70 pb-0.5 text-[12px] font-semibold uppercase tracking-[0.12em]">
              Shop women&apos;s
            </span>
          </span>
        </Link>

        <div className="grid grid-cols-2 gap-4">
          <Link
            href="#best-sellers"
            className="group relative block min-h-[210px] overflow-hidden"
          >
            <Image
              src={c.bestSellers}
              alt="Best sellers collection"
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="25vw"
            />
            <span className="sa-grad-bento absolute inset-0" />
            <span className="absolute bottom-4 left-4 text-white">
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/80">
                Most Worn
              </span>
              <span className="mt-0.5 block font-sans text-lg font-semibold leading-tight">
                Best sellers
              </span>
              <span className="mt-1.5 inline-block border-b border-white/70 pb-0.5 text-[11px] font-semibold uppercase tracking-[0.1em]">
                Shop
              </span>
            </span>
          </Link>
          <Link
            href="#new-launches"
            className="group relative block min-h-[210px] overflow-hidden"
          >
            <Image
              src={c.newIn}
              alt="New in collection"
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="25vw"
            />
            <span className="sa-grad-bento absolute inset-0" />
            <span className="absolute bottom-4 left-4 text-white">
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/80">
                Just In
              </span>
              <span className="mt-0.5 block font-sans text-lg font-semibold leading-tight">
                New in
              </span>
              <span className="mt-1.5 inline-block border-b border-white/70 pb-0.5 text-[11px] font-semibold uppercase tracking-[0.1em]">
                Shop
              </span>
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
