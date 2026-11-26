import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AssistantWidget } from "./AssistantWidget";
import type { AssistantChatResponse, AssistantHistory } from "../types";

vi.mock("@/lib/i18n/LocaleLink", () => ({
  LocaleLink: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const NUMBER = "UAE-MWVR2YG4-2753EB";

const reply = (over: Partial<AssistantChatResponse["reply"]>): AssistantChatResponse => ({
  conversationId: "conv-1",
  lang: "en",
  reply: { intent: "X", text: "ok", cards: [], quickReplies: [], handoff: false, ...over },
});

const ordersReply = reply({
  intent: "RETURN_ELIGIBILITY",
  text: "Here is what I can see for your latest order:",
  quickReplies: ["Where is my return?"],
  afterSales: {
    kind: "ORDERS",
    orders: [
      {
        orderId: "11111111-1111-4111-8111-111111111111",
        orderNumber: NUMBER,
        placedAt: "2026-11-03T10:00:00.000Z",
        itemCount: 2,
        statusLabel: "Delivered",
        returns: { allowed: true, code: null, eligibleUntil: "2026-12-17T20:00:00.000Z", message: null },
        exchanges: { allowed: true, code: null, eligibleUntil: "2026-12-17T20:00:00.000Z", message: null },
      },
    ],
  },
});

function setup(send: ReturnType<typeof vi.fn>) {
  const history: AssistantHistory = { signedIn: true, conversationId: "conv-1", messages: [] };
  render(
    <AssistantWidget
      zoneCode="UAE"
      locale="en"
      send={send as never}
      loadHistory={async () => history}
      clearHistory={async () => undefined}
      addToBag={vi.fn(async () => true)}
      handoff={vi.fn(async () => ({ ticketNumber: "TKT-1" }))}
    />,
  );
  return userEvent.setup();
}

const openChat = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole("button", { name: /chat with our shopping assistant/i }));
  await screen.findByRole("dialog", { name: "Fragrance Concierge" });
};

describe("AssistantWidget: the customer's own orders and requests", () => {
  it("draws the orders as cards under the answer, with links to the customer's own pages", async () => {
    const send = vi.fn(async () => ordersReply);
    const user = setup(send);
    await openChat(user);
    await user.type(await screen.findByLabelText("Your message"), "Can I return my order?");
    await user.click(screen.getByRole("button", { name: "Send" }));

    const panel = screen.getByRole("dialog", { name: "Fragrance Concierge" });
    expect(await within(panel).findByText("Here is what I can see for your latest order:")).toBeInTheDocument();
    const cards = within(panel).getByRole("region", { name: "Your recent orders" });
    expect(within(cards).getByText(NUMBER)).toBeInTheDocument();
    expect(within(cards).getByText(/Return: you can ask until/)).toBeInTheDocument();
    expect(within(cards).getByText(/Exchange: you can ask until/)).toBeInTheDocument();
    const links = within(cards).getAllByRole("link").map((link) => link.getAttribute("href"));
    expect(links).toEqual([
      "/account/orders/11111111-1111-4111-8111-111111111111/return",
      "/account/orders/11111111-1111-4111-8111-111111111111",
      "/return-terms",
    ]);
    // The shopper's message carried the text only: no order, no customer.
    expect(send).toHaveBeenCalledWith({ message: "Can I return my order?", zoneCode: "UAE", locale: "en" });
  });

  it("draws the requests as cards, and the follow-up button asks the question again as typed text", async () => {
    const send = vi
      .fn()
      .mockResolvedValueOnce(ordersReply)
      .mockResolvedValueOnce(
        reply({
          intent: "RETURN_STATUS",
          text: "Here is your latest return or exchange request:",
          afterSales: {
            kind: "REQUESTS",
            requests: [
              {
                kind: "RETURN",
                id: "ret-1",
                number: "RN-MWVQWE15-F000BF",
                orderNumber: NUMBER,
                orderId: "11111111-1111-4111-8111-111111111111",
                status: "REFUND_PENDING",
                statusMessage: "Your refund is being processed.",
                createdAt: "2026-11-20T09:00:00.000Z",
                unitCount: 1,
              },
            ],
          },
        }),
      );
    const user = setup(send);
    await openChat(user);
    await user.type(await screen.findByLabelText("Your message"), "Can I return my order?");
    await user.click(screen.getByRole("button", { name: "Send" }));
    await user.click(await screen.findByRole("button", { name: "Where is my return?" }));

    expect(await screen.findByText("Your refund is being processed.")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Your return and exchange requests" })).toBeInTheDocument();
    expect(send.mock.calls[1][0]).toMatchObject({ message: "Where is my return?" });
    // The earlier orders stay in the chat above it.
    expect(screen.getByRole("region", { name: "Your recent orders" })).toBeInTheDocument();
  });

  it("an answer without cards shows none", async () => {
    const send = vi.fn(async () => reply({ text: "Please sign in to your account and I can look up your orders." }));
    const user = setup(send);
    await openChat(user);
    await user.type(await screen.findByLabelText("Your message"), "Can I return my order?");
    await user.click(screen.getByRole("button", { name: "Send" }));
    expect(await screen.findByText(/Please sign in to your account/)).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Your recent orders" })).toBeNull();
    expect(document.querySelector("[data-assistant-after-sales]")).toBeNull();
  });
});

describe("AssistantWidget: actions it does not know", () => {
  const send = (actions: unknown[]) => vi.fn(async () => reply({ text: "Pick one", actions: actions as never }));

  it("draws nothing for an action type from a newer server, never a hand-off button", async () => {
    const user = setup(send([{ type: "START_EXCHANGE_TRACKING", orderId: "x", label: "Start my return" }]));
    await openChat(user);
    await user.type(await screen.findByLabelText("Your message"), "hello");
    await user.click(screen.getByRole("button", { name: "Send" }));
    expect(await screen.findByText("Pick one")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Start my return" })).toBeNull();
    expect(document.querySelector("[data-assistant-handoff-button]")).toBeNull();
  });

  it("still draws the hand-off button next to an unknown action", async () => {
    const user = setup(
      send([
        { type: "START_EXCHANGE_TRACKING", orderId: "x", label: "Start my return" },
        { type: "HANDOFF", label: "Talk to customer care" },
      ]),
    );
    await openChat(user);
    await user.type(await screen.findByLabelText("Your message"), "hello");
    await user.click(screen.getByRole("button", { name: "Send" }));
    await waitFor(() => expect(document.querySelectorAll("[data-assistant-handoff-button]")).toHaveLength(1));
    expect(screen.getByRole("button", { name: "Talk to customer care" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Start my return" })).toBeNull();
  });
});
