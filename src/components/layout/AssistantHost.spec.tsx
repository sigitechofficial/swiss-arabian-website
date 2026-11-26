import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/stores/useAuthStore";

let pathname = "/";
vi.mock("next/navigation", () => ({ usePathname: () => pathname }));
vi.mock("@/lib/i18n/ShopLocaleProvider", () => ({ useLocaleConfig: () => ({}) }));
vi.mock("@/lib/i18n/localePath", () => ({ localeFromPathname: () => "en" }));
vi.mock("@/stores/useUiStore", () => ({
  useUiStore: (select: (s: unknown) => unknown) => select({ catalogContext: { zoneCode: "UAE" } }),
}));
vi.mock("@/features/assistant/api/assistant.service", () => ({ fetchAssistantEnabled: async () => true }));

let token: string | null = "t1";
vi.mock("@/lib/auth/token", () => ({ getAccessToken: () => token }));

// A stand-in for the chat window that remembers what was typed into it, like the real one remembers its messages.
vi.mock("@/features/assistant/components/AssistantWidget", () => ({
  AssistantWidget: () => {
    const [text, setText] = useState("");
    return (
      <div>
        <input aria-label="chat" value={text} onChange={(e) => setText(e.target.value)} />
      </div>
    );
  },
}));

import { AssistantHost } from "./AssistantHost";

const signIn = (id: string) =>
  act(() => {
    useAuthStore.setState({ user: { id, email: `${id}@example.test` }, isAuthenticated: true, bootstrapped: true });
  });

describe("AssistantHost: the chat belongs to whoever is signed in", () => {
  beforeEach(() => {
    token = "t1";
    pathname = "/";
    useAuthStore.setState({ user: null, isAuthenticated: false, bootstrapped: false });
  });

  it.each([
    "/login",
    "/ar/login",
    "/register",
    "/en/register",
    "/verify",
    "/en/verify",
    "/forgot-password",
    "/reset-password",
    "/checkout",
    "/en/checkout/payment",
  ])("does not show the chat on %s", async (path) => {
    pathname = path;
    render(<AssistantHost />);
    // Give the "is it switched on" lookup time to answer: the chat still must not appear.
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(screen.queryByLabelText("chat")).toBeNull();
  });

  it.each(["/", "/en", "/account", "/en/account/orders", "/pages/exchange-and-return-policy", "/en/products/oud"])(
    "shows the chat on %s",
    async (path) => {
      pathname = path;
      render(<AssistantHost />);
      expect(await screen.findByLabelText("chat")).toBeInTheDocument();
    },
  );

  const typeInChat = async (text: string) => {
    const input = await screen.findByLabelText("chat");
    await userEvent.type(input, text);
    expect(input).toHaveValue(text);
  };

  it("starts the chat from nothing when the customer signs out", async () => {
    signIn("c1");
    render(<AssistantHost />);
    await typeInChat("my order is UAE-123");
    act(() => useAuthStore.getState().reset());
    await waitFor(() => expect(screen.getByLabelText("chat")).toHaveValue(""));
  });

  it("starts the chat from nothing when a different customer signs in", async () => {
    signIn("c1");
    render(<AssistantHost />);
    await typeInChat("private");
    signIn("c2");
    await waitFor(() => expect(screen.getByLabelText("chat")).toHaveValue(""));
  });

  it("keeps the chat while nothing about the sign-in changes", async () => {
    signIn("c1");
    render(<AssistantHost />);
    await typeInChat("hello");
    signIn("c1");
    expect(screen.getByLabelText("chat")).toHaveValue("hello");
  });

  it("starts again when another tab signs out", async () => {
    signIn("c1");
    render(<AssistantHost />);
    await typeInChat("private");
    token = null;
    act(() => {
      window.dispatchEvent(new Event("storage"));
    });
    await waitFor(() => expect(screen.getByLabelText("chat")).toHaveValue(""));
  });
});
