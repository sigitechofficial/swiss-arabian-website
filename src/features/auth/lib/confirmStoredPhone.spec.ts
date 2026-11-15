import { beforeEach, describe, expect, it, vi } from "vitest";

const requestPhoneVerification = vi.hoisted(() => vi.fn());
const confirmPhoneVerification = vi.hoisted(() => vi.fn());

vi.mock("../api/auth.service", () => ({
  requestPhoneVerification: (...args: unknown[]) => requestPhoneVerification(...args),
  confirmPhoneVerification: (...args: unknown[]) => confirmPhoneVerification(...args),
}));

vi.mock("@/lib/config/env", () => ({
  env: {
    appEnv: "local",
  },
}));

import {
  confirmStoredPhoneWithSameCode,
  shouldConfirmStoredPhoneWithSameCode,
} from "./confirmStoredPhone";

beforeEach(() => {
  requestPhoneVerification.mockReset();
  confirmPhoneVerification.mockReset();
  requestPhoneVerification.mockResolvedValue({ success: true });
  confirmPhoneVerification.mockResolvedValue({ success: true });
});

describe("stored phone confirmation on the existing verify screen", () => {
  it("requests then confirms the stored phone with the same code", async () => {
    const confirmed = await confirmStoredPhoneWithSameCode({
      phoneE164: "+971501112233",
      code: "000000",
    });
    expect(confirmed).toBe(true);
    expect(requestPhoneVerification).toHaveBeenCalledWith("+971501112233");
    expect(confirmPhoneVerification).toHaveBeenCalledWith("+971501112233", "000000");
  });

  it("offers the same code as phone proof only on a local dev server", () => {
    expect(shouldConfirmStoredPhoneWithSameCode({ appEnv: "local", nodeEnv: "development" })).toBe(true);
    // Every deployed environment, and any production build, skips it.
    for (const appEnv of ["dev", "staging", "production"]) {
      expect(shouldConfirmStoredPhoneWithSameCode({ appEnv, nodeEnv: "development" })).toBe(false);
    }
    expect(shouldConfirmStoredPhoneWithSameCode({ appEnv: "local", nodeEnv: "production" })).toBe(false);
  });

  it("does not call phone verification when the customer has no stored phone", async () => {
    const confirmed = await confirmStoredPhoneWithSameCode({
      phoneE164: "  ",
      code: "000000",
    });
    expect(confirmed).toBe(false);
    expect(requestPhoneVerification).not.toHaveBeenCalled();
    expect(confirmPhoneVerification).not.toHaveBeenCalled();
  });
});
