"use client";

import { useEffect, useRef, type ComponentType } from "react";
import { usePathname } from "next/navigation";
import { stripLocalePrefix } from "@/lib/i18n/localePath";
import { useCartStore } from "@/stores/useCartStore";
import { useUiStore } from "@/stores/useUiStore";
import { useGiftChoiceStore } from "../giftChoiceStore";
import { readGiftAwards } from "../types/promotions";
import {
  awaitingGiftChoice,
  giftAwardCode,
  nextGiftReveal,
  readGiftRevealSeen,
  writeGiftRevealSeen,
} from "../utils/giftWithPurchase";
import { GiftChoiceModal, type GiftChoiceModalProps } from "./GiftChoiceModal";

function cartSurface(pathname: string, cartOpen: boolean): boolean {
  return cartOpen || pathname === "/cart" || pathname.startsWith("/cart/");
}

/** Opens the free-gift choice; `Modal` is the brand's dialog (default: Swiss Arabian's). */
export function GiftChoiceHost({
  Modal = GiftChoiceModal,
}: { Modal?: ComponentType<GiftChoiceModalProps> } = {}) {
  const pathname = stripLocalePrefix(usePathname() ?? "/");
  const cartOpen = useUiStore((s) => s.cartOpen);
  const promotions = useCartStore((s) => s.promotions);
  const openCode = useGiftChoiceStore((s) => s.openCode);
  const celebrate = useGiftChoiceStore((s) => s.celebrate);
  const flashing = useGiftChoiceStore((s) => s.flashing);
  const seenRef = useRef<Set<string> | null>(null);

  const awards = readGiftAwards(promotions);
  const surface = cartSurface(pathname, cartOpen);
  const award = awards.find((item) => giftAwardCode(item) === openCode) ?? null;
  const signature = awards
    .map(
      (item) =>
        `${giftAwardCode(item)}:${awaitingGiftChoice(item) ? "wait" : "got"}:${item.giftItems.map((gift) => gift.sku).join(",")}`,
    )
    .join("|");

  useEffect(() => {
    if (seenRef.current == null) seenRef.current = readGiftRevealSeen();
    const seen = seenRef.current;
    const current = readGiftAwards(useCartStore.getState().promotions);
    const awaitingCodes = current.filter(awaitingGiftChoice).map(giftAwardCode);
    const awardedCodes = current
      .filter((item) => item.giftItems.length > 0)
      .map(giftAwardCode);
    const next = nextGiftReveal({
      awaitingCodes,
      awardedCodes,
      seen,
      surfaceVisible: surface,
      alreadyOpen: Boolean(useGiftChoiceStore.getState().openCode),
    });
    writeGiftRevealSeen(seen);
    if (!next.openCode) return;
    const reduce =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    useGiftChoiceStore.getState().open(next.openCode, { celebrate: !reduce });
  }, [signature, surface]);

  useEffect(() => {
    if (openCode && !award) useGiftChoiceStore.getState().close();
  }, [openCode, award]);

  useEffect(() => {
    document.body.toggleAttribute("data-gift-reveal", flashing);
    return () => document.body.removeAttribute("data-gift-reveal");
  }, [flashing]);

  const choosing =
    award != null &&
    award.choices.length > 0 &&
    (awaitingGiftChoice(award) || award.selectionMode === "CUSTOMER_CHOICE");
  if (!award || !choosing) return null;

  return (
    <Modal
      award={award}
      celebrate={celebrate}
      onClose={() => useGiftChoiceStore.getState().close()}
    />
  );
}
