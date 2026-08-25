"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/stores/useCartStore";
import { clearCartId } from "@/features/cart/utils/guestToken";
import { ApiClientError } from "@/lib/api/apiError";
import {
  createCheckoutFromCart,
  getCheckoutSession,
  listDeliveryMethods,
  listPaymentMethods,
  selectDeliveryMethod,
  selectPaymentMethod,
  setCheckoutAddress,
  validateCheckout,
} from "../api/checkout.service";
import { placeOrder, initiatePayment } from "../api/orders.service";
import {
  getStoredCheckoutSessionId,
  storeCheckoutSessionId,
  clearCheckoutSessionId,
  storeOrderId,
  storeOrderNumber,
  storeGuestOrderAccessToken,
  storePaymentTransactionId,
  getPayAttempt,
} from "../utils/checkoutSession";
import type {
  CheckoutSessionResponse,
  DeliveryMethodOption,
  PaymentMethodOption,
} from "../types/checkout";
import type { CheckoutFormValues } from "../schemas/checkout.schema";

// ─── Country → ISO code ───────────────────────────────────────────────────────

const COUNTRY_CODE_MAP: Record<string, string> = {
  "United Arab Emirates": "AE",
  "Saudi Arabia": "SA",
  Qatar: "QA",
  Kuwait: "KW",
  Bahrain: "BH",
  Oman: "OM",
};

function toCountryCode(display: string): string {
  return COUNTRY_CODE_MAP[display] ?? "AE";
}

// ─── Hook types ───────────────────────────────────────────────────────────────

export type CheckoutStatus = "loading" | "ready" | "submitting" | "error";

export interface UseCheckoutReturn {
  session: CheckoutSessionResponse | null;
  deliveryMethods: DeliveryMethodOption[];
  paymentMethods: PaymentMethodOption[];
  selectedDeliveryId: string | null;
  selectedPaymentId: string | null;
  status: CheckoutStatus;
  errorMsg: string | null;
  chooseDelivery: (zoneDeliveryMethodId: string) => Promise<void>;
  choosePayment: (zonePaymentMethodId: string) => Promise<void>;
  submitCheckout: (data: CheckoutFormValues) => Promise<void>;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useCheckout(): UseCheckoutReturn {
  const cartId = useCartStore((s) => s.cartId);
  const clearCart = useCartStore((s) => s.clear);
  const router = useRouter();

  const [session, setSession] = useState<CheckoutSessionResponse | null>(null);
  const [deliveryMethods, setDeliveryMethods] = useState<DeliveryMethodOption[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodOption[]>([]);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string | null>(null);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [status, setStatus] = useState<CheckoutStatus>("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Prevent double-init from React StrictMode / concurrent renders
  const initRef = useRef(false);
  const methodsSessionRef = useRef<string | null>(null);

  // ── C.0 + C.1: Create / resume checkout session ──────────────────────────

  useEffect(() => {
    if (initRef.current) return;
    if (!cartId) return;
    initRef.current = true;

    async function initSession() {
      const storedId = getStoredCheckoutSessionId();
      let sess: CheckoutSessionResponse;

      try {
        if (storedId) {
          try {
            sess = await getCheckoutSession(storedId);
            if (sess.status !== "ACTIVE") {
              clearCheckoutSessionId();
              sess = await createCheckoutFromCart({ cartId: cartId! });
            }
          } catch {
            clearCheckoutSessionId();
            sess = await createCheckoutFromCart({ cartId: cartId! });
          }
        } else {
          sess = await createCheckoutFromCart({ cartId: cartId! });
        }
        storeCheckoutSessionId(sess.checkoutSessionId);
        setSession(sess);
      } catch (e) {
        const msg =
          e instanceof ApiClientError
            ? e.message
            : "Could not start checkout. Please try again.";
        setErrorMsg(msg);
        setStatus("error");
      }
    }

    initSession();
  }, [cartId]);

  // ── C.2 + C.3: Load delivery + payment methods, auto-select defaults ─────

  useEffect(() => {
    if (!session) return;
    const id = session.checkoutSessionId;
    if (methodsSessionRef.current === id) return;
    methodsSessionRef.current = id;

    async function loadMethods() {
      try {
        const [delivery, payment] = await Promise.all([
          listDeliveryMethods(id),
          listPaymentMethods(id),
        ]);
        setDeliveryMethods(delivery);
        setPaymentMethods(payment);

        // Auto-select default delivery
        const defDelivery = delivery.find((d) => d.isDefault) ?? delivery[0];
        if (defDelivery) {
          setSelectedDeliveryId(defDelivery.zoneDeliveryMethodId);
          try {
            const updated = await selectDeliveryMethod(id, defDelivery.deliveryMethodId);
            setSession(updated);
          } catch {
            // Non-critical — user can still pick manually
          }
        }

        // Auto-select default payment
        const defPayment = payment.find((p) => p.isDefault) ?? payment[0];
        if (defPayment) {
          setSelectedPaymentId(defPayment.zonePaymentMethodId);
          try {
            const updated = await selectPaymentMethod(id, defPayment.paymentMethodId);
            setSession(updated);
          } catch {
            // Non-critical
          }
        }
      } catch {
        // Methods failed to load — form is still usable with empty lists
      } finally {
        setStatus("ready");
      }
    }

    loadMethods();
  }, [session?.checkoutSessionId]);

  // ── Interactive delivery selection ──────────────────────────────────────

  const chooseDelivery = useCallback(
    async (zoneDeliveryMethodId: string) => {
      const method = deliveryMethods.find(
        (d) => d.zoneDeliveryMethodId === zoneDeliveryMethodId,
      );
      if (!method || !session) return;
      setSelectedDeliveryId(zoneDeliveryMethodId);
      try {
        const updated = await selectDeliveryMethod(
          session.checkoutSessionId,
          method.deliveryMethodId,
        );
        setSession(updated);
      } catch {
        // Revert on error
        setSelectedDeliveryId(
          session.selectedDeliveryMethod?.zoneDeliveryMethodId ?? null,
        );
      }
    },
    [deliveryMethods, session],
  );

  // ── Interactive payment selection ────────────────────────────────────────

  const choosePayment = useCallback(
    async (zonePaymentMethodId: string) => {
      const method = paymentMethods.find(
        (p) => p.zonePaymentMethodId === zonePaymentMethodId,
      );
      if (!method || !session) return;
      setSelectedPaymentId(zonePaymentMethodId);
      try {
        const updated = await selectPaymentMethod(
          session.checkoutSessionId,
          method.paymentMethodId,
        );
        setSession(updated);
      } catch {
        setSelectedPaymentId(
          session.selectedPaymentMethod?.zonePaymentMethodId ?? null,
        );
      }
    },
    [paymentMethods, session],
  );

  // ── C.4 – C.7: Full submit flow ──────────────────────────────────────────

  const submitCheckout = useCallback(
    async (data: CheckoutFormValues) => {
      if (!session) return;
      setStatus("submitting");
      setErrorMsg(null);

      const sessionId = session.checkoutSessionId;

      try {
        // C.4 — Set address snapshot
        const addressSnapshot = {
          fullName: `${data.firstName} ${data.lastName}`.trim(),
          address1: data.address,
          address2: data.apartment || undefined,
          city: data.city,
          countryCode: toCountryCode(data.country),
          postalCode: "00000",
          phone: data.phone,
        };
        const afterAddress = await setCheckoutAddress(sessionId, {
          addressSnapshot,
        });
        setSession(afterAddress);

        // C.5 — Validate
        // NOTE: HTTP 200 from validate does NOT mean isValid=true — always check the body.
        // Backend skips delivery/payment checks inside validate if they are not yet set,
        // but assertCheckoutReadyForPlacement (inside from-checkout) is stricter.
        const afterValidate = await validateCheckout(sessionId);
        setSession(afterValidate);

        // Map backend issueType → user-friendly message
        const ISSUE_MESSAGES: Record<string, string> = {
          PRICE_MISSING: "One or more items in your cart have no price. Please contact support.",
          PRODUCT_NOT_SELLABLE: "One or more items are no longer available for purchase.",
          PRODUCT_NOT_VISIBLE: "One or more items are no longer visible in this region.",
          INSUFFICIENT_INVENTORY: "One or more items are out of stock.",
          INVENTORY_MISSING: "One or more items have no available stock.",
          VARIANT_INACTIVE: "One or more items are inactive. Please remove them from your cart.",
          CURRENCY_MISMATCH: "Currency mismatch detected. Please refresh and try again.",
          ADDRESS_INVALID: "Your shipping address is incomplete or invalid.",
          PAYMENT_METHOD_UNAVAILABLE: "The selected payment method is not available.",
          DELIVERY_METHOD_UNAVAILABLE: "The selected delivery method is not available.",
          MANUAL_REVIEW_REQUIRED: "Your order requires manual review. Please contact support.",
        };

        const allIssues = afterValidate.validationIssues ?? [];
        const blockingIssue = allIssues.find(
          (i) => i.severity === "ERROR" || i.severity === "WARNING",
        );

        if (afterValidate.validation?.isValid !== true) {
          const msg =
            (blockingIssue?.issueType && ISSUE_MESSAGES[blockingIssue.issueType]) ??
            blockingIssue?.message ??
            "Some items in your cart are unavailable. Please review your cart and try again.";
          setErrorMsg(msg);
          setStatus("ready");
          return;
        }

        // C.6 — Place order
        const idempotencyKey = `order-${cartId ?? sessionId}`;
        const order = await placeOrder({ checkoutSessionId: sessionId, idempotencyKey });

        // Persist order info immediately
        storeOrderId(order.orderId);
        if (order.orderNumber) storeOrderNumber(order.orderNumber);

        // Save guest tracking token (one-time, never overwrite)
        if (
          order.guestTracking &&
          !order.guestTracking.previouslyIssued &&
          order.guestTracking.orderAccessToken
        ) {
          storeGuestOrderAccessToken(order.guestTracking.orderAccessToken);
        }

        // Clear cart after successful order
        clearCart();
        clearCartId();
        clearCheckoutSessionId();

        // C.7 — Initiate payment
        // Payment method is already selected on the checkout session — backend reads it from there.
        // Do NOT send zonePaymentMethodId (forbidNonWhitelisted — causes 400).
        const attempt = getPayAttempt();
        const payAttemptKey = `pay-${order.orderId}-${attempt}`;

        const returnUrl = `${window.location.origin}/checkout/payment/success`;
        const cancelUrl = `${window.location.origin}/checkout/payment/cancel`;

        const payment = await initiatePayment(order.orderId, {
          idempotencyKey: payAttemptKey,
          returnUrl,
          cancelUrl,
        });

        if (payment.paymentAction === "REDIRECT" && payment.redirectUrl) {
          // Store transaction ID for debugging
          if (payment.paymentTransactionId) {
            storePaymentTransactionId(payment.paymentTransactionId);
          }
          // Hard redirect to payment gateway — never use router.push here
          window.location.href = payment.redirectUrl;
          return;
        }

        // COD or no action — go straight to confirmation
        if (payment.paymentExecutionStatus === "PENDING_PROVIDER_EXECUTION") {
          console.warn("Payment provider not configured:", payment.warnings);
        }

        router.push(`/order-confirmation/${order.orderId}`);
      } catch (e) {
        const msg =
          e instanceof ApiClientError
            ? e.message
            : "Something went wrong. Please try again.";
        setErrorMsg(msg);
        setStatus("ready");
      }
    },
    [session, cartId, clearCart, router],
  );

  return {
    session,
    deliveryMethods,
    paymentMethods,
    selectedDeliveryId,
    selectedPaymentId,
    status,
    errorMsg,
    chooseDelivery,
    choosePayment,
    submitCheckout,
  };
}
