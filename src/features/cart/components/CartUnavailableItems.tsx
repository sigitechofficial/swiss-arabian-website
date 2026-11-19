"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "@/components/ui/Toaster";
import { removeCartItem } from "@/features/cart/api/cart.service";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { useCartStore, type CartLine } from "@/stores/useCartStore";

/**
 * Items held in the bag because they are out of stock or unavailable right now.
 * They aren't in the totals or the order, and checkout goes ahead without them
 * (no manual step). They come back by themselves when they can be sold again;
 * the shopper may remove them. Checkout QA: an out-of-stock item used to vanish
 * from the bag with no explanation.
 */
export function CartUnavailableItems() {
  const copy = useShopCopy();
  const cartId = useCartStore((s) => s.cartId);
  const held = useCartStore((s) => s.unavailableLines);
  const lines = useCartStore((s) => s.lines);
  const setCartFromApi = useCartStore((s) => s.setCartFromApi);
  const [removing, setRemoving] = useState<string | null>(null);
  useBackInStockToasts(held, lines);

  if (held.length === 0) return null;

  async function remove(line: CartLine) {
    if (!cartId || !line.cartItemId) return;
    setRemoving(line.cartItemId);
    try {
      setCartFromApi(await removeCartItem({ cartId, cartItemId: line.cartItemId }));
      toast(copy("cart.unavailable.removed", { name: line.title }), "success");
    } catch {
      toast(copy("cart.unavailable.removeFailed"), "error");
    } finally {
      setRemoving(null);
    }
  }

  return (
    <section
      aria-labelledby="cart-unavailable-heading"
      className="mb-6 rounded-md border border-bone bg-cream/60 p-4"
      data-cart-unavailable
    >
      <h2 id="cart-unavailable-heading" className="m-0 text-base font-semibold">
        {copy("cart.unavailable.title")}
      </h2>
      <p className="mt-1 mb-3 text-sm text-ink/70">{copy("cart.unavailable.body")}</p>
      <ul className="m-0 list-none space-y-3 p-0">
        {held.map((line) => (
          <li key={line.cartItemId ?? line.variantId} className="flex items-center gap-3">
            {line.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={line.imageUrl}
                alt=""
                className="h-14 w-14 shrink-0 rounded object-cover opacity-60"
              />
            ) : null}
            <div className="min-w-0 flex-1">
              <p className="m-0 truncate text-sm font-semibold">{line.title}</p>
              <p className="m-0 text-xs text-ink/70">
                {copy(
                  line.heldStatus === "UNAVAILABLE"
                    ? "cart.unavailable.UNAVAILABLE"
                    : "cart.unavailable.OUT_OF_STOCK",
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void remove(line)}
              disabled={removing === line.cartItemId}
              className="cursor-pointer border-0 bg-transparent p-2 text-sm text-ink underline hover:text-copper disabled:cursor-wait disabled:opacity-50"
            >
              {copy("cart.unavailable.remove")}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** "Secret Oud is back in stock": a held line that came back to the bag. */
function useBackInStockToasts(held: CartLine[], lines: CartLine[]) {
  const copy = useShopCopy();
  const heldBefore = useRef(new Map<string, string>());
  useEffect(() => {
    const active = new Set(lines.map((line) => line.cartItemId).filter(Boolean));
    for (const [id, title] of heldBefore.current) {
      if (active.has(id)) toast(copy("cart.unavailable.backInStock", { name: title }), "success");
    }
    heldBefore.current = new Map(
      held.filter((line) => line.cartItemId).map((line) => [line.cartItemId!, line.title]),
    );
  }, [held, lines, copy]);
}
