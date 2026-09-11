"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { clearCartId } from "@/features/cart/utils/guestToken";
import { useCartStore, type CartLine } from "@/stores/useCartStore";
import {
  cancelCheckout,
  createCheckoutFromCart,
  getCheckoutSession,
  listDeliveryMethods,
  listPaymentMethods,
  selectDeliveryMethod,
  selectPaymentMethod,
  setCheckoutAddress,
  validateCheckout,
  type SetAddressDto,
} from "../api/checkout.service";
import { placeOrder } from "../api/orders.service";
import type {
  CheckoutSessionResponse,
  DeliveryMethodOption,
  PaymentMethodOption,
} from "../types/checkout";
import { buildAddressSnapshot, type AddressFields } from "../utils/addressSnapshot";
import { checkoutErrorMessage, checkoutIssueMessage } from "../utils/checkoutIssues";
import {
  clearCheckoutSessionId,
  getStoredCheckoutSessionId,
  resetPayAttempt,
  storeCheckoutSessionId,
  storeGuestOrderAccessToken,
  storeOrderId,
  storeOrderNumber,
  storePaymentMethodId,
  storeZonePaymentMethodId,
} from "../utils/checkoutSession";
import { pickDefaultPaymentMethod } from "../utils/methodLabels";
import { startPayment } from "../utils/startPayment";

/**
 * Statuses a session can't come back from. The live backend reports usable
 * sessions as `VALID`, not the `ACTIVE` the guide documents — so match terminal
 * states instead of requiring a live one (requiring `ACTIVE`, as the reference
 * does, throws the session away and rebuilds it on every page load).
 */
const TERMINAL_SESSION_STATUSES = new Set(["COMPLETED", "CANCELLED", "EXPIRED"]);

export type CheckoutStatus = "idle" | "loading" | "ready" | "submitting" | "error";

export type CheckoutSubmitValues = {
  email: string;
  shipping: AddressFields;
  billingSameAsShipping: boolean;
  billing?: AddressFields;
};

/** `cartItemId:qty` for every API-backed line — changes whenever the bag does. */
function cartSignature(lines: CartLine[]): string {
  return lines
    .filter((l) => l.cartItemId)
    .map((l) => `${l.cartItemId}:${l.quantity}`)
    .sort()
    .join("|");
}

/** Whether a session was built from exactly this bag; `null` when it can't be told. */
function sessionMatchesCart(
  session: CheckoutSessionResponse,
  lines: CartLine[],
): boolean | null {
  const items = session.items ?? [];
  if (items.some((i) => !i.cartItemId)) return null;
  const sessionSig = items
    .map((i) => `${i.cartItemId}:${Number.parseInt(i.quantity ?? "0", 10) || 0}`)
    .sort()
    .join("|");
  return sessionSig === cartSignature(lines);
}

/**
 * `from-cart` resumes any active session for the cart without re-reading it,
 * so a changed bag needs the old session cancelled before a new one is made.
 */
async function rebuildSession(
  cartId: string,
  stale: CheckoutSessionResponse | null,
): Promise<CheckoutSessionResponse> {
  if (stale) {
    try {
      await cancelCheckout(stale.checkoutSessionId, "Bag changed during checkout");
    } catch {
      // Already expired/cancelled — nothing to release.
    }
  }
  clearCheckoutSessionId();
  return createCheckoutFromCart({ cartId });
}

async function resolveSession(
  cartId: string,
  lines: CartLine[],
): Promise<CheckoutSessionResponse> {
  const storedId = getStoredCheckoutSessionId();
  if (storedId) {
    try {
      const existing = await getCheckoutSession(storedId);
      const live =
        existing.cartId === cartId && !TERMINAL_SESSION_STATUSES.has(existing.status);
      if (live && sessionMatchesCart(existing, lines) !== false) return existing;
      if (live) return rebuildSession(cartId, existing);
    } catch {
      // Stale id — fall through and start fresh.
    }
    clearCheckoutSessionId();
  }

  const created = await createCheckoutFromCart({ cartId });
  // A session resumed from another tab may predate a bag change made since.
  return sessionMatchesCart(created, lines) === false
    ? rebuildSession(cartId, created)
    : created;
}

export function useCheckout() {
  const cartId = useCartStore((s) => s.cartId);
  const lines = useCartStore((s) => s.lines);
  const clearCart = useCartStore((s) => s.clear);
  const setCartId = useCartStore((s) => s.setCartId);
  const router = useRouter();
  const queryClient = useQueryClient();

  const [session, setSession] = useState<CheckoutSessionResponse | null>(null);
  const [deliveryMethods, setDeliveryMethods] = useState<DeliveryMethodOption[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodOption[]>([]);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string | null>(null);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [status, setStatus] = useState<CheckoutStatus>("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const initCartRef = useRef<string | null>(null);
  const methodsSessionRef = useRef<string | null>(null);
  /** The bag signature the current session was built from. */
  const sessionSigRef = useRef<string | null>(null);
  /** Shopper's choices, re-applied when a session is rebuilt. */
  const deliveryChoiceRef = useRef<string | null>(null);
  const paymentChoiceRef = useRef<string | null>(null);

  const adopt = useCallback((next: CheckoutSessionResponse) => {
    storeCheckoutSessionId(next.checkoutSessionId);
    setSession(next);
  }, []);

  const start = useCallback(
    async (id: string, currentLines: CartLine[]) => {
      try {
        const next = await resolveSession(id, currentLines);
        sessionSigRef.current = cartSignature(currentLines);
        adopt(next);
      } catch (e) {
        setErrorMsg(checkoutErrorMessage(e, "We couldn’t start checkout. Please try again."));
        setStatus("error");
      }
    },
    [adopt],
  );

  // C.1 — create or resume the session, once per cart.
  useEffect(() => {
    if (!cartId || initCartRef.current === cartId) return;
    initCartRef.current = cartId;
    void start(cartId, lines);
  }, [cartId, lines, start]);

  // Bag changed after the session was built (an add-on, a quantity change in
  // another tab…). Rebuild it so the placed order matches what's on screen.
  useEffect(() => {
    if (!cartId || !session || sessionSigRef.current === null) return;
    const sig = cartSignature(lines);
    if (sig === sessionSigRef.current) return;
    sessionSigRef.current = sig;
    const stale = session;
    void (async () => {
      try {
        const next = await rebuildSession(cartId, stale);
        setStatus("loading");
        adopt(next);
      } catch (e) {
        setErrorMsg(checkoutErrorMessage(e));
      }
    })();
  }, [cartId, lines, session, adopt]);

  // C.2 + C.3 — load both method lists; keep the shopper's choice, else the default.
  const sessionId = session?.checkoutSessionId ?? null;
  useEffect(() => {
    if (!sessionId || methodsSessionRef.current === sessionId) return;
    methodsSessionRef.current = sessionId;

    void (async () => {
      try {
        const [delivery, payment] = await Promise.all([
          listDeliveryMethods(sessionId),
          listPaymentMethods(sessionId),
        ]);
        setDeliveryMethods(delivery);
        setPaymentMethods(payment);

        const deliveryPick =
          delivery.find((d) => d.zoneDeliveryMethodId === deliveryChoiceRef.current) ??
          delivery.find((d) => d.isDefault) ??
          delivery[0];
        if (deliveryPick) {
          deliveryChoiceRef.current = deliveryPick.zoneDeliveryMethodId;
          setSelectedDeliveryId(deliveryPick.zoneDeliveryMethodId);
          try {
            setSession(await selectDeliveryMethod(sessionId, deliveryPick.deliveryMethodId));
          } catch {
            // Re-asserted on submit.
          }
        } else {
          setErrorMsg("No shipping options are available for this order right now.");
        }

        const paymentPick =
          payment.find((p) => p.zonePaymentMethodId === paymentChoiceRef.current) ??
          pickDefaultPaymentMethod(payment);
        if (paymentPick) {
          paymentChoiceRef.current = paymentPick.zonePaymentMethodId;
          setSelectedPaymentId(paymentPick.zonePaymentMethodId);
          storeZonePaymentMethodId(paymentPick.zonePaymentMethodId);
          storePaymentMethodId(paymentPick.paymentMethodId);
          try {
            setSession(await selectPaymentMethod(sessionId, paymentPick.paymentMethodId));
          } catch {
            // Re-asserted on submit.
          }
        }
      } catch (e) {
        setErrorMsg(
          checkoutErrorMessage(e, "We couldn’t load shipping and payment options. Please refresh."),
        );
      } finally {
        setStatus("ready");
      }
    })();
  }, [sessionId]);

  const chooseDelivery = useCallback(
    async (zoneDeliveryMethodId: string) => {
      const method = deliveryMethods.find((d) => d.zoneDeliveryMethodId === zoneDeliveryMethodId);
      if (!method || !sessionId) return;
      const previous = deliveryChoiceRef.current;
      deliveryChoiceRef.current = zoneDeliveryMethodId;
      setSelectedDeliveryId(zoneDeliveryMethodId);
      try {
        setSession(await selectDeliveryMethod(sessionId, method.deliveryMethodId));
      } catch (e) {
        deliveryChoiceRef.current = previous;
        setSelectedDeliveryId(previous);
        setErrorMsg(checkoutErrorMessage(e));
      }
    },
    [deliveryMethods, sessionId],
  );

  const choosePayment = useCallback(
    async (zonePaymentMethodId: string) => {
      const method = paymentMethods.find((p) => p.zonePaymentMethodId === zonePaymentMethodId);
      if (!method || !sessionId) return;
      const previous = paymentChoiceRef.current;
      paymentChoiceRef.current = zonePaymentMethodId;
      setSelectedPaymentId(zonePaymentMethodId);
      storeZonePaymentMethodId(method.zonePaymentMethodId);
      storePaymentMethodId(method.paymentMethodId);
      try {
        setSession(await selectPaymentMethod(sessionId, method.paymentMethodId));
      } catch (e) {
        paymentChoiceRef.current = previous;
        setSelectedPaymentId(previous);
        setErrorMsg(checkoutErrorMessage(e));
      }
    },
    [paymentMethods, sessionId],
  );

  // C.4 → C.7 — address, validate, place, pay.
  const submitCheckout = useCallback(
    async (values: CheckoutSubmitValues) => {
      if (!session) return;
      const id = session.checkoutSessionId;
      const delivery = deliveryMethods.find((d) => d.zoneDeliveryMethodId === selectedDeliveryId);
      const payment = paymentMethods.find((p) => p.zonePaymentMethodId === selectedPaymentId);
      if (!delivery) return setErrorMsg("Choose a shipping method to continue.");
      if (!payment) return setErrorMsg("Choose a payment method to continue.");

      setStatus("submitting");
      setErrorMsg(null);
      let placedOrderId: string | null = null;

      try {
        const countryCode = session.context?.countryCode;
        const addressSnapshot = buildAddressSnapshot(values.shipping, {
          email: values.email,
          countryCode,
        });
        const addressDto: SetAddressDto =
          values.billingSameAsShipping || !values.billing
            ? { addressSnapshot, billingSameAsShipping: true }
            : {
                addressSnapshot,
                billingAddressSnapshot: buildAddressSnapshot(values.billing, {
                  email: values.email,
                  countryCode,
                }),
              };
        await setCheckoutAddress(id, addressDto);

        // Re-assert both choices right before validating: the background
        // selections from the method-loading effect may still be in flight.
        await selectDeliveryMethod(id, delivery.deliveryMethodId);
        await selectPaymentMethod(id, payment.paymentMethodId);
        storeZonePaymentMethodId(payment.zonePaymentMethodId);
        storePaymentMethodId(payment.paymentMethodId);

        const validated = await validateCheckout(id);
        setSession(validated);
        if (validated.validation?.isValid !== true) {
          setErrorMsg(checkoutIssueMessage(validated.validationIssues));
          setStatus("ready");
          return;
        }

        // Keyed by session: a retry can't double-place, but a session rebuilt
        // after a bag change gets its own order.
        const order = await placeOrder({ checkoutSessionId: id, idempotencyKey: `order-${id}` });
        placedOrderId = order.orderId;
        storeOrderId(order.orderId);
        if (order.orderNumber) storeOrderNumber(order.orderNumber);
        const tracking = order.guestTracking;
        if (
          order.created &&
          order.orderNumber &&
          tracking?.orderAccessToken &&
          !tracking.previouslyIssued
        ) {
          storeGuestOrderAccessToken(order.orderNumber, tracking.orderAccessToken);
        }
        resetPayAttempt();
        void queryClient.invalidateQueries({ queryKey: ["customer-orders"] });

        // The order consumed the cart server-side.
        clearCart();
        setCartId(null);
        clearCartId();
        clearCheckoutSessionId();

        await startPayment(order.orderId, (href) => router.push(href), {
          zonePaymentMethodId: payment.zonePaymentMethodId,
          paymentMethodId: payment.paymentMethodId,
        });
      } catch (e) {
        if (placedOrderId) {
          // The order exists and the bag is gone — send the shopper to the retry
          // screen instead of stranding them on an empty checkout.
          router.push("/checkout/payment/cancel");
          return;
        }
        setErrorMsg(checkoutErrorMessage(e));
        setStatus("ready");
      }
    },
    [
      session,
      deliveryMethods,
      paymentMethods,
      selectedDeliveryId,
      selectedPaymentId,
      queryClient,
      clearCart,
      setCartId,
      router,
    ],
  );

  const retry = useCallback(() => {
    if (!cartId) return;
    setErrorMsg(null);
    setStatus("loading");
    methodsSessionRef.current = null;
    void start(cartId, lines);
  }, [cartId, lines, start]);

  return {
    session,
    deliveryMethods,
    paymentMethods,
    selectedDeliveryId,
    selectedPaymentId,
    // No cart means nothing to check out — unless an order was just placed
    // and consumed it, in which case we're mid-redirect to payment.
    status: cartId || status === "submitting" ? status : ("idle" as CheckoutStatus),
    errorMsg,
    chooseDelivery,
    choosePayment,
    submitCheckout,
    retry,
  };
}
