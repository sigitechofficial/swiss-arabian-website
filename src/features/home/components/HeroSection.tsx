/**
 * Hero — Figma 254:1880 / Landing Page 001
 * Carousel: portrait on mobile, taller landscape frame on desktop.
 */
import { HeroCarousel } from "./HeroCarousel";

export function HeroSection() {
  return (
    <section
      className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-10"
      aria-label="Featured offers"
    >
      <HeroCarousel />
    </section>
  );
}
