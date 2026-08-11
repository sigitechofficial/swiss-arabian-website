"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { PackageCheck, PartyPopper, Truck } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { formatMoney } from "@/features/home/data/homeContent";
import { FREE_SHIPPING_THRESHOLD } from "../data/cartContent";

const TERRA = "#B46E57";
const FOREST = "#2F6B4A";
const FOREST_DARK = "#1F4C34";
const GOLD = "#B5883E";

type ConfettiParticle = {
  id: number;
  tx: number;
  ty: number;
  rot: number;
  color: string;
  delay: number;
  size: number;
  round: boolean;
};

function ConfettiBurst({ burstId }: { burstId: number }) {
  const particles = useMemo((): ConfettiParticle[] => {
    if (!burstId) return [];
    return Array.from({ length: 26 }, (_, i) => {
      const angle = (Math.PI * 2 * i) / 26 + Math.random() * 0.4;
      const dist = 60 + Math.random() * 70;
      const colors = [TERRA, FOREST, GOLD, "#2c241d"];
      return {
        id: i,
        tx: Math.cos(angle) * dist,
        ty: Math.sin(angle) * dist - 20,
        rot: Math.random() * 480 - 240,
        color: colors[i % colors.length]!,
        delay: Math.random() * 0.12,
        size: 5 + Math.random() * 5,
        round: Math.random() > 0.5,
      };
    });
  }, [burstId]);

  if (!burstId) return null;

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-visible"
      aria-hidden
    >
      {particles.map((p) => (
        <span
          key={`${burstId}-${p.id}`}
          className="sa-cart-confetti absolute left-1/2 top-0 opacity-0"
          style={
            {
              width: p.size,
              height: p.size,
              background: p.color,
              borderRadius: p.round ? "50%" : "2px",
              ["--tx" as string]: `${p.tx}px`,
              ["--ty" as string]: `${p.ty}px`,
              ["--rot" as string]: `${p.rot}deg`,
              animation: `sa-cart-confetti-burst 900ms ease-out ${p.delay}s forwards`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

type FreeShippingProgressProps = {
  subtotal: number;
  currency?: string;
};

/**
 * Free shipping route progress — truck tracks fill; whoop + confetti on unlock.
 */
export function FreeShippingProgress({ subtotal, currency = "AED" }: FreeShippingProgressProps) {
  const reduce = useReducedMotion();
  const [burstId, setBurstId] = useState(0);
  const wasUnlocked = useRef(false);

  const progress = Math.min(subtotal / FREE_SHIPPING_THRESHOLD, 1);
  const unlocked = subtotal >= FREE_SHIPPING_THRESHOLD;
  const remaining = Math.max(FREE_SHIPPING_THRESHOLD - subtotal, 0);

  useEffect(() => {
    if (reduce) {
      wasUnlocked.current = unlocked;
      return;
    }
    if (unlocked && !wasUnlocked.current) {
      setBurstId((id) => id + 1);
    }
    wasUnlocked.current = unlocked;
  }, [unlocked, reduce]);

  const truckLeft = `calc(${progress * 100}% - 10px)`;

  return (
    <div
      className={`relative mb-5 ${
        unlocked && burstId && !reduce ? "sa-cart-glow-pulse" : ""
      }`}
    >
      <div
        className={`mb-2 flex min-h-[18px] items-center gap-1.5 ${
          burstId && !reduce ? "sa-cart-badge-pop" : ""
        }`}
      >
        {unlocked ? (
          <>
            <PartyPopper
              size={15}
              className="shrink-0 text-[#1F4C34] dark:text-[#7CB896]"
              aria-hidden
            />
            <span className="text-[13px] font-semibold text-[#1F4C34] dark:text-[#7CB896]">
              Free shipping unlocked!
            </span>
          </>
        ) : subtotal > 0 ? (
          <span className="text-[13px] text-sa-muted">
            Add{" "}
            <strong className="font-semibold text-sa-primary">
              {formatMoney(remaining, currency)}
            </strong>{" "}
            more for free shipping
          </span>
        ) : (
          <span className="text-[13px] text-sa-muted">
            Free shipping on orders over {formatMoney(FREE_SHIPPING_THRESHOLD, currency)}
          </span>
        )}
      </div>

      <div className="relative pt-3.5">
        <div
          className={`absolute top-[-2px] transition-[left] duration-500 ease-[cubic-bezier(.2,.8,.2,1)] ${
            burstId && !reduce ? "sa-cart-truck-hop" : ""
          }`}
          style={{ left: truckLeft }}
        >
          <Truck
            size={20}
            color={unlocked ? FOREST_DARK : TERRA}
            fill={unlocked ? "#DCEBE1" : "#F5E6DF"}
            aria-hidden
          />
        </div>

        <div
          className="h-1.5 overflow-hidden bg-sa-border"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={FREE_SHIPPING_THRESHOLD}
          aria-valuenow={Math.min(subtotal, FREE_SHIPPING_THRESHOLD)}
          aria-label="Free shipping progress"
        >
          <div
            className="h-full transition-[width,background-color] duration-500 ease-[cubic-bezier(.2,.8,.2,1)]"
            style={{
              width: `${progress * 100}%`,
              background: unlocked ? FOREST : TERRA,
            }}
          />
        </div>

        <div className="mt-1.5 flex justify-between text-[11px] text-sa-muted">
          <span>$0</span>
          <span className="inline-flex items-center gap-1">
            <PackageCheck size={12} aria-hidden />
            {formatMoney(FREE_SHIPPING_THRESHOLD, currency)}
          </span>
        </div>
      </div>

      {!reduce ? <ConfettiBurst burstId={burstId} /> : null}
    </div>
  );
}
