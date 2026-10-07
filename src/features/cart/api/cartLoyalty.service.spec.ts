import { beforeEach, describe, expect, it, vi } from "vitest";
import { applyCartLoyaltyRedemption, removeCartLoyaltyRedemption } from "./cart.service";

const apiPut = vi.hoisted(() => vi.fn());
const apiDelete = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api/apiClient", () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPatch: vi.fn(),
  apiPut: (...args: unknown[]) => apiPut(...args),
  apiDelete: (...args: unknown[]) => apiDelete(...args),
}));

vi.mock("@/lib/auth/token", () => ({
  getAccessToken: () => "token",
}));

vi.mock("@/lib/storefront/context", () => ({
  storefrontContextQuery: () => "zoneCode=UAE&currencyCode=AED",
}));

beforeEach(() => {
  apiPut.mockReset();
  apiDelete.mockReset();
  apiPut.mockResolvedValue({ cartId: "cart-1" });
  apiDelete.mockResolvedValue({ cartId: "cart-1" });
});

describe("cart loyalty redemption requests", () => {
  it("PUTs points only", async () => {
    await applyCartLoyaltyRedemption("cart-1", 400);
    expect(apiPut).toHaveBeenCalledTimes(1);
    const [path, body] = apiPut.mock.calls[0] ?? [];
    expect(String(path)).toContain("/storefront/cart/cart-1/loyalty-redemption");
    expect(body).toEqual({ points: 400 });
    expect(body).not.toHaveProperty("amount");
    expect(body).not.toHaveProperty("appliedAmount");
    expect(body).not.toHaveProperty("discount");
    expect(body).not.toHaveProperty("amountPayable");
    expect(body).not.toHaveProperty("money");
  });

  it("DELETEs the cart reservation", async () => {
    await removeCartLoyaltyRedemption("cart-1");
    const [path] = apiDelete.mock.calls[0] ?? [];
    expect(String(path)).toContain("/storefront/cart/cart-1/loyalty-redemption");
  });
});
