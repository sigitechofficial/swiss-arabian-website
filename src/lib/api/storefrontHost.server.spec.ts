import { beforeEach, describe, expect, it, vi } from "vitest";

const headerGet = vi.fn();

vi.mock("next/headers", () => ({
  headers: async () => ({ get: headerGet }),
}));

import { readRegisteredServerHost } from "./storefrontHost";
import "./registerStorefrontHost";

describe("server storefront host", () => {
  beforeEach(() => {
    headerGet.mockReset();
  });

  it("forwards the incoming host", async () => {
    headerGet.mockImplementation((name: string) => (name === "host" ? "shop.example" : null));
    expect(await readRegisteredServerHost()).toBe("shop.example");
  });

  it("uses the first x-forwarded-host when a proxy sends a list", async () => {
    headerGet.mockImplementation((name: string) =>
      name === "x-forwarded-host" ? "public.example, edge.internal" : "127.0.0.1:3000",
    );
    expect(await readRegisteredServerHost()).toBe("public.example");
  });

  it("returns null when the request has no host", async () => {
    headerGet.mockReturnValue(null);
    expect(await readRegisteredServerHost()).toBeNull();
  });
});
