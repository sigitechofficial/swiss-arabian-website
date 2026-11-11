"use client";

import { useEffect, useState } from "react";
import { prescoreTabby } from "../api/checkout.service";
import { canPrescoreTabby, TABBY_REJECTED_MESSAGE, type TabbyMessage } from "../utils/tabby";

export type TabbyPrescore =
  /** No Tabby method, or not enough contact details to ask yet. */
  | { state: "idle" }
  | { state: "checking" }
  | { state: "available" }
  | { state: "rejected"; message: TabbyMessage };

type Settled = { key: string; result: TabbyPrescore };

const DEBOUNCE_MS = 600;

/**
 * Tabby background pre-scoring: asks whether this shopper can pay with Tabby
 * for this total. Runs when checkout opens and again whenever the email, phone
 * or total changes. A failed request never blocks Tabby — only an explicit
 * rejection does.
 */
export function useTabbyPrescore(input: {
  checkoutSessionId: string | null | undefined;
  /** A Tabby method is offered in this market. */
  enabled: boolean;
  email: string;
  phone: string;
  /** Amount due; part of the key so a changed bag is scored again. */
  total: number | null | undefined;
}): TabbyPrescore {
  const { checkoutSessionId, enabled, total } = input;
  const email = input.email.trim();
  const phone = input.phone.trim();
  const ready = Boolean(
    enabled && checkoutSessionId && total != null && total > 0 && canPrescoreTabby(email, phone),
  );
  const key = ready ? `${checkoutSessionId}|${email.toLowerCase()}|${phone}|${total}` : null;

  const [settled, setSettled] = useState<Settled | null>(null);

  useEffect(() => {
    if (!key || !checkoutSessionId) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void prescoreTabby(checkoutSessionId, { email, phone })
        .then((res) => {
          if (cancelled) return;
          setSettled({
            key,
            result:
              res.available === false
                ? { state: "rejected", message: res.message ?? TABBY_REJECTED_MESSAGE }
                : { state: "available" },
          });
        })
        .catch(() => {
          // Fail safe: an unreachable pre-score must not hide a payment method.
          if (!cancelled) setSettled({ key, result: { state: "available" } });
        });
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [key, checkoutSessionId, email, phone]);

  if (!key) return { state: "idle" };
  return settled?.key === key ? settled.result : { state: "checking" };
}
