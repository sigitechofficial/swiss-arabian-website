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

export function CheckoutShippingMethod({
  methods,
  selectedId,
  status,
  submitting,
  currency,
  onSelect,
}: CheckoutShippingMethodProps) {
  return (
    <section className={cbox}>
      <header className={cboxHead}>
        <h2>Shipping method</h2>
      </header>
      {methods.length ? (
        <div className={payOptions} role="radiogroup" aria-label="Shipping methods">
          {methods.map((method) => {
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
                />
                <span>
                  <span className={payOptTitle}>{method.displayName}</span>
                  <span className={payOptNote}>{[eta, deliveryFeeLabel(method, currency)].filter(Boolean).join(" · ")}</span>
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
