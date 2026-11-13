"use client";

import { useEffect, useRef, type ReactNode } from "react";
import {
  useLockPageScroll,
  type PaymobThreeDsError,
  type PaymobThreeDsModalProps,
} from "@/features/checkout/components/PaymobThreeDsModal";
import type { StripePayError } from "@/features/checkout/hooks/useStripeCardPayment";
import { useSapilCopy, type SapilTranslator } from "../../i18n/SapilCopy";

/*
 * Pieces shared by Sapil's card payment screens and the checkout's inline
 * payment forms: error wording (codes from the shared hooks), the error note,
 * the lock icon and the 3-D Secure overlay.
 */

/** Stripe error codes in Sapil's words. `inline`: the checkout page, where the shopper can still fix the contact. */
export function sapilStripeErrorText(t: SapilTranslator, error: StripePayError, { inline = false } = {}): string {
  switch (error.code) {
    case "insufficient_funds":
      return t("checkout.cardErrInsufficient");
    case "card_declined":
      return t("checkout.cardErrDeclined");
    case "expired_card":
      return t("checkout.cardErrExpired");
    case "incorrect_cvc":
      return t("checkout.cardErrCvc");
    case "invalid_number":
      return t("checkout.cardErrNumber");
    case "processing_error":
      return t("checkout.cardErrProcessing");
    case "session_has_email":
      return t("checkout.cardErrSessionEmail");
    case "needs_email":
      return t(inline ? "checkout.inlineErrNeedsEmail" : "checkout.cardErrNeedsEmail");
    case "needs_phone":
      return t(inline ? "checkout.inlineErrNeedsPhone" : "checkout.cardErrNeedsPhone");
    case "needs_name":
      return t(inline ? "checkout.inlineErrNeedsName" : "checkout.cardErrNeedsName");
    default:
      // Provider sentences are English: keep the page in its language.
      return t("checkout.cardErrFailed");
  }
}

/** Why the bank's 3-D Secure check did not finish, in Sapil's words. */
export function sapilThreeDsErrorText(t: SapilTranslator, error: PaymobThreeDsError): string {
  if (error === "cancelled") return t("checkout.threeDsCancelled");
  if (error === "declined") return t("checkout.threeDsDeclined");
  return t("checkout.threeDsUnconfirmed");
}

export function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5.5 7V5a2.5 2.5 0 015 0v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="rounded-sapil-sm bg-sapil-p-pink text-sapil-sale text-[14px] py-[12px] px-[16px]">
      {children}
    </p>
  );
}

/**
 * The bank's 3-D Secure page in a v9 dialog (`dialog` in v9: paper, 24px
 * radius, ink scrim). A native modal `<dialog>` stays inside the Sapil root
 * (tokens and fonts apply) while it sits in the top layer. It cannot be
 * dismissed: the shared hook closes it when the bank answers.
 */
export function SapilThreeDsModal({ src, frameRef, onFrameLoad }: PaymobThreeDsModalProps) {
  const t = useSapilCopy();
  const ref = useRef<HTMLDialogElement>(null);
  useLockPageScroll();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || dialog.open) return;
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby="sapil-3ds-title"
      aria-describedby="sapil-3ds-body"
      onCancel={(event) => event.preventDefault()}
      className="border-0 rounded-[24px] bg-sapil-paper text-sapil-ink p-0 m-auto w-[min(520px,calc(100%-24px))] h-[min(760px,92vh)] overflow-hidden shadow-sapil-lg open:flex flex-col open:animate-sapil-pop backdrop:bg-[rgba(30,27,24,.4)]"
    >
      <div className="px-[24px] pt-[20px] pb-[16px] border-b border-sapil-line text-center">
        <span aria-hidden="true" className="mx-auto mb-[10px] grid place-items-center w-[32px] h-[32px] rounded-full bg-sapil-accent-soft text-sapil-accent">
          <LockIcon />
        </span>
        <h2 id="sapil-3ds-title" className="!font-sapil-sans !font-[700] !text-[18px] !tracking-[-.01em]">
          {t("checkout.threeDsTitle")}
        </h2>
        <p id="sapil-3ds-body" className="mt-[4px] text-[13px] text-sapil-ink-2">
          {t("checkout.threeDsBody")}
        </p>
      </div>
      <iframe
        ref={frameRef}
        title={t("checkout.threeDsFrame")}
        src={src}
        className="min-h-0 w-full flex-1 border-0 bg-sapil-white"
        allow="payment *; publickey-credentials-get *"
        sandbox="allow-scripts allow-forms allow-same-origin allow-popups"
        onLoad={onFrameLoad}
      />
    </dialog>
  );
}
