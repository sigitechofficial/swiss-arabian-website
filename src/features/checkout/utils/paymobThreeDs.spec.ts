import { describe, expect, it, vi } from "vitest";
import {
  extractPaymobThreeDsUrl,
  installPaymobThreeDsCapture,
  isPaymobChallengeUrl,
  paymobIframeReturnAction,
} from "./paymobThreeDs";

describe("extractPaymobThreeDsUrl", () => {
  it("reads Pixel paymentResponse 3DS redirection", () => {
    expect(
      extractPaymobThreeDsUrl({
        type: "paymentResponse",
        response: {
          res: {
            status: 200,
            data: {
              is_3d_secure: "true",
              redirection_url: "https://uae.paymob.com/api/acceptance/mpgs_secure_callback/1/confirmation",
            },
          },
        },
      }),
    ).toContain("mpgs_secure_callback");
  });

  it("ignores a paid return to our confirmation page", () => {
    expect(
      extractPaymobThreeDsUrl({
        type: "paymentResponse",
        response: {
          res: {
            status: 200,
            data: {
              is_3d_secure: "false",
              redirection_url: "https://shop.test/order-confirmation/abc",
            },
          },
        },
      }),
    ).toBeNull();
  });

  it("treats MPGS callback URLs as a challenge even without the flag", () => {
    expect(isPaymobChallengeUrl("https://uae.paymob.com/api/acceptance/mpgs_secure_callback/5909377/confirmation")).toBe(
      true,
    );
  });

  it("installs a capture listener without touching location", () => {
    const onChallenge = vi.fn();
    const stop = installPaymobThreeDsCapture(onChallenge);
    window.dispatchEvent(
      new MessageEvent("message", {
        data: {
          type: "paymentResponse",
          response: {
            res: {
              status: 200,
              data: {
                is_3d_secure: "true",
                redirection_url: "https://uae.paymob.com/api/acceptance/mpgs_secure_callback/1/confirmation",
              },
            },
          },
        },
      }),
    );
    expect(onChallenge).toHaveBeenCalledOnce();
    stop();
  });
});

describe("paymobIframeReturnAction", () => {
  it("closes as success when Paymob returns to checkout", () => {
    expect(paymobIframeReturnAction("/checkout")).toBe("success");
    expect(paymobIframeReturnAction("/order-confirmation/abc")).toBe("success");
  });

  it("treats an explicit cancel return as cancel", () => {
    expect(paymobIframeReturnAction("/checkout/payment/cancel")).toBe("cancel");
    expect(paymobIframeReturnAction("/checkout?success=false")).toBe("cancel");
  });
});
