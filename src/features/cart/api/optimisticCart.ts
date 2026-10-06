"use client";

import { toastApiError } from "@/lib/api/toastApiError";
import { insiderAddToCart, insiderRemoveFromCart } from "@/lib/insider";
import { useCartStore, type CartLine } from "@/stores/useCartStore";
import { cartLineToInsiderItem } from "../utils/insiderCartItem";
import type { ApiCart } from "../types/cart";
import { getStoredCartId, storeCartId } from "../utils/guestToken";
import { addCartItem, getActiveCart, removeCartItem, updateCartItem } from "./cart.service";

/**
 * Optimistic cart writes.
 *
 * The bag changes (and the drawer opens) the instant the shopper acts; the
 * matching API calls run in the background, strictly one after another. The
 * server cart is written back only once the queue drains, so an early
 * response can never overwrite a quantity the shopper has since bumped again.
 * A failed call rolls its change back, and the bag then re-syncs with the
 * server's real cart.
 */

let inFlight = 0;
let chain: Promise<void> = Promise.resolve();
/** Latest server cart from this batch, held back until the queue drains. */
let latestCart: ApiCart | null = null;
let batchFailed = false;

function applyServerCart(cart: ApiCart) {
  storeCartId(cart.cartId);
  const store = useCartStore.getState();
  store.setCartId(cart.cartId);
  store.setCartFromApi(cart);
}

function currentCartId(): string | null {
  return latestCart?.cartId ?? useCartStore.getState().cartId ?? getStoredCartId();
}

/** Server id for a line — from the store, or a response still held in this batch. */
function serverItemId(variantId: string): string | null {
  const line = useCartStore.getState().lines.find((l) => l.variantId === variantId);
  if (line?.cartItemId) return line.cartItemId;
  const item = latestCart?.items.find((i) => i.variantId === variantId || i.sku === variantId);
  return item?.cartItemId ?? null;
}

/**
 * Run a server cart read/write after any in-flight bag edits.
 * The store is replaced only when the queue drains, so an older
 * response cannot clobber a newer quote. A rejection leaves the
 * last successful cart in place.
 */
export function runQueuedCart(run: () => Promise<ApiCart>): Promise<ApiCart> {
  if (inFlight === 0) useCartStore.getState().setSyncing(true);
  inFlight += 1;
  const task = chain.then(async () => {
    try {
      const cart = await run();
      latestCart = cart;
      storeCartId(cart.cartId);
      return cart;
    } finally {
      finishOne();
    }
  });
  chain = task.then(
    () => undefined,
    () => undefined,
  );
  return task;
}

function finishOne() {
  inFlight -= 1;
  if (inFlight > 0) return;

  const cart = latestCart;
  const cartId = currentCartId();
  const failed = batchFailed;
  latestCart = null;
  batchFailed = false;
  useCartStore.getState().setSyncing(false);

  if (!failed) {
    if (cart) applyServerCart(cart);
    return;
  }
  // Something failed: trust the server's copy of the cart over our guesses.
  void getActiveCart(cartId)
    .then(applyServerCart)
    .catch(() => {
      if (cart) applyServerCart(cart);
    });
}

function enqueue(
  run: () => Promise<ApiCart | null>,
  rollback: () => void,
  onSynced?: () => void,
) {
  if (inFlight === 0) useCartStore.getState().setSyncing(true);
  inFlight += 1;
  chain = chain.then(async () => {
    try {
      const cart = await run();
      if (cart) {
        latestCart = cart;
        // Guests: persist the id now so the next queued call hits the same cart.
        storeCartId(cart.cartId);
        onSynced?.();
      }
    } catch (error) {
      batchFailed = true;
      rollback();
      toastApiError(error);
    } finally {
      finishOne();
    }
  });
}

type LineDisplay = Omit<CartLine, "quantity" | "variantId" | "remote" | "cartItemId">;

/** Add a live catalog item: shows in the bag immediately, syncs behind. */
export function addItemOptimistic(input: {
  sku?: string;
  variantId?: string;
  quantity: number;
  line: LineDisplay;
}) {
  const key = input.variantId ?? input.sku;
  if (!key) return;

  useCartStore.getState().addLine({
    ...input.line,
    variantId: key,
    quantity: input.quantity,
    remote: true,
  });

  enqueue(
    () =>
      addCartItem({
        sku: input.sku,
        variantId: input.variantId,
        quantity: input.quantity,
        cartId: currentCartId(),
      }),
    () => {
      const store = useCartStore.getState();
      const line = store.lines.find((l) => l.variantId === key);
      if (line) store.updateQuantity(key, line.quantity - input.quantity);
    },
    () => {
      insiderAddToCart(
        cartLineToInsiderItem(
          {
            ...input.line,
            variantId: key,
            quantity: input.quantity,
          },
          input.quantity,
        ),
      );
    },
  );
}

/** Set a server-backed line's quantity (0 removes it) — instant, synced behind. */
export function setQuantityOptimistic(variantId: string, quantity: number) {
  const store = useCartStore.getState();
  const snapshot = store.lines.find((l) => l.variantId === variantId);
  if (!snapshot) return;
  const knownItemId = snapshot.cartItemId ?? null;

  store.updateQuantity(variantId, quantity);

  enqueue(
    async () => {
      const cartItemId = knownItemId ?? serverItemId(variantId);
      const cartId = currentCartId();
      // Never reached the server (its add failed) — nothing to sync.
      if (!cartItemId || !cartId) return null;
      return quantity <= 0
        ? removeCartItem({ cartItemId, cartId })
        : updateCartItem({ cartItemId, cartId, quantity });
    },
    () => {
      const current = useCartStore.getState();
      if (current.lines.some((l) => l.variantId === variantId)) {
        current.updateQuantity(variantId, snapshot.quantity);
      } else {
        current.addLine(snapshot);
      }
    },
    () => {
      const delta = quantity - snapshot.quantity;
      if (delta > 0) insiderAddToCart(cartLineToInsiderItem(snapshot, delta));
      else if (delta < 0) insiderRemoveFromCart(cartLineToInsiderItem(snapshot, -delta));
    },
  );
}

export function removeItemOptimistic(variantId: string) {
  setQuantityOptimistic(variantId, 0);
}
