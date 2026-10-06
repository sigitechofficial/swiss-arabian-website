"use client";

import { useEffect, useRef, useState } from "react";
import { bottle } from "@/styles/landingChrome";
import {
  pdpBottle,
  pdpFloor,
  pdpFrame,
  pdpGlow,
  pdpMist,
  pdpProduct,
  pdpStage,
  puffA,
  puffB,
  puffC,
  puffCore,
  puffD,
  puffE,
  puffVeil,
  thumb,
  thumbActive,
  thumbImg,
  thumbs,
  thumbsCol,
  thumbsNext,
} from "@/styles/pdpChrome";

type PdpGalleryProps = {
  images: string[];
  title: string;
  resetKey: string;
  onImageError: (src: string) => void;
};

export function PdpGallery({ images, title, resetKey, onImageError }: PdpGalleryProps) {
  const [activeImage, setActiveImage] = useState(0);
  const thumbsRef = useRef<HTMLDivElement>(null);
  const heroSrc = images[activeImage] ?? images[0] ?? null;

  useEffect(() => {
    setActiveImage(0);
  }, [resetKey]);

  useEffect(() => {
    const thumb = thumbsRef.current?.querySelector<HTMLElement>(
      `[data-thumb-index="${activeImage}"]`,
    );
    thumb?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  }, [activeImage]);

  return (
    <div className={pdpStage}>
      {images.length > 1 ? (
        <div className={thumbsCol}>
          <div ref={thumbsRef} className={thumbs} role="tablist" aria-label="Product images">
            {images.map((src, index) => (
              <button
                key={src}
                type="button"
                data-thumb-index={index}
                className={`${thumb} ${index === activeImage ? thumbActive : ""}`}
                role="tab"
                aria-selected={index === activeImage}
                onClick={() => setActiveImage(index)}
              >
                <img className={thumbImg} src={src} alt="" />
              </button>
            ))}
          </div>
          <button
            type="button"
            className={thumbsNext}
            aria-label="Next product image"
            onClick={() => setActiveImage((current) => (current + 1) % images.length)}
          >
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M5 7.5 10 12.5 15 7.5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      ) : null}

      <div className={pdpProduct}>
        <div className={pdpGlow} aria-hidden="true" />
        <div className={pdpFrame}>
          {heroSrc ? (
            <img
              key={heroSrc}
              className={pdpBottle}
              src={heroSrc}
              alt={title}
              onError={() => onImageError(heroSrc)}
            />
          ) : (
            <span className={bottle} aria-hidden="true" />
          )}
        </div>
        <div className={pdpFloor} aria-hidden="true" />
        <div className={pdpMist} aria-hidden="true">
          <span className={puffA} />
          <span className={puffB} />
          <span className={puffC} />
          <span className={puffD} />
          <span className={puffE} />
          <span className={puffCore} />
          <span className={puffVeil} />
        </div>
      </div>
    </div>
  );
}
