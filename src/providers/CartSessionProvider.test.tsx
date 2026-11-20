import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiClientError } from "@/lib/api/apiError";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCartStore } from "@/stores/useCartStore";
import { useUiStore } from "@/stores/useUiStore";

const api = vi.hoisted(() => ({ getActiveCart: vi.fn(), createOrResolveCart: vi.fn() }));
vi.mock("@/features/cart/api/cart.service", () => api);

import { getStoredCartId, storeCartId } from "@/features/cart/utils/guestToken";
import { clearTokens, setTokens } from "@/lib/auth/token";
import { CartSessionProvider } from "./CartSessionProvider";

const line = { variantId: "v1", slug: "berry-crush", title: "Berry Crush", unitPrice: 63, currency: "AED", quantity: 2 };

function startAsGuestWithStoredCart() {
  storeCartId("cart-of-an-account");
  useCartStore.setState({ lines: [line], cartId: "cart-of-an-account" });
  useUiStore.setState({ catalogContext: { zoneCode: "AE" } as never });
  useAuthStore.setState({ bootstrapped: true, user: null });
  render(
    <CartSessionProvider>
      <span />
    </CartSessionProvider>,
  );
}

describe("CartSessionProvider (guest restore)", () => {
  beforeEach(() => {
    api.getActiveCart.mockReset();
    api.createOrResolveCart.mockReset();
    clearTokens();
  });

  it("starts a fresh guest bag when the stored cart belongs to an account (403)", async () => {
    api.getActiveCart.mockRejectedValue(new ApiClientError(403, "Access denied for cart"));
    startAsGuestWithStoredCart();
    await waitFor(() => expect(getStoredCartId()).toBeNull());
    expect(useCartStore.getState().cartId).toBeNull();
    expect(useCartStore.getState().lines).toEqual([]);
  });

  it("forgets a cart that no longer exists (404)", async () => {
    api.getActiveCart.mockRejectedValue(new ApiClientError(404, "Cart not found"));
    startAsGuestWithStoredCart();
    await waitFor(() => expect(getStoredCartId()).toBeNull());
  });

  it("keeps the cart when the server is briefly down", async () => {
    api.getActiveCart.mockRejectedValue(new ApiClientError(503, "Unavailable"));
    startAsGuestWithStoredCart();
    await waitFor(() => expect(api.getActiveCart).toHaveBeenCalled());
    expect(getStoredCartId()).toBe("cart-of-an-account");
    expect(useCartStore.getState().lines).toHaveLength(1);
  });

  it("leaves the bag alone while a stored sign-in could not be confirmed (server blip)", async () => {
    setTokens("access", "refresh");
    startAsGuestWithStoredCart();
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(api.getActiveCart).not.toHaveBeenCalled();
    expect(getStoredCartId()).toBe("cart-of-an-account");
    expect(useCartStore.getState().lines).toHaveLength(1);
  });
});
