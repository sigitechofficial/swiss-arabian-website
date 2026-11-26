import { beforeEach, describe, expect, it, vi } from "vitest";

const apiPost = vi.fn();
let guestToken: string | null = null;

vi.mock("@/lib/api/apiClient", () => ({
  apiPost: (...args: unknown[]) => apiPost(...args),
  apiGet: vi.fn(),
  apiDelete: vi.fn(),
}));
vi.mock("@/features/cart/utils/guestToken", () => ({
  readGuestToken: () => guestToken,
}));

import {
  confirmEmailLoginCode,
  confirmEmailVerification,
  loginCustomer,
  registerCustomer,
  confirmSignup,
  confirmPhoneLoginCode,
} from "./auth.service";

function sentBody() {
  return apiPost.mock.calls[0][1] as Record<string, unknown>;
}

describe("sign-in requests carry the guest cart token", () => {
  beforeEach(() => {
    apiPost.mockReset().mockResolvedValue({});
    guestToken = "guest-1";
  });

  it("password login sends it, so the guest bag moves to the account", async () => {
    await loginCustomer({ identifier: "a@b.com", password: "x" });
    expect(sentBody()).toEqual({ identifier: "a@b.com", password: "x", guestToken: "guest-1" });
  });

  it("email-code login sends it", async () => {
    await confirmEmailLoginCode({ email: "a@b.com", code: "123456" });
    expect(sentBody().guestToken).toBe("guest-1");
  });

  it("sign-up start creates nothing, so it carries no bag; the confirm that signs in does", async () => {
    await registerCustomer({ zoneCode: "URD1", email: "a@b.com", phone: "+971501234567", password: "x" });
    expect(sentBody().guestToken).toBeUndefined();

    apiPost.mockClear();
    await confirmSignup({ signupId: "s-1", emailCode: "111111", phoneCode: "222222" });
    expect(sentBody()).toEqual({ signupId: "s-1", emailCode: "111111", phoneCode: "222222", guestToken: "guest-1" });
  });

  it("phone-code sign-in sends the bag too", async () => {
    await confirmPhoneLoginCode({ phone: "+971501234567", code: "123456" });
    expect(sentBody().guestToken).toBe("guest-1");
  });

  it("verify-email confirm sends it only when it signs the shopper in", async () => {
    await confirmEmailVerification("a@b.com", "123456", { signIn: true });
    expect(sentBody()).toEqual({ email: "a@b.com", code: "123456", signIn: true, guestToken: "guest-1" });

    apiPost.mockClear();
    await confirmEmailVerification("a@b.com", "123456");
    expect(sentBody()).toEqual({ email: "a@b.com", code: "123456" });
  });

  it("sends nothing extra when there is no guest bag", async () => {
    guestToken = null;
    await loginCustomer({ identifier: "a@b.com", password: "x" });
    expect(sentBody()).toEqual({ identifier: "a@b.com", password: "x" });
  });
});
