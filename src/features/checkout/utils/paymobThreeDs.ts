import { clearCartId } from "@/features/cart/utils/guestToken";
import { useCartStore } from "@/stores/useCartStore";
import { clearPaymentState } from "./checkoutSession";
import { checkoutHref } from "./checkoutLocale";

const challengeCallbacks = new Set<(url: string) => void>();
let captureInstalled = false;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function isPaymobChallengeUrl(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url, "https://uae.paymob.com");
  } catch {
    return false;
  }
  const haystack = `${parsed.hostname}${parsed.pathname}${parsed.search}`.toLowerCase();
  return /mpgs_secure_callback|3dsecure|3d-secure|\/3ds|acs/.test(haystack);
}

function isThreeDsFlag(value: unknown): boolean {
  return value === true || value === "true" || value === 1 || value === "1";
}

/**
 * Pixel posts `{ type: "paymentResponse", response: { res } }` then does
 * `window.location.href = redirection_url` for 3DS. Pull that URL so checkout
 * can keep the challenge in an iframe modal.
 */
export function extractPaymobThreeDsUrl(data: unknown): string | null {
  if (!isRecord(data)) return null;

  const payload = data.type === "paymentResponse" && isRecord(data.response) ? data.response : data;
  const res = isRecord(payload.res) ? payload.res : payload;
  const body = isRecord(res.data) ? res.data : res;
  if (!isRecord(body)) return null;

  const url = stringOrNull(body.redirection_url) ?? stringOrNull(body.redirect_url);
  if (!url || url.startsWith("/") || url.includes("/order-confirmation/")) return null;
  if (isThreeDsFlag(body.is_3d_secure) || isPaymobChallengeUrl(url)) return url;
  return null;
}

function notifyChallenge(url: string) {
  challengeCallbacks.forEach((callback) => callback(url));
}

function onWindowMessage(event: MessageEvent) {
  const url = extractPaymobThreeDsUrl(event.data);
  if (!url) return;
  event.stopImmediatePropagation();
  notifyChallenge(url);
}

export function installPaymobThreeDsCapture(onChallenge: (url: string) => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  challengeCallbacks.add(onChallenge);
  if (!captureInstalled) {
    captureInstalled = true;
    window.addEventListener("message", onWindowMessage, true);
  }
  return () => {
    challengeCallbacks.delete(onChallenge);
    if (challengeCallbacks.size === 0 && captureInstalled) {
      window.removeEventListener("message", onWindowMessage, true);
      captureInstalled = false;
    }
  };
}

export function finishPaidCheckout(orderId: string) {
  clearPaymentState();
  useCartStore.getState().clear();
  useCartStore.getState().setCartId(null);
  clearCartId();
  window.location.replace(checkoutHref(`/order-confirmation/${encodeURIComponent(orderId)}`));
}

export function checkoutUrlFromIframe(frame: HTMLIFrameElement | null): string | null {
  try {
    const href = frame?.contentWindow?.location.href;
    if (!href || href === "about:blank") return null;
    const url = new URL(href);
    if (url.origin !== window.location.origin) return null;
    return `${url.pathname}${url.search}`;
  } catch {
    return null;
  }
}

/** After 3DS, Paymob sends the iframe back to our origin — often checkout, not confirmation. */
export function paymobIframeReturnAction(pathAndSearch: string): "success" | "cancel" {
  let url: URL;
  try {
    url = new URL(pathAndSearch, "https://store.local");
  } catch {
    return "success";
  }
  const success = url.searchParams.get("success")?.toLowerCase();
  if (url.pathname.includes("/checkout/payment/cancel") || success === "false" || success === "0") {
    return "cancel";
  }
  return "success";
}
