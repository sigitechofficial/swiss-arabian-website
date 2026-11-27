import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCartStore, type CartLine } from "@/stores/useCartStore";
import type { CheckoutQuestion, CheckoutSessionResponse } from "../types/checkout";
import { useCheckout } from "./useCheckout";

/**
 * Checkout questions on submit: the answers are saved right after the address
 * and before validation, and only when the market asks questions (a market
 * without questions makes exactly the calls it always made).
 */

const api = vi.hoisted(() => ({
  calls: [] as string[],
  session: null as unknown,
  validated: null as unknown,
  setCheckoutAnswers: vi.fn(),
  placeOrder: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/providers/MarketProvider", () => ({
  useOptionalMarket: () => ({ catalogContext: { zoneCode: "UAE" } }),
}));
vi.mock("@/features/cart/api/cart.service", () => ({
  getActiveCart: vi.fn().mockRejectedValue(new Error("not needed")),
}));
vi.mock("../api/orders.service", () => ({ placeOrder: api.placeOrder }));
vi.mock("../api/checkout.service", () => {
  const record = (name: string) => async () => {
    api.calls.push(name);
    return api.session;
  };
  return {
    cancelCheckout: vi.fn(),
    createCheckoutFromCart: vi.fn(async () => api.session),
    getCheckoutSession: vi.fn().mockRejectedValue(new Error("none")),
    listDeliveryMethods: vi.fn(async () => [
      {
        zoneDeliveryMethodId: "zdm-1",
        deliveryMethodId: "dm-1",
        partnerCode: "iq",
        methodCode: "standard",
        displayName: "Standard",
        isDefault: true,
        estimatedFee: "0",
      },
    ]),
    listPaymentMethods: vi.fn(async () => []),
    openInlineForm: vi.fn(),
    selectDeliveryMethod: vi.fn(async () => api.session),
    selectPaymentMethod: vi.fn(async () => api.session),
    setCheckoutAddress: record("address"),
    setCheckoutAnswers: (...args: unknown[]) => {
      api.calls.push("answers");
      api.setCheckoutAnswers(...args);
      return Promise.resolve(api.session);
    },
    validateCheckout: async () => {
      api.calls.push("validate");
      return api.validated;
    },
  };
});

const nationality: CheckoutQuestion = {
  key: "nationality",
  type: "SELECT",
  label: "Nationality",
  help: null,
  required: true,
  options: [{ value: "AE", label: "Emirati" }],
};
const gift: CheckoutQuestion = { key: "gift", type: "CHECKBOX", label: "Gift", help: null, required: false };

const line: CartLine = {
  cartItemId: "line-1",
  variantId: "v-1",
  slug: "oud",
  title: "Oud",
  unitPrice: 100,
  currency: "AED",
  quantity: 1,
};

function sessionWith(questions: CheckoutQuestion[] | undefined): CheckoutSessionResponse {
  return {
    checkoutSessionId: "sess-1",
    status: "VALID",
    context: {
      zoneId: null,
      zoneCode: "UAE",
      legalEntityCode: "SA",
      salesChannelId: null,
      salesChannelCode: null,
      countryCode: "AE",
      currencyCode: "AED",
      languageCode: "en",
    },
    cartId: "cart-1",
    items: [{ cartItemId: "line-1", sku: "SKU", productId: null, variantId: null, quantity: "1", unitPriceEstimate: "100", lineSubtotalEstimate: "100" }],
    priceSnapshots: [],
    inventorySnapshots: [],
    selectedPaymentMethod: null,
    selectedDeliveryMethod: null,
    validationIssues: [],
    // Fully covered (gift card): no payment method is needed to submit.
    totalsEstimate: { subtotal: "100.00", discount: "0.00", shipping: "0.00", tax: "0.00", total: "100.00", amountPayable: "0" },
    currency: "AED",
    expiresAt: null,
    validation: { isValid: false, status: "DRAFT" },
    ...(questions ? { questions, answers: {} } : {}),
  };
}

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

const values = {
  email: "shopper@example.com",
  shipping: {
    fullName: "Test Shopper",
    phone: "+971501234567",
    address1: "Street 1",
    address2: "",
    city: "Dubai",
    emirate: "Dubai",
    postalCode: "",
  },
  billingSameAsShipping: true,
};

async function submitWith(session: CheckoutSessionResponse, answers?: Record<string, string>) {
  api.session = session;
  api.validated = {
    ...session,
    validation: { isValid: false, status: "INVALID" },
    validationIssues: [
      {
        issueType: "CHECKOUT_QUESTION",
        severity: "ERROR",
        code: "CHECKOUT_ANSWER_REQUIRED",
        message: "raw",
        sku: null,
        fieldPath: "answers.nationality",
      },
    ],
  };
  const { result } = renderHook(() => useCheckout(), { wrapper });
  await waitFor(() => expect(result.current.status).toBe("ready"));
  await waitFor(() => expect(result.current.selectedDeliveryId).toBe("zdm-1"));
  api.calls.length = 0;
  await act(async () => {
    await result.current.submitCheckout({ ...values, answers });
  });
  return result;
}

beforeEach(() => {
  localStorage.clear();
  api.calls.length = 0;
  api.setCheckoutAnswers.mockReset();
  api.placeOrder.mockReset();
  useCartStore.setState({ cartId: "cart-1", lines: [line], totals: null, promotions: null, syncing: false });
});

describe("submitting checkout answers", () => {
  it("saves the answers between the address and validation, for this session's questions only", async () => {
    const result = await submitWith(sessionWith([nationality, gift]), { nationality: " AE ", retired: "x" });

    expect(api.calls).toEqual(["address", "answers", "validate"]);
    expect(api.setCheckoutAnswers).toHaveBeenCalledWith("sess-1", { nationality: "AE", gift: "false" });
    // A missing answer blocks placement with the shop's own sentence.
    expect(api.placeOrder).not.toHaveBeenCalled();
    expect(result.current.errorMsg).toBe("Please answer all required questions.");
  });

  it("makes no answers call when the market asks nothing", async () => {
    await submitWith(sessionWith([]), { nationality: "AE" });
    expect(api.calls).toEqual(["address", "validate"]);
    expect(api.setCheckoutAnswers).not.toHaveBeenCalled();
  });

  it("makes no answers call against a backend that does not send questions", async () => {
    await submitWith(sessionWith(undefined));
    expect(api.calls).toEqual(["address", "validate"]);
    expect(api.setCheckoutAnswers).not.toHaveBeenCalled();
  });
});
