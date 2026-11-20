import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ApiClientError } from "@/lib/api/apiError";
import { AssistantWidget } from "./AssistantWidget";

type WidgetProps = React.ComponentProps<typeof AssistantWidget>;
import type { AssistantChatResponse, AssistantHistory } from "../types";

vi.mock("@/lib/i18n/LocaleLink", () => ({
  LocaleLink: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const answer = (over: Partial<AssistantChatResponse["reply"]> = {}): AssistantChatResponse => ({
  conversationId: null,
  lang: "en",
  reply: {
    intent: "BESTSELLERS",
    text: "These are our current bestsellers.",
    cards: [],
    quickReplies: [],
    handoff: false,
    ...over,
  },
});

const guestHistory: AssistantHistory = { signedIn: false, conversationId: null, messages: [] };

function setup(
  options: {
    send?: ReturnType<typeof vi.fn>;
    history?: AssistantHistory | Error;
    clear?: ReturnType<typeof vi.fn>;
  } = {},
) {
  const send = options.send ?? vi.fn(async () => answer());
  const loadHistory = vi.fn(async () => {
    if (options.history instanceof Error) throw options.history;
    return options.history ?? guestHistory;
  });
  const clearHistory = options.clear ?? vi.fn(async () => undefined);
  render(
    <AssistantWidget
      zoneCode="UAE"
      locale="en"
      send={send as WidgetProps["send"]}
      loadHistory={loadHistory}
      clearHistory={clearHistory as WidgetProps["clearHistory"]}
    />,
  );
  return { send, loadHistory, clearHistory, user: userEvent.setup() };
}

const open = async (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole("button", { name: /chat with our shopping assistant/i }));

describe("AssistantWidget", () => {
  it("shows a launcher and opens a labelled chat window with a greeting and starter buttons", async () => {
    const { user } = setup();
    expect(screen.queryByRole("dialog")).toBeNull();
    await open(user);
    const panel = screen.getByRole("dialog", { name: "Shopping assistant" });
    expect(await within(panel).findByText(/I can help you find a fragrance/i)).toBeInTheDocument();
    expect(within(panel).getByRole("button", { name: "Suggest me something" })).toBeInTheDocument();
    expect(within(panel).getByRole("button", { name: "Track my order" })).toBeInTheDocument();
  });

  it("sends a typed message with only the text, the market and the language", async () => {
    const { send, user } = setup();
    await open(user);
    await screen.findByText(/I can help you find a fragrance/i);
    await user.type(screen.getByLabelText("Your message"), "What are your bestsellers?");
    await user.click(screen.getByRole("button", { name: "Send" }));
    expect(send).toHaveBeenCalledWith({ message: "What are your bestsellers?", zoneCode: "UAE", locale: "en" });
    expect(await screen.findByText("These are our current bestsellers.")).toBeInTheDocument();
    expect(screen.getByLabelText("Your message")).toHaveValue("");
  });

  it("does not send an empty message", async () => {
    const { send, user } = setup();
    await open(user);
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
    await user.type(screen.getByLabelText("Your message"), "   ");
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
    expect(send).not.toHaveBeenCalled();
  });

  it("sends a tapped starter button", async () => {
    const { send, user } = setup();
    await open(user);
    await user.click(await screen.findByRole("button", { name: "Suggest me something" }));
    await waitFor(() => expect(send).toHaveBeenCalledTimes(1));
    expect(send.mock.calls[0][0]).toMatchObject({ message: "Suggest me something" });
  });

  it("shows product cards with a price and a link to the product page", async () => {
    const send = vi.fn(async () =>
      answer({
        cards: [
          {
            productId: "p1",
            slug: "oud-royale",
            name: "Oud Royale",
            image: "/catalog/media/x.jpg",
            shortDescription: null,
            priceSummary: { price: "250.00", compareAtPrice: "300", currencyCode: "AED", hasValidPrice: true },
          },
          {
            productId: "p2",
            slug: null,
            name: "No price perfume",
            image: null,
            shortDescription: null,
            priceSummary: { price: null, hasValidPrice: false },
          },
        ],
      }),
    );
    const { user } = setup({ send });
    await open(user);
    await user.click(await screen.findByRole("button", { name: "Track my order" }));
    const link = await screen.findByRole("link", { name: "View Oud Royale" });
    expect(link).toHaveAttribute("href", "/products/oud-royale");
    expect(link).toHaveTextContent("AED 250.00");
    expect(link).toHaveTextContent("AED 300.00");
    expect(screen.getByText("No price perfume")).toBeInTheDocument();
    expect(screen.queryByText(/AED NaN/)).toBeNull();
  });

  it("turns our policy paths and https addresses into links, and nothing else", async () => {
    const send = vi.fn(async () =>
      answer({
        text: "Read /policies/refund-policy or https://example.com/help. javascript:alert(1) and http://plain.example are not links.",
      }),
    );
    const { user } = setup({ send });
    await open(user);
    await user.click(await screen.findByRole("button", { name: "Track my order" }));
    expect(await screen.findByRole("link", { name: "/policies/refund-policy" })).toHaveAttribute(
      "href",
      "/policies/refund-policy",
    );
    expect(screen.getByRole("link", { name: "https://example.com/help" })).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getAllByRole("link")).toHaveLength(2);
  });

  it("shows a friendly message when something fails, and a different one when rate limited", async () => {
    const send = vi
      .fn()
      .mockRejectedValueOnce(new Error("network"))
      .mockRejectedValueOnce(new ApiClientError(429, "Too many requests"));
    const { user } = setup({ send });
    await open(user);
    await user.click(await screen.findByRole("button", { name: "Suggest me something" }));
    expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument();
    await user.type(screen.getByLabelText("Your message"), "hello");
    await user.click(screen.getByRole("button", { name: "Send" }));
    expect(await screen.findByText(/sending messages very quickly/i)).toBeInTheDocument();
  });

  it("closes with the Close button and with Escape", async () => {
    const { user } = setup();
    await open(user);
    await user.click(screen.getByRole("button", { name: "Close chat" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    await open(user);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("sits above the site header (z-200) but below on-site pop-ups", async () => {
    const { user } = setup();
    expect(screen.getByRole("button", { name: /chat with our shopping assistant/i }).className).toMatch(/z-\[205\]/);
    await open(user);
    expect(screen.getByRole("dialog").className).toMatch(/z-\[205\]/);
  });
});

describe("AssistantWidget: saved chat", () => {
  const signedIn: AssistantHistory = {
    signedIn: true,
    conversationId: "conv-1",
    messages: [
      { role: "user", text: "Do you have oud?", at: "2026-11-19T10:00:01.000Z" },
      { role: "assistant", text: "Here are 5 options that match.", at: "2026-11-19T10:00:02.000Z" },
    ],
  };

  it("asks for the earlier chat once, the first time the window opens", async () => {
    const { loadHistory, user } = setup();
    await open(user);
    await screen.findByText(/I can help you find a fragrance/i);
    await user.click(screen.getByRole("button", { name: "Close chat" }));
    await open(user);
    expect(loadHistory).toHaveBeenCalledTimes(1);
    expect(loadHistory).toHaveBeenCalledWith("UAE");
  });

  it("shows a guest that their chat is not saved, with no clear button", async () => {
    const { user } = setup({ history: guestHistory });
    await open(user);
    expect(await screen.findByText(/This chat is not saved/i)).toBeInTheDocument();
    await user.type(screen.getByLabelText("Your message"), "hello");
    await user.click(screen.getByRole("button", { name: "Send" }));
    await screen.findByText("These are our current bestsellers.");
    expect(screen.queryByRole("button", { name: "Clear chat" })).toBeNull();
  });

  it("brings a signed-in customer's earlier chat back instead of the greeting", async () => {
    const { user } = setup({ history: signedIn });
    await open(user);
    expect(await screen.findByText("Do you have oud?")).toBeInTheDocument();
    expect(screen.getByText("Here are 5 options that match.")).toBeInTheDocument();
    expect(screen.queryByText(/I can help you find a fragrance/i)).toBeNull();
    expect(screen.queryByText(/This chat is not saved/i)).toBeNull();
  });

  it("lets a signed-in customer clear their chat, then shows the greeting again", async () => {
    const { clearHistory, user } = setup({ history: signedIn });
    await open(user);
    await screen.findByText("Do you have oud?");
    await user.click(screen.getByRole("button", { name: "Clear chat" }));
    expect(clearHistory).toHaveBeenCalledWith("UAE");
    expect(await screen.findByText(/I can help you find a fragrance/i)).toBeInTheDocument();
    expect(screen.queryByText("Do you have oud?")).toBeNull();
  });

  it("keeps the chat if clearing fails and says so", async () => {
    const { user } = setup({ history: signedIn, clear: vi.fn(async () => Promise.reject(new Error("down"))) });
    await open(user);
    await screen.findByText("Do you have oud?");
    await user.click(screen.getByRole("button", { name: "Clear chat" }));
    expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument();
    expect(screen.getByText("Do you have oud?")).toBeInTheDocument();
  });

  it("falls back to the greeting when the earlier chat cannot be loaded", async () => {
    const { user } = setup({ history: new Error("down") });
    await open(user);
    expect(await screen.findByText(/I can help you find a fragrance/i)).toBeInTheDocument();
  });
});
