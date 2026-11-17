import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

let search = "t=abc.def";
let pathname = "/r";
const replace = vi.fn();
const apiPost = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
  useSearchParams: () => new URLSearchParams(search),
  useRouter: () => ({ replace, push: vi.fn(), prefetch: vi.fn(), back: vi.fn(), refresh: vi.fn() }),
}));
vi.mock("@/lib/api/apiClient", () => ({ apiPost: (...args: unknown[]) => apiPost(...args) }));

import { EmailLinkRedirect } from "./EmailLinkRedirect";

describe("EmailLinkRedirect", () => {
  beforeEach(() => {
    search = "t=abc.def";
    pathname = "/r";
    replace.mockReset();
    apiPost.mockReset();
  });

  it("records the click and forwards to the destination", async () => {
    apiPost.mockResolvedValue({ ok: true, destination: "/cart" });
    render(<EmailLinkRedirect />);
    expect(screen.getByRole("status")).toBeTruthy();
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/cart"));
    expect(apiPost).toHaveBeenCalledWith("/storefront/email-links/open", { token: "abc.def" });
  });

  it("keeps an Arabic reader in Arabic", async () => {
    pathname = "/ar/r";
    apiPost.mockResolvedValue({ ok: true, destination: "/cart" });
    render(<EmailLinkRedirect />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/ar/cart"));
  });

  it("asks the backend only once even if it renders twice", async () => {
    apiPost.mockResolvedValue({ ok: true, destination: "/cart" });
    const { rerender } = render(<EmailLinkRedirect />);
    rerender(<EmailLinkRedirect />);
    await waitFor(() => expect(replace).toHaveBeenCalledTimes(1));
    expect(apiPost).toHaveBeenCalledTimes(1);
  });

  it("says so, and offers the shop, when the link is not valid", async () => {
    apiPost.mockResolvedValue({ ok: false, destination: null });
    render(<EmailLinkRedirect />);
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(replace).not.toHaveBeenCalled();
  });

  it("never forwards to another site, whatever the answer says", async () => {
    for (const destination of ["https://evil.test/x", "//evil.test", "/\\evil.test", "javascript:alert(1)"]) {
      replace.mockReset();
      apiPost.mockResolvedValue({ ok: true, destination });
      const { unmount } = render(<EmailLinkRedirect />);
      expect(await screen.findByRole("alert")).toBeTruthy();
      expect(replace).not.toHaveBeenCalled();
      unmount();
    }
  });

  it("says so when the request fails, and when there is no token at all", async () => {
    apiPost.mockRejectedValue(new Error("network"));
    const { unmount } = render(<EmailLinkRedirect />);
    expect(await screen.findByRole("alert")).toBeTruthy();
    unmount();

    search = "";
    apiPost.mockReset();
    render(<EmailLinkRedirect />);
    expect(screen.getByRole("alert")).toBeTruthy();
    expect(apiPost).not.toHaveBeenCalled();
  });
});
