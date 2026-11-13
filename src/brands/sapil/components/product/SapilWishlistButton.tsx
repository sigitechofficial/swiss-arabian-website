"use client";

import { useWishlistToggle } from "@/features/wishlist/hooks/useWishlistToggle";
import { useSapilCopy } from "../../i18n/SapilCopy";
import { cx } from "../../ui/shared";

/** Heart outline (v9 icon stroke). */
function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M12 20.2s-7.2-4.6-7.2-10A4.1 4.1 0 0 1 12 7.4a4.1 4.1 0 0 1 7.2 2.8c0 5.4-7.2 10-7.2 10Z" />
    </svg>
  );
}

/**
 * Save / remove a product (shared wishlist logic: guests sign in first).
 * Inside a `WishlistStatusScope`, a whole grid shares one status request.
 * `variant`: "card" (40px white round on the tile) or "page" (58px, next to Add to bag).
 */
export function SapilWishlistButton({
  productId,
  name,
  variant = "card",
  className,
}: {
  productId: string;
  name: string;
  variant?: "card" | "page";
  className?: string;
}) {
  const t = useSapilCopy();
  const { available, inWishlist, isAuthenticated, disabled, toggle } = useWishlistToggle(productId);
  if (!available) return null;
  const label = !isAuthenticated
    ? t("product.wishlistSignIn", { name })
    : inWishlist
      ? t("product.wishlistRemove", { name })
      : t("product.wishlistAdd", { name });
  return (
    <button
      type="button"
      aria-pressed={inWishlist}
      aria-label={label}
      disabled={disabled}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggle();
      }}
      className={cx(
        "grid place-items-center rounded-full [transition:background_.2s,color_.2s] disabled:cursor-wait",
        variant === "card"
          ? "w-[40px] h-[40px] bg-sapil-white [&_svg]:w-[20px] [&_svg]:h-[20px] hover:bg-sapil-ink hover:text-sapil-white"
          : "w-[58px] h-[58px] flex-none rounded-[18px] bg-sapil-white border border-sapil-line [&_svg]:w-[22px] [&_svg]:h-[22px] hover:border-sapil-ink",
        inWishlist ? "text-sapil-rose" : "text-sapil-accent",
        className,
      )}
    >
      <HeartIcon filled={inWishlist} />
    </button>
  );
}
