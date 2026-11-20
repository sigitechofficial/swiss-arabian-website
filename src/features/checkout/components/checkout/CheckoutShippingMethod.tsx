"use client";

import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { cbox, cboxHead, payMockNote, payOpt, payOptActive, payOptNote, payOptTitle, payOptions } from "@/styles/checkoutChrome";
import type { CheckoutStatus } from "../../hooks/useCheckout";
import type { DeliveryMethodOption } from "../../types/checkout";
import { deliveryEta, deliveryFeeLabel, deliveryOptionTitles } from "../../utils/methodLabels";

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
  const t = useShopCopy();
  const titles = deliveryOptionTitles(methods);
  return (
    <section className={cbox}>
      <header className={cboxHead}>
        <h2>{t("checkout.shipping.title")}</h2>
      </header>
      {methods.length ? (
        <div className={payOptions} role="radiogroup" aria-label={t("checkout.shipping.methods")}>
          {methods.map((method) => {
            const title = titles.get(method.zoneDeliveryMethodId) ?? method.displayName;
            const active = method.zoneDeliveryMethodId === selectedId;
            const eta = deliveryEta(method, t);
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
                    {[eta, deliveryFeeLabel(method, currency, t)].filter(Boolean).join(" · ")}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      ) : (
        <p className={payMockNote}>
          {status === "loading" ? t("checkout.shipping.loading") : t("checkout.shipping.none")}
        </p>
      )}
    </section>
  );
}
