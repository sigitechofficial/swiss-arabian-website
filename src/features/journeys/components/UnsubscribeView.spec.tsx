import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

let search = "token=cust-1.sig";
const apiPost = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/unsubscribe",
  useSearchParams: () => new URLSearchParams(search),
}));
vi.mock("@/lib/api/apiClient", () => ({ apiPost: (...args: unknown[]) => apiPost(...args) }));

import { UnsubscribeView } from "./UnsubscribeView";

describe("UnsubscribeView", () => {
  beforeEach(() => {
    search = "token=cust-1.sig";
    apiPost.mockReset();
  });

  it("does nothing until the customer confirms (mail scanners prefetch links)", () => {
    render(<UnsubscribeView />);
    expect(screen.getByRole("button", { name: "Unsubscribe" })).toBeTruthy();
    expect(apiPost).not.toHaveBeenCalled();
  });

  it("sends the token and confirms", async () => {
    apiPost.mockResolvedValue({ ok: true });
    render(<UnsubscribeView />);
    await userEvent.setup().click(screen.getByRole("button", { name: "Unsubscribe" }));
    expect(apiPost).toHaveBeenCalledWith("/storefront/email-preferences/unsubscribe", { token: "cust-1.sig" });
    expect(await screen.findByRole("status")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Unsubscribe" })).toBeNull();
  });

  it("says so when the link is not valid", async () => {
    apiPost.mockResolvedValue({ ok: false });
    render(<UnsubscribeView />);
    await userEvent.setup().click(screen.getByRole("button", { name: "Unsubscribe" }));
    expect(await screen.findByRole("alert")).toBeTruthy();
  });

  it("says so when the request fails, and when there is no token at all", async () => {
    apiPost.mockRejectedValue(new Error("network"));
    const { unmount } = render(<UnsubscribeView />);
    await userEvent.setup().click(screen.getByRole("button", { name: "Unsubscribe" }));
    expect(await screen.findByRole("alert")).toBeTruthy();
    unmount();

    search = "";
    render(<UnsubscribeView />);
    expect(screen.getByRole("alert")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Unsubscribe" })).toBeNull();
  });
});
