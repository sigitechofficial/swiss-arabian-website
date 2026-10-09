"use client";

import { useEffect, useEffectEvent, useRef, useState, type CSSProperties, type RefObject } from "react";
import { PartyPopper } from "lucide-react";
import { completedBundleSets } from "@/features/promotions";
import { useCartStore } from "@/stores/useCartStore";
import { confettiCircle, confettiDiamond, confettiPiece, confettiRibbon, partyPopper } from "@/styles/cartChrome";

export const CONFETTI_COLORS = ["#2f7d4a", "#3aa05a", "#c9a227", "#e0bd78", "#8c4435", "#fff", "#f4ead8"];
export const CONFETTI_SHAPES = ["circle", "ribbon", "diamond"] as const;

export type ConfettiPiece = {
  id: string;
  shape: (typeof CONFETTI_SHAPES)[number];
  style: Record<string, string>;
};

export type PopperBurst = {
  poppers: Array<{ id: string; style: Record<string, string> }>;
  pieces: ConfettiPiece[];
};

export function confettiShapeClass(shape: ConfettiPiece["shape"]): string {
  return shape === "circle" ? confettiCircle : shape === "ribbon" ? confettiRibbon : confettiDiamond;
}

/**
 * Two party poppers at the ends of the "You saved" bundle banner, each firing
 * confetti inward, plus a light fall from the top of the layer.
 */
export function partyPopperBurst(root: HTMLElement | null, layer: HTMLElement | null): PopperBurst {
  const lr = layer?.getBoundingClientRect();
  const width = lr?.width || 420;
  const banner = root?.querySelector("[data-bundle-saved]")?.getBoundingClientRect();
  const y = banner && lr ? banner.top - lr.top + banner.height / 2 : 130;
  const left = banner && lr ? banner.left - lr.left + 20 : 40;
  const right = banner && lr ? banner.right - lr.left - 20 : width - 40;
  const stamp = Date.now();

  const sides = [
    { x: left, flip: 1 },
    { x: right, flip: -1 },
  ];
  const pieces: ConfettiPiece[] = [];
  sides.forEach(({ x, flip }, side) => {
    for (let i = 0; i < 34; i++) {
      const shape = CONFETTI_SHAPES[i % 3];
      const size = 6 + Math.random() * 7;
      // Up and inward: the left popper sprays up-right, the right one up-left.
      const spread = Math.PI * (0.06 + Math.random() * 0.42);
      const angle = flip === 1 ? -spread : -Math.PI + spread;
      const dist = 80 + Math.random() * 230;
      pieces.push({
        id: `${stamp}-p${side}-${i}`,
        shape,
        style: {
          "--x": `${x + flip * 10}px`,
          "--y": `${y - 10}px`,
          "--w": `${shape === "ribbon" ? size * 0.42 : size}px`,
          "--h": `${shape === "ribbon" ? size * 1.4 : size}px`,
          "--c": CONFETTI_COLORS[(i + side) % CONFETTI_COLORS.length],
          "--dx": `${Math.cos(angle) * dist}px`,
          "--dy": `${Math.sin(angle) * dist + 70 + Math.random() * 90}px`,
          "--r0": `${Math.random() * 90 - 45}deg`,
          "--r1": `${180 + Math.random() * 360}deg`,
          "--d": `${180 + i * 9}ms`,
        },
      });
    }
  });
  for (let i = 0; i < 22; i++) {
    const shape = CONFETTI_SHAPES[i % 3];
    const size = 5 + Math.random() * 7;
    pieces.push({
      id: `${stamp}-r${i}`,
      shape,
      style: {
        "--x": `${4 + Math.random() * 92}%`,
        "--y": `${2 + Math.random() * 8}%`,
        "--w": `${shape === "ribbon" ? size * 0.42 : size}px`,
        "--h": `${shape === "ribbon" ? size * 1.4 : size}px`,
        "--c": CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        "--dx": `${Math.random() * 60 - 30}px`,
        "--dy": `${220 + Math.random() * 200}px`,
        "--r0": `${Math.random() * 90 - 45}deg`,
        "--r1": `${140 + Math.random() * 300}deg`,
        "--d": `${260 + i * 22}ms`,
      },
    });
  }
  return {
    poppers: sides.map(({ x, flip }, side) => ({
      id: `${stamp}-popper${side}`,
      style: { "--x": `${x}px`, "--y": `${y}px`, "--flip": String(flip) },
    })),
    pieces,
  };
}

/**
 * Party poppers when the priced quote reports a newly completed bundle set
 * (e.g. one Men + one Unisex + one Feminine). The first snapshot only sets the
 * baseline, so loading a bag that already holds a bundle stays quiet.
 *
 * The "You saved" banner comes from the progress query, which can land a beat
 * after the cart quote — wait briefly for it so the poppers frame it.
 * `beforeFire` runs once the banner is found (e.g. to scroll it into view) and
 * returns how long to wait before bursting.
 */
export function useBundleCelebration({
  rootRef,
  layerRef,
  enabled = true,
  beforeFire,
  onFire,
  onClear,
}: {
  rootRef: RefObject<HTMLElement | null>;
  layerRef: RefObject<HTMLElement | null>;
  enabled?: boolean;
  beforeFire?: (banner: Element | null, reduceMotion: boolean) => number;
  onFire?: () => void;
  onClear?: () => void;
}): PopperBurst | null {
  const promotions = useCartStore((s) => s.promotions);
  const hasPromotions = promotions != null;
  const bundleSets = completedBundleSets(promotions);
  const [burst, setBurst] = useState<PopperBurst | null>(null);
  const setsRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const celebrate = useEffectEvent(() => {
    if (!enabled) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let waits = 0;
    const fire = () => {
      const banner = rootRef.current?.querySelector("[data-bundle-saved]") ?? null;
      if (!banner && waits++ < 15) {
        timerRef.current = setTimeout(fire, 100);
        return;
      }
      const delay = beforeFire?.(banner, reduce) ?? 0;
      if (reduce) return;
      timerRef.current = setTimeout(() => {
        setBurst(partyPopperBurst(rootRef.current, layerRef.current));
        onFire?.();
        timerRef.current = setTimeout(() => {
          setBurst(null);
          onClear?.();
        }, 2400);
      }, delay);
    };
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(fire, 0);
  });

  useEffect(() => {
    if (!hasPromotions) return;
    const previous = setsRef.current;
    setsRef.current = bundleSets;
    if (previous == null || bundleSets <= previous) return;
    // Not cancelled when the cart re-quotes right after — only on unmount.
    celebrate();
  }, [hasPromotions, bundleSets]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return burst;
}

/** Confetti pieces and the two poppers; render inside a `confettiLayer`. */
export function PopperBurstLayer({ burst }: { burst: PopperBurst | null }) {
  if (!burst) return null;
  return (
    <>
      {burst.pieces.map((piece) => (
        <span
          key={piece.id}
          className={`${confettiPiece} ${confettiShapeClass(piece.shape)}`}
          style={piece.style as CSSProperties}
        />
      ))}
      {burst.poppers.map((popper) => (
        <span key={popper.id} className={partyPopper} style={popper.style as CSSProperties}>
          <PartyPopper size={22} strokeWidth={1.8} />
        </span>
      ))}
    </>
  );
}
