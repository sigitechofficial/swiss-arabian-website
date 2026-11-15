"use client";

import type { MouseEvent } from "react";
import { Heart } from "lucide-react";
import { useWishlistToggle } from "../hooks/useWishlistToggle";
import { useShopCopy } from "@/lib/i18n/useShopCopy";

type WishlistHeartButtonProps = {
  productId: string;
  size?: "card" | "pdp";
};

export function WishlistHeartButton({
  productId,
  size = "card",
}: WishlistHeartButtonProps) {
  const { available, inWishlist, isAuthenticated, disabled, toggle } =
    useWishlistToggle(productId);
  const t = useShopCopy();

  if (!available) return null;

  const compact = size === "card";

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    toggle();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-pressed={inWishlist}
      aria-label={
        !isAuthenticated
          ? t("wishlist.signInToSave")
          : inWishlist
            ? t("wishlist.remove")
            : t("wishlist.add")
      }
      className={`flex cursor-pointer items-center justify-center rounded-full border bg-page/90 text-sa-primary transition-colors hover:border-terra hover:text-terra disabled:cursor-wait ${
        compact
          ? "size-8 border-sa-border"
          : "size-[42px] border-sa-input"
      } ${inWishlist ? "border-terra text-terra" : ""}`}
    >
      <Heart
        className={compact ? "size-4" : "size-5"}
        strokeWidth={1.75}
        fill={inWishlist ? "currentColor" : "none"}
      />
    </button>
  );
}
