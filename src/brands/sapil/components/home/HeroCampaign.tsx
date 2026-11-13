"use client";

import { getImageProps } from "next/image";
import { useEffect, useState } from "react";
import { isOptimizableImageSrc } from "@/lib/images/remoteImagePatterns";
import { useSapilCopy } from "../../i18n/SapilCopy";
import { Button, EYEBROW, Wrap, cx } from "../../ui";
import { SapilLink } from "../shared/SapilLink";
import type { CampaignSlide, HeroCampaign as HeroCampaignData } from "./cmsSections";

/** Art-directed slide picture (mobile image ≤760px), only the first one loads eagerly. */
function SlidePicture({ slide, first }: { slide: CampaignSlide; first: boolean }) {
  const common = { alt: slide.alt, fill: true, sizes: "(max-width: 1440px) 100vw, 1440px", quality: 75 } as const;
  const desktop = getImageProps({ ...common, src: slide.image, unoptimized: !isOptimizableImageSrc(slide.image), preload: first }).props;
  const mobile = slide.mobileImage
    ? getImageProps({ ...common, src: slide.mobileImage, unoptimized: !isOptimizableImageSrc(slide.mobileImage), sizes: "100vw" }).props
    : null;
  return (
    <picture>
      {mobile ? <source media="(max-width: 760px)" srcSet={mobile.srcSet ?? mobile.src} sizes={mobile.sizes} /> : null}
      <img
        {...desktop}
        alt={slide.alt}
        loading={first ? "eager" : "lazy"}
        fetchPriority={first ? "high" : undefined}
        style={{ ...desktop.style, objectPosition: slide.objectPosition ?? "60% 50%" }}
        className="w-full h-full object-cover max-900:!static max-900:aspect-[7/5] max-900:!h-auto"
      />
    </picture>
  );
}

/** Hero layout 3, campaign slideshow (v9 `.hc`): full-width images, copy on a white card, dots. */
export function HeroCampaign({ hero }: { hero: HeroCampaignData }) {
  const t = useSapilCopy();
  const [k, setK] = useState(0);
  const [stopped, setStopped] = useState(false);
  const count = hero.slides.length;

  useEffect(() => {
    if (count < 2 || !hero.autoplay || stopped) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setK((n) => (n + 1) % count), hero.intervalMs);
    return () => window.clearInterval(id);
  }, [count, hero.autoplay, hero.intervalMs, stopped]);

  return (
    <section aria-label={t("home.heroCampaignLabel")} className="pt-[24px] pb-[16px] max-900:pt-[16px] max-900:pb-[8px]">
      <Wrap>
        <div className="relative rounded-[32px] overflow-hidden h-[clamp(460px,32vw,580px)] bg-sapil-p-sky max-900:h-auto max-900:rounded-[24px] max-900:bg-sapil-white">
          {hero.slides.map((slide, i) => {
            const on = i === k;
            return (
              <article
                key={slide.id}
                aria-hidden={!on}
                inert={!on}
                className={cx(
                  "absolute inset-0 max-900:relative",
                  on
                    ? "opacity-100 visible [transition:opacity_.8s_var(--sapil-ease)] max-900:block"
                    : "opacity-0 invisible [transition:opacity_.8s_var(--sapil-ease),visibility_0s_.8s] max-900:hidden",
                )}
              >
                <div className="absolute inset-0 max-900:relative">
                  <SlidePicture slide={slide} first={i === 0} />
                </div>
                {slide.heading || slide.text || slide.primary ? (
                  <div className="absolute start-[48px] top-1/2 [transform:translateY(-50%)] w-[min(460px,42%)] bg-[rgba(255,253,250,.94)] rounded-[26px] p-[32px] shadow-sapil-lg max-900:static max-900:[transform:none] max-900:w-auto max-900:rounded-none max-900:shadow-none max-900:pt-[22px] max-900:px-[20px] max-900:pb-[28px] max-900:bg-sapil-white">
                    {slide.eyebrow ? <p className={cx(EYEBROW, on && "animate-sapil-rise")}>{slide.eyebrow}</p> : null}
                    {slide.heading ? (
                      <p
                        className={cx(
                          "font-sapil-display text-[clamp(40px,4vw,64px)] leading-[.98] tracking-[-.01em] my-[12px] [text-wrap:balance] max-900:text-[40px]",
                          on && "animate-sapil-rise",
                        )}
                        style={{ animationDelay: ".08s" }}
                      >
                        {slide.heading}
                      </p>
                    ) : null}
                    {slide.text ? (
                      <p className={cx("text-[16px] text-sapil-ink-2 mb-[22px]", on && "animate-sapil-rise")} style={{ animationDelay: ".16s" }}>
                        {slide.text}
                      </p>
                    ) : null}
                    {slide.primary || slide.secondary ? (
                      <div className={cx("flex gap-[10px] flex-wrap", on && "animate-sapil-rise")} style={{ animationDelay: ".24s" }}>
                        {slide.primary ? (
                          <Button href={slide.primary.href} LinkComponent={SapilLink}>
                            {slide.primary.label}
                          </Button>
                        ) : null}
                        {slide.secondary ? (
                          <Button href={slide.secondary.href} variant="line" LinkComponent={SapilLink}>
                            {slide.secondary.label}
                          </Button>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </article>
            );
          })}
          {count > 1 ? (
            <div
              role="group"
              aria-label={t("home.heroCampaignDots")}
              className="absolute end-[28px] bottom-[24px] flex gap-[6px] z-[2] max-900:top-[12px] max-900:bottom-auto max-900:end-[12px]"
            >
              {hero.slides.map((slide, i) => (
                <button
                  key={slide.id}
                  type="button"
                  aria-label={t("home.heroCampaignSlide", { n: i + 1 })}
                  aria-pressed={i === k}
                  onClick={() => {
                    setK(i);
                    setStopped(true);
                  }}
                  className="w-[44px] h-[44px] grid place-items-center"
                >
                  <i
                    className={cx(
                      "h-[10px] rounded-[5px] [transition:width_.3s_var(--sapil-ease),background_.3s]",
                      i === k ? "w-[30px] bg-sapil-white" : "w-[10px] bg-[rgba(255,255,255,.65)]",
                    )}
                  />
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </Wrap>
    </section>
  );
}
