"use client";

import { cbox, cboxHead, payMockNote, payOpt, payOptActive, payOptNote, payOptTitle, payOptions } from "@/styles/checkoutChrome";
import type { CheckoutStatus } from "../../hooks/useCheckout";
import type { DeliveryMethodOption } from "../../types/checkout";
import { deliveryEta, deliveryFeeLabel } from "../../utils/methodLabels";

type CheckoutShippingMethodProps = {
  methods: DeliveryMethodOption[];
  selectedId: string | null;
  status: CheckoutStatus;
  submitting: boolean;
  currency: string;
  onSelect: (id: string) => void;
};

/** "iq_fulfillment" -> "Iq Fulfillment"; used only to tell same-named options apart. */
function partnerLabel(code: string | null | undefined): string {
  return String(code ?? "")
    .replace(/_/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

/**
 * Several partners can expose an option with the same name (URD1 had three
 * "Standard delivery" rows). When names collide, add the partner so the
 * shopper can tell which one they pick.
 */
function optionTitles(methods: DeliveryMethodOption[]): Map<string, string> {
  const counts = new Map<string, number>();
  for (const method of methods) {
    counts.set(method.displayName, (counts.get(method.displayName) ?? 0) + 1);
  }
  return new Map(
    methods.map((method) => {
      const partner = partnerLabel(method.partnerCode);
      const title =
        (counts.get(method.displayName) ?? 0) > 1 && partner
          ? `${method.displayName} · ${partner}`
          : method.displayName;
      return [method.zoneDeliveryMethodId, title];
    }),
  );
}

export function CheckoutShippingMethod({
  methods,
  selectedId,
  status,
  submitting,
  currency,
  onSelect,
}: CheckoutShippingMethodProps) {
  const titles = optionTitles(methods);
  return (
    <section className={cbox}>
      <header className={cboxHead}>
        <h2>Shipping method</h2>
      </header>
      {methods.length ? (
        <div className={payOptions} role="radiogroup" aria-label="Shipping methods">
          {methods.map((method) => {
            const title = titles.get(method.zoneDeliveryMethodId) ?? method.displayName;
            const active = method.zoneDeliveryMethodId === selectedId;
            const eta = deliveryEta(method);
            return (
              <label key={method.zoneDeliveryMethodId} className={`${payOpt} ${active ? payOptActive : ""}`}>
                <input
                  type="radio"
                  name="deliveryMethod"
                  value={method.zoneDeliveryMethodId}
                  checked={active}
                  disabled={submitting}
                  onChange={() => onSelect(method.zoneDeliveryMethodId)}
                  // Name the option by what the shopper sees, never by the method id in `value`.
                  aria-label={title}
                  aria-describedby={`ship-opt-note-${method.zoneDeliveryMethodId}`}
                />
                <span>
                  <span className={payOptTitle}>{title}</span>
                  <span id={`ship-opt-note-${method.zoneDeliveryMethodId}`} className={payOptNote}>
                    {[eta, deliveryFeeLabel(method, currency)].filter(Boolean).join(" · ")}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      ) : (
        <p className={payMockNote}>
          {status === "loading" ? "Loading shipping options…" : "No shipping options are available right now."}
        </p>
      )}
    </section>
  );
}
