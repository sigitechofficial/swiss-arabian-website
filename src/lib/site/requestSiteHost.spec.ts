import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./siteRegistry", () => ({ lookupSite: vi.fn() }));
vi.mock("@/lib/brand", () => ({ getBrandConfig: () => ({ code: "SAPIL" }) }));

import { lookupSite } from "./siteRegistry";
import { verifiedRequestSiteHost } from "./requestSiteHost";

const site = (brandCode: string) => ({ status: "known" as const, site: { brandCode } as never });
const req = (host: string, forwarded?: string) =>
  new Headers({ host, ...(forwarded ? { "x-forwarded-host": forwarded } : {}) });

/** SE-10: the 404 page's API calls send the shop only for this brand's own websites. */
describe("verifiedRequestSiteHost", () => {
  beforeEach(() => {
    vi.mocked(lookupSite).mockReset();
  });

  it("uses the address the shopper came to (Front Door forwards it)", async () => {
    vi.mocked(lookupSite).mockResolvedValue(site("SAPIL"));
    await expect(
      verifiedRequestSiteHost(req("ca-sapil.example.io", "sapil-web-dev.z02.azurefd.net")),
    ).resolves.toBe("sapil-web-dev.z02.azurefd.net");
    expect(lookupSite).toHaveBeenCalledWith("sapil-web-dev.z02.azurefd.net");
  });

  it("refuses an address of another brand", async () => {
    vi.mocked(lookupSite).mockResolvedValue(site("SWISS_ARABIAN"));
    await expect(verifiedRequestSiteHost(req("swissarabian.com"))).resolves.toBeNull();
  });

  it("refuses an unknown address and an unreachable backend", async () => {
    vi.mocked(lookupSite).mockResolvedValue({ status: "unknown" });
    await expect(verifiedRequestSiteHost(req("evil.example"))).resolves.toBeNull();
    vi.mocked(lookupSite).mockResolvedValue({ status: "unavailable" });
    await expect(verifiedRequestSiteHost(req("sapil.com"))).resolves.toBeNull();
  });
});
