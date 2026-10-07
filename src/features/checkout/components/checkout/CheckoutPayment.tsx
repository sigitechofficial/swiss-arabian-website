"use client";

import {
  cbox,
  cboxHead,
  checkoutCta,
  checkoutError,
  checkoutLegal,
  checkoutLink,
  payMockNote,
  payOpt,
  payOptActive,
  payOptBadge,
  payOptDisabled,
  payOptNote,
  payOptTitle,
  payOptions,
} from "@/styles/checkoutChrome";
import type { CheckoutStatus } from "../../hooks/useCheckout";
import type { PaymentMethodOption } from "../../types/checkout";
import { paymentMethodNote } from "../../utils/methodLabels";

type CheckoutPaymentProps = {
  methods: PaymentMethodOption[];
  selectedId: string | null;
  status: CheckoutStatus;
  submitting: boolean;
  errorMsg: string | null;
  onRetry: () => void;
  onSelect: (id: string) => void;
  canSubmit: boolean;
  ctaLabel: string;
  amountPayable?: number | null;
};

export function CheckoutPayment({
  methods,
  selectedId,
  status,
  submitting,
  errorMsg,
  onRetry,
  onSelect,
  canSubmit,
  ctaLabel,
  amountPayable,
}: CheckoutPaymentProps) {
  const covered = amountPayable === 0;
  return (
    <>
      <section className={cbox}>
        <header className={cboxHead}>
          <h2>Payment method</h2>
        </header>
        {covered ? (
          <p className={payMockNote}>No payment needed — your rewards cover this order.</p>
        ) : (
          <>
            <div className={payOptions} role="radiogroup" aria-label="Payment methods">
              {methods.map((method) => {
                const active = method.zonePaymentMethodId === selectedId;
                const note = paymentMethodNote(method);
                return (
                  <label key={method.zonePaymentMethodId} className={`${payOpt} ${active ? payOptActive : ""}`}>
                    <input
                      type="radio"
                      name="payMethod"
                      value={method.zonePaymentMethodId}
                      checked={active}
                      disabled={submitting}
                      onChange={() => onSelect(method.zonePaymentMethodId)}
                    />
                    <span>
                      <span className={payOptTitle}>{method.displayName}</span>
                      {note ? <span className={payOptNote}>{note}</span> : null}
                    </span>
                  </label>
                );
              })}
              <label className={`${payOpt} ${payOptDisabled}`}>
                <input type="radio" name="payMethod" value="tabby" disabled />
                <span>
                  <span className={payOptTitle}>Tabby</span>
                  <span className={payOptNote}>Pay in 4 · interest-free</span>
                </span>
                <span className={payOptBadge}>Coming soon</span>
              </label>
              <label className={`${payOpt} ${payOptDisabled}`}>
                <input type="radio" name="payMethod" value="tamara" disabled />
                <span>
                  <span className={payOptTitle}>Tamara</span>
                  <span className={payOptNote}>Split payments</span>
                </span>
                <span className={payOptBadge}>Coming soon</span>
              </label>
            </div>
            {!methods.length ? (
              <p className={payMockNote}>
                {status === "loading" ? "Loading payment options…" : "No payment options are available right now."}
              </p>
            ) : (
              <p className={payMockNote}>
                Card details are never entered on this page — they go straight to our payment partner.
              </p>
            )}
          </>
        )}
      </section>

      {errorMsg ? (
        <p className={checkoutError} role="alert">
          {errorMsg}
          {status === "error" ? (
            <>
              {" "}
              <button type="button" className={checkoutLink} onClick={onRetry}>
                Try again
              </button>
            </>
          ) : null}
        </p>
      ) : null}

      <button type="submit" className={checkoutCta} id="place-order" disabled={!canSubmit}>
        <span>{ctaLabel}</span>
        <b aria-hidden="true">↗</b>
      </button>
      <p className={checkoutLegal}>
        By placing this order you agree to our <a href="#">Terms</a> and <a href="#">Privacy Policy</a>. Payment is
        encrypted.
      </p>
    </>
  );
}
