"use client";

import { useEffect, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { useAuthBootstrapped, useIsAuthenticated } from "@/hooks/useCurrentUser";
import { useWishlistMutations } from "../hooks/useWishlistMutations";
import { useWishlistStatusMap } from "../hooks/useWishlistStatus";
import { isProductUuid } from "../utils/productId";
import { useWishlistStatusScope } from "./WishlistStatusScope";

type WishlistHeartButtonProps = {
  productId: string;
  size?: "card" | "pdp";
};

export function WishlistHeartButton({
  productId,
  size = "card",
}: WishlistHeartButtonProps) {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const bootstrapped = useAuthBootstrapped();
  const scope = useWishlistStatusScope();
  const fallback = useWishlistStatusMap(scope ? [] : [productId]);
  const { toggle, add, remove } = useWishlistMutations();

  useEffect(() => {
    if (!isProductUuid(productId)) return;
    scope?.register(productId);
    return () => scope?.unregister(productId);
  }, [productId, scope]);

  if (!isProductUuid(productId)) return null;

  const inWishlist = scope
    ? scope.inWishlist(productId)
    : fallback.inWishlist(productId);
  const pending = add.isPending || remove.isPending;
  const compact = size === "card";

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (!bootstrapped || pending) return;
    if (!isAuthenticated) {
      const returnTo = `${window.location.pathname}${window.location.search}`;
      router.push(`/login?returnTo=${encodeURIComponent(returnTo)}`);
      return;
    }
    void toggle(productId, inWishlist);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!bootstrapped || pending}
      aria-pressed={inWishlist}
      aria-label={
        !isAuthenticated
          ? "Sign in to save this product"
          : inWishlist
            ? "Remove from wishlist"
            : "Add to wishlist"
      }
      className={`flex cursor-pointer items-center justify-center border bg-page/90 text-sa-primary transition-colors hover:border-terra hover:text-terra disabled:cursor-wait ${
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
