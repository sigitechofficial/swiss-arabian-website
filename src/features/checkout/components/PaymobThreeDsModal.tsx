"use client";

import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type ComponentType,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { pollUntilPaymentSettles } from "../api/orders.service";
import {
  checkoutUrlFromIframe,
  finishPaidCheckout,
  installPaymobThreeDsCapture,
  paymobIframeReturnAction,
} from "../utils/paymobThreeDs";
import { useHydrated } from "@/hooks/useHydrated";

/** Why the 3-D Secure step did not finish (each brand words it). */
export type PaymobThreeDsError = "cancelled" | "declined" | "unconfirmed";

/** Swiss Arabian's sentences (also the default for any brand without its own). */
export function paymobThreeDsErrorText(error: PaymobThreeDsError): string {
  if (error === "cancelled") return "Payment was cancelled. You can try again with the same card.";
  if (error === "declined") return "Your card was declined. Please try another card.";
  return "We couldn’t confirm your payment. If your card was charged, please contact us before retrying.";
}

/** What a brand's 3-D Secure overlay receives: the bank's page and its frame. */
export type PaymobThreeDsModalProps = {
  src: string;
  frameRef: RefObject<HTMLIFrameElement | null>;
  onFrameLoad: () => void;
};

/**
 * Paymob's 3-D Secure step: opens the bank's page in an overlay when Pixel
 * asks for it, watches the frame and the order, then opens the confirmation
 * or reports why it did not finish. `Modal`: the brand's overlay (default:
 * Swiss Arabian's). `challengeErrorCode` is for brands that word it
 * themselves; `challengeError` is the default sentence.
 */
export function usePaymobThreeDsModal(
  orderId: string | null,
  { Modal = PaymobThreeDsModal }: { Modal?: ComponentType<PaymobThreeDsModalProps> } = {},
) {
  const [challengeUrl, setChallengeUrl] = useState<string | null>(null);
  const [challengeErrorCode, setChallengeErrorCode] = useState<PaymobThreeDsError | null>(null);
  const finishing = useRef(false);
  const frameRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    finishing.current = false;
    return installPaymobThreeDsCapture((url) => {
      finishing.current = false;
      setChallengeErrorCode(null);
      setChallengeUrl(url);
    });
  }, []);

  function closeModal() {
    setChallengeUrl(null);
  }

  function onSuccess() {
    if (!orderId || finishing.current) return;
    finishing.current = true;
    closeModal();
    finishPaidCheckout(orderId);
  }

  function onCancel() {
    closeModal();
    setChallengeErrorCode("cancelled");
  }

  function handleFrameLocation(frame: HTMLIFrameElement | null) {
    if (!orderId || finishing.current) return;
    const path = checkoutUrlFromIframe(frame);
    if (!path) return;
    if (paymobIframeReturnAction(path) === "cancel") {
      onCancel();
      return;
    }
    onSuccess();
  }

  // Effects below call the latest handlers without restarting polling.
  const settleSuccess = useEffectEvent(() => onSuccess());
  const checkFrameLocation = useEffectEvent((frame: HTMLIFrameElement | null) =>
    handleFrameLocation(frame),
  );

  useEffect(() => {
    if (!challengeUrl || !orderId) return;
    let cancelled = false;
    void pollUntilPaymentSettles(orderId, { attempts: 40, delayMs: 2000 }).then((result) => {
      if (cancelled || finishing.current) return;
      if (result.success) {
        settleSuccess();
        return;
      }
      if (result.status === "TIMEOUT") return;
      closeModal();
      setChallengeErrorCode(result.status === "DECLINED" ? "declined" : "unconfirmed");
    });
    return () => {
      cancelled = true;
    };
  }, [challengeUrl, orderId]);

  useEffect(() => {
    if (!challengeUrl) return;
    const tick = () => checkFrameLocation(frameRef.current);
    const timer = window.setInterval(tick, 400);
    return () => window.clearInterval(timer);
  }, [challengeUrl, orderId]);

  return {
    challengeErrorCode,
    challengeError: challengeErrorCode ? paymobThreeDsErrorText(challengeErrorCode) : null,
    overlay: challengeUrl ? (
      <Modal
        src={challengeUrl}
        frameRef={frameRef}
        onFrameLoad={() => handleFrameLocation(frameRef.current)}
      />
    ) : null,
  };
}

/** While the overlay is open the page behind it does not scroll. */
export function useLockPageScroll() {
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);
}

function PaymobThreeDsModal({ src, frameRef, onFrameLoad }: PaymobThreeDsModalProps) {
  // Portal target (document.body) exists only after hydration.
  const mounted = useHydrated();
  useLockPageScroll();

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-[#241f1b]/50 p-3 sm:p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="paymob-3ds-title"
        className="flex h-[min(760px,92vh)] w-full max-w-[520px] flex-col overflow-hidden rounded-2xl bg-white shadow-[0_24px_80px_rgba(36,31,27,0.28)]"
      >
        <div className="border-b border-[#eee6d8] px-5 py-4 text-center">
          <h2 id="paymob-3ds-title" className="m-0 text-[1.05rem] font-semibold text-[#241f1b]">
            Confirming your payment
          </h2>
          <p className="m-0 mt-1 text-[0.8rem] text-[#5b5148]">Please do not close or refresh this page</p>
        </div>
        <iframe
          ref={frameRef}
          title="Card verification"
          src={src}
          className="min-h-0 w-full flex-1 border-0 bg-white"
          allow="payment *; publickey-credentials-get *"
          sandbox="allow-scripts allow-forms allow-same-origin allow-popups"
          onLoad={onFrameLoad}
        />
      </div>
    </div>,
    document.body,
  );
}
