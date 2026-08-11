"use client";

import Image from "next/image";
import { useEffect, useState, type MouseEvent } from "react";

const ZOOM_SCALE = 1.85;

type ProductImageZoomProps = {
  images: string[];
  activeIndex: number;
  alt: string;
};

/**
 * E-com style hover zoom: zoom-in cursor + image scales around the pointer.
 */
export function ProductImageZoom({
  images,
  activeIndex,
  alt,
}: ProductImageZoomProps) {
  const [zooming, setZooming] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });

  useEffect(() => {
    setZooming(false);
  }, [activeIndex]);

  function updateOrigin(event: MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setOrigin({
      x: Math.min(100, Math.max(0, x)),
      y: Math.min(100, Math.max(0, y)),
    });
  }

  if (images.length === 0) {
    return (
      <div className="relative flex aspect-square items-center justify-center border border-sa-border bg-page">
        <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-sa-muted">
          Image coming soon
        </span>
      </div>
    );
  }

  return (
    <div
      className="relative aspect-square cursor-zoom-in overflow-hidden border border-sa-border bg-page motion-reduce:cursor-default"
      onMouseEnter={(event) => {
        updateOrigin(event);
        setZooming(true);
      }}
      onMouseLeave={() => setZooming(false)}
      onMouseMove={updateOrigin}
    >
      {images.map((src, index) => {
        const active = index === activeIndex;
        return (
          <Image
            key={`${src}-${index}`}
            src={src}
            alt={active ? alt : ""}
            fill
            priority={index === 0}
            aria-hidden={!active}
            sizes="(max-width: 1024px) 90vw, 560px"
            unoptimized={src.endsWith(".svg")}
            className={`object-cover will-change-transform motion-reduce:transform-none ${
              active ? "opacity-100" : "pointer-events-none opacity-0"
            } ${
              zooming
                ? "transition-opacity duration-300"
                : "transition-[opacity,transform] duration-300 ease-out"
            }`}
            style={
              active
                ? {
                    transformOrigin: `${origin.x}% ${origin.y}%`,
                    transform: zooming ? `scale(${ZOOM_SCALE})` : "scale(1)",
                  }
                : undefined
            }
          />
        );
      })}
    </div>
  );
}
