/**
 * Hero — Figma 254:1880 / Landing Page 001
 * Enterprise carousel of 3840×1000 banners (same frame as the original single asset).
 */
import { HeroCarousel } from "./HeroCarousel";

export function HeroSection() {
  return (
    <section
      className="mx-auto max-w-[1280px] px-4 pt-8 sm:px-6 lg:px-10"
      aria-label="Featured offers"
    >
      <HeroCarousel />
    </section>
  );
}
