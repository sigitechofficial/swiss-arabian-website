/**
 * Hero — Figma 254:1880 / Landing Page 001
 * Banner asset is ~3840×1000 with baked-in title + Shop Now — do not crop on md+.
 */
import Image from "next/image";
import Link from "next/link";
import { homeAssets } from "@/features/home/constants/homeAssets";

export function HeroSection() {
  return (
    <section
      className="mx-auto max-w-[1280px] px-4 pt-8 sm:px-6 lg:px-10"
      aria-label="Featured offer"
    >
      <Link href="/#new-launches" className="block overflow-hidden">
        {/* Mobile: copy above, product crop below */}
        <div className="bg-cream text-center dark:bg-section-soft md:hidden">
          <div className="px-6 pb-6 pt-9">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.32em] text-gold">
              Featured Offer
            </p>
            <p className="mt-3 font-sans text-[32px] font-bold leading-tight tracking-[0.08em] text-sa-primary">
              SCENTS
              <br />
              <span className="font-light tracking-[0.18em]">OF SUMMER</span>
            </p>
            <p className="mt-2 text-[12px] uppercase tracking-[0.18em] text-sa-muted">
              On your favorite fragrances
            </p>
            <span className="mt-5 inline-block bg-terra px-8 py-2.5 text-[12.5px] font-semibold text-white">
              Shop Now
            </span>
          </div>
          <div className="relative h-60 w-full">
            <Image
              src={homeAssets.hero}
              alt=""
              fill
              priority
              className="object-cover object-[10%_center]"
              sizes="100vw"
              aria-hidden
            />
          </div>
        </div>

        {/* Tablet/Desktop: full banner at natural aspect — title + CTA are in the image */}
        <Image
          src={homeAssets.hero}
          alt="Scents of Summer — Shop now. Terms and conditions apply."
          width={3840}
          height={1000}
          priority
          className="hidden h-auto w-full md:block"
          sizes="(max-width: 1280px) calc(100vw - 48px), 1200px"
        />
      </Link>
    </section>
  );
}
