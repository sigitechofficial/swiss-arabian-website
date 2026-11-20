"use client";

import { useEffect, useState } from "react";
import { precheckTamara } from "../api/checkout.service";
import { canPrecheckTamara, tamaraPrecheckMessage, type TamaraMessage } from "../utils/tamara";

export type TamaraPrecheck =
  /** No Tamara method, or not enough contact details to ask yet. */
  | { state: "idle" }
  | { state: "checking" }
  | { state: "available" }
  | { state: "rejected"; message: TamaraMessage };

type Settled = { key: string; result: TamaraPrecheck };

const DEBOUNCE_MS = 600;

/**
 * Tamara background pre-check: asks whether this shopper can pay with Tamara
 * for this total. Runs when checkout opens and again whenever the email, phone
 * or total changes. A failed request never blocks Tamara — only an explicit
 * rejection does.
 */
export function useTamaraPrecheck(input: {
  checkoutSessionId: string | null | undefined;
  /** A Tamara method is offered in this market. */
  enabled: boolean;
  email: string;
  phone: string;
  /** Amount due; part of the key so a changed bag is checked again. */
  total: number | null | undefined;
}): TamaraPrecheck {
  const { checkoutSessionId, enabled, total } = input;
  const email = input.email.trim();
  const phone = input.phone.trim();
  const ready = Boolean(
    enabled && checkoutSessionId && total != null && total > 0 && canPrecheckTamara(email, phone),
  );
  const key = ready ? `${checkoutSessionId}|${email.toLowerCase()}|${phone}|${total}` : null;

  const [settled, setSettled] = useState<Settled | null>(null);

  useEffect(() => {
    if (!key || !checkoutSessionId) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void precheckTamara(checkoutSessionId, { email, phone })
        .then((res) => {
          if (cancelled) return;
          setSettled({
            key,
            result:
              res?.available === false
                ? { state: "rejected", message: tamaraPrecheckMessage(res) }
                : { state: "available" },
          });
        })
        .catch(() => {
          // Fail safe: an unreachable pre-check must not hide a payment method.
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
