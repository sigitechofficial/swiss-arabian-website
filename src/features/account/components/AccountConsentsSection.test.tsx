import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  getCommunicationPreferences: vi.fn(),
  setCommunicationPreference: vi.fn(),
}));
vi.mock("../api/customerAccount.service", () => api);
vi.mock("@/lib/i18n/useShopCopy", () => ({ useShopCopy: () => (key: string) => key }));
const toast = vi.hoisted(() => vi.fn());
vi.mock("@/components/ui/Toaster", () => ({ toast }));

import { AccountConsentsSection } from "./AccountConsentsSection";

function wrap(children: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("AccountConsentsSection (communication preferences)", () => {
  beforeEach(() => {
    api.getCommunicationPreferences.mockReset();
    api.setCommunicationPreference.mockReset();
    toast.mockReset();
  });

  it("shows one switch per channel the platform sends offers on, as the sender sees it", async () => {
    api.getCommunicationPreferences.mockResolvedValue({ channels: [{ channel: "EMAIL", subscribed: false }] });
    render(wrap(<AccountConsentsSection />));
    const email = await screen.findByRole("switch", { name: "account.consent.email" });
    expect(email).not.toBeChecked();
    // Channels nothing is sent on are not offered.
    expect(screen.queryByRole("switch", { name: "account.consent.sms" })).toBeNull();
  });

  it("a switch saves at once and shows the saved state", async () => {
    api.getCommunicationPreferences.mockResolvedValue({ channels: [{ channel: "EMAIL", subscribed: false }] });
    api.setCommunicationPreference.mockResolvedValue({ channels: [{ channel: "EMAIL", subscribed: true }] });
    render(wrap(<AccountConsentsSection />));
    fireEvent.click(await screen.findByRole("switch", { name: "account.consent.email" }));
    await waitFor(() => expect(api.setCommunicationPreference).toHaveBeenCalledWith("EMAIL", true));
    await waitFor(() => expect(screen.getByRole("switch", { name: "account.consent.email" })).toBeChecked());
    expect(toast).toHaveBeenCalledWith("account.consent.savedOn", "success");
  });

  it("says so, with a retry, when the preferences can't be loaded", async () => {
    api.getCommunicationPreferences.mockRejectedValueOnce(new Error("down"));
    render(wrap(<AccountConsentsSection />));
    expect(await screen.findByRole("alert")).toHaveTextContent("account.consent.loadFailed");
    api.getCommunicationPreferences.mockResolvedValue({ channels: [{ channel: "EMAIL", subscribed: true }] });
    fireEvent.click(screen.getByRole("button", { name: "account.consent.retry" }));
    expect(await screen.findByRole("switch", { name: "account.consent.email" })).toBeChecked();
  });
});
