import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AssistantWidget } from "./AssistantWidget";
import type { AssistantReturnFlowApi } from "../api/assistant.service";
import type { AssistantAfterSalesView, AssistantChatResponse, AssistantFlowView, AssistantHistory } from "../types";

vi.mock("@/lib/i18n/LocaleLink", () => ({
  LocaleLink: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const NUMBER = "UAE-MWVR2YG4-2753EB";
const ORDER = "11111111-1111-4111-8111-111111111111";
const LINE = "22222222-2222-4222-8222-222222222222";
const base = { flowId: "f1", kind: "RETURN", expiresAt: "2026-11-26T14:00:00.000Z" } as const;

const ordersView = (chat: { return: boolean; exchange: boolean }): AssistantAfterSalesView => ({
  kind: "ORDERS",
  orders: [
    {
      orderId: ORDER,
      orderNumber: NUMBER,
      placedAt: "2026-11-20T10:00:00.000Z",
      itemCount: 2,
      statusLabel: "Delivered",
      returns: { allowed: true, code: null, eligibleUntil: "2026-12-17T20:00:00.000Z", message: null },
      exchanges: { allowed: true, code: null, eligibleUntil: "2026-12-17T20:00:00.000Z", message: null },
      chat,
    },
  ],
});

const offer: AssistantChatResponse = {
  conversationId: "conv-1",
  lang: "en",
  reply: {
    intent: "RETURN_ELIGIBILITY",
    text: "Here is what I can see for your latest order:",
    cards: [],
    quickReplies: [],
    handoff: false,
    afterSales: ordersView({ return: true, exchange: false }),
  },
};

const estimate = (refund: string) =>
  ({
    orderId: ORDER,
    orderNumber: NUMBER,
    currencyCode: "AED",
    policyVersion: null,
    isEstimate: true,
    reasonCode: "WRONG_ITEM",
    ourFaultReason: true,
    taxIncluded: true,
    lines: [],
    itemsAmount: "100.00",
    taxAmount: "4.76",
    itemsTotal: "100.00",
    delivery: { refunded: false, amount: "0.00", reason: "NO_SHIPPING_CHARGED", message: { key: "DELIVERY", variant: "NONE" } },
    deductions: {
      returnShippingFee: { amount: "0.00", waived: false },
      restockingFee: { amount: "0.00", percent: "0", waived: false },
      freeGift: { amount: "0.00", gifts: [] },
      spentPoints: { amount: "0.00", points: "0" },
    },
    totalDeductions: "0.00",
    estimatedRefund: refund,
    refundDestination: { key: "REFUND_DESTINATION", variant: "ORIGINAL" },
    giftRequirement: { required: false, code: null, message: null, gifts: [] },
    notes: [],
  }) as never;

const views: Record<string, AssistantFlowView> = {
  order: {
    ...base,
    status: "OPEN",
    step: "PICK_ORDER",
    orders: [
      {
        orderId: ORDER,
        orderNumber: NUMBER,
        placedAt: "2026-11-20T10:00:00.000Z",
        itemCount: 2,
        statusLabel: "Delivered",
        eligibleUntil: "2026-12-17T20:00:00.000Z",
      },
    ],
  },
  items: {
    ...base,
    status: "OPEN",
    step: "PICK_ITEMS",
    lines: [
      { orderLineId: LINE, productName: "Private Oud", variantName: null, imageUrl: null, isGift: false, returnableQty: 2, blockedReason: null, selectedQty: 0 },
    ],
  },
  reason: { ...base, status: "OPEN", step: "PICK_REASON", reasons: ["WRONG_ITEM", "OTHER"], reasonCode: null, reasonDetail: null },
  review: {
    ...base,
    status: "REVIEWING",
    step: "REVIEW",
    review: {
      orderNumber: NUMBER,
      currencyCode: "AED",
      eligibleUntil: "2026-12-17T20:00:00.000Z",
      withinPolicyWindow: true,
      lines: [{ orderLineId: LINE, productName: "Private Oud", variantName: null, quantity: 1 }],
      reasonCode: "WRONG_ITEM",
      reasonDetail: null,
      estimate: estimate("100.00"),
      blocked: null,
      reviewToken: "tok-1",
      changed: false,
    },
  },
  done: {
    ...base,
    status: "CONFIRMED",
    step: "DONE",
    result: { requestNumber: "RET-77", status: "REQUESTED", statusMessage: "We have your request." },
  },
};

function setup(api: Partial<AssistantReturnFlowApi> = {}) {
  const flow: AssistantReturnFlowApi = {
    start: vi.fn(async () => views.order),
    active: vi.fn(async () => null),
    step: vi.fn(async (_s, _id, action) =>
      action.type === "PICK_ORDER" ? views.items : action.type === "PICK_ITEMS" ? views.reason : views.review,
    ),
    confirm: vi.fn(async () => views.done),
    cancel: vi.fn(async () => ({ ...views.order, status: "CANCELLED", refusal: { code: "CLOSED" } }) as AssistantFlowView),
    ...api,
  };
  const history: AssistantHistory = { signedIn: true, conversationId: "conv-1", messages: [] };
  render(
    <AssistantWidget
      zoneCode="UAE"
      locale="en"
      send={vi.fn(async () => offer)}
      loadHistory={async () => history}
      clearHistory={async () => undefined}
      addToBag={vi.fn(async () => true)}
      handoff={vi.fn(async () => ({ ticketNumber: "TKT-1" }))}
      returnFlow={flow}
    />,
  );
  return { flow, user: userEvent.setup() };
}

const open = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole("button", { name: /chat with our shopping assistant/i }));
  await screen.findByRole("dialog", { name: "Fragrance Concierge" });
};

const startFromChat = async (user: ReturnType<typeof userEvent.setup>) => {
  await open(user);
  await user.type(await screen.findByLabelText("Your message"), "Can I return my order?");
  await user.click(screen.getByRole("button", { name: "Send" }));
  await user.click(await screen.findByRole("button", { name: "Return items" }));
};

describe("AssistantWidget: a return in the chat", () => {
  it("walks from the order to the review and sends only after the customer confirms", async () => {
    const { flow, user } = setup();
    await startFromChat(user);

    await user.click(await screen.findByRole("button", { name: new RegExp(NUMBER) }));
    expect(flow.step).toHaveBeenCalledWith({ zoneCode: "UAE", locale: "en" }, "f1", { type: "PICK_ORDER", orderId: ORDER });

    // Continue stays disabled until at least one unit is chosen.
    const next = await screen.findByRole("button", { name: "Continue" });
    expect(next).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "One more" }));
    await user.click(next);
    expect(flow.step).toHaveBeenLastCalledWith(expect.anything(), "f1", {
      type: "PICK_ITEMS",
      items: [{ orderLineId: LINE, quantity: 1 }],
    });

    const reviewButton = await screen.findByRole("button", { name: "Review" });
    expect(reviewButton).toBeDisabled();
    await user.click(screen.getByLabelText("Wrong item received"));
    await user.click(reviewButton);

    const panel = (await screen.findByText("Please check your return")).closest("[data-assistant-flow]") as HTMLElement;
    expect(within(panel).getAllByText(/AED 100\.00/).length).toBeGreaterThan(0);
    // The warnings are on the screen, and nothing is sent until they are accepted.
    expect(within(panel).getByText("Before you send")).toBeInTheDocument();
    const send = within(panel).getByRole("button", { name: "Send return request" });
    expect(send).toBeDisabled();
    expect(flow.confirm).not.toHaveBeenCalled();
    await user.click(within(panel).getByRole("checkbox"));
    await user.click(send);
    expect(flow.confirm).toHaveBeenCalledWith(expect.anything(), "f1", "tok-1");

    expect(await screen.findByText("Your return request has been sent.")).toBeInTheDocument();
    expect(screen.getByText("RET-77")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View my requests" })).toHaveAttribute("href", "/account/returns");
  });

  it("shows a neutral sentence when the server refuses, and never the real reason", async () => {
    const { user } = setup({
      start: vi.fn(async () => ({ ...views.order, flowId: null, status: "REFUSED", refusal: { code: "CARE_NEEDED" } }) as AssistantFlowView),
    });
    await startFromChat(user);
    expect(await screen.findByText(/cannot continue this return in the chat/i)).toBeInTheDocument();
    expect(screen.queryByText(/risk/i)).not.toBeInTheDocument();
  });

  it("lets the customer stop, and tell them it was stopped", async () => {
    const { flow, user } = setup();
    await startFromChat(user);
    await user.click(await screen.findByRole("button", { name: "Stop" }));
    expect(flow.cancel).toHaveBeenCalledTimes(1);
    expect(await screen.findByText(/return was stopped/i)).toBeInTheDocument();
  });

  it("says so, and can try again, when a request fails", async () => {
    const step = vi.fn().mockRejectedValueOnce(new Error("network")).mockResolvedValue(views.items);
    const { user } = setup({ step });
    await startFromChat(user);
    await user.click(await screen.findByRole("button", { name: new RegExp(NUMBER) }));
    expect(await screen.findByRole("alert")).toHaveTextContent("That did not work. Please try again.");
    await user.click(screen.getByRole("button", { name: new RegExp(NUMBER) }));
    expect(await screen.findByRole("button", { name: "Continue" })).toBeInTheDocument();
  });

  it("shows a changed amount again, with a notice, and keeps the send button off until it is accepted again", async () => {
    const changed: AssistantFlowView = {
      ...views.review,
      review: { ...(views.review.review as NonNullable<AssistantFlowView["review"]>), changed: true, reviewToken: "tok-2", estimate: estimate("80.00") },
    };
    const { flow, user } = setup({ active: vi.fn(async () => views.review), confirm: vi.fn(async () => changed) });
    await open(user);
    const first = await screen.findByText("Please check your return");
    await user.click(within(first.closest("[data-assistant-flow]") as HTMLElement).getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Send return request" }));
    expect(flow.confirm).toHaveBeenCalledWith(expect.anything(), "f1", "tok-1");
    expect(await screen.findByText(/Something changed since you last looked/)).toBeInTheDocument();
    expect(screen.getByText(/AED 80\.00/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send return request" })).toBeDisabled();
  });

  it("picks up a return the customer left unfinished", async () => {
    const { user } = setup({ active: vi.fn(async () => views.items) });
    await open(user);
    expect(await screen.findByText("Which items, and how many?")).toBeInTheDocument();
  });
});

const exchangeEstimate = (direction: "EVEN" | "CUSTOMER_OWES" | "REFUND_DUE", payable: string, refundable: string, stockOk = true) =>
  ({
    orderId: ORDER,
    orderNumber: NUMBER,
    currencyCode: "AED",
    isEstimate: true,
    reasonCode: "WRONG_VARIANT",
    direction,
    lines: [],
    replacementDelivery: { amount: "0.00", waived: true },
    offerAdjustmentAmount: "0.00",
    customerPayableAmount: payable,
    refundableDifferenceAmount: refundable,
    stockOk,
    unavailableSkus: [],
  }) as never;

const swap = {
  sku: "SKU-B",
  productName: "Private Oud",
  variantName: "100 ml",
  imageUrl: null,
  sameItem: false,
  unitDifference: { direction: "CUSTOMER_OWES", amount: "40.00" },
} as const;

const exchangeBase = { flowId: "x1", kind: "EXCHANGE", expiresAt: "2026-11-26T14:00:00.000Z" } as const;

const exchangeReview = (
  direction: "EVEN" | "CUSTOMER_OWES" | "REFUND_DUE",
  blocked: "OUT_OF_STOCK" | null = null,
): AssistantFlowView => ({
  ...exchangeBase,
  status: "REVIEWING",
  step: "REVIEW",
  review: {
    orderNumber: NUMBER,
    currencyCode: "AED",
    eligibleUntil: "2026-12-17T20:00:00.000Z",
    withinPolicyWindow: true,
    lines: [{ orderLineId: LINE, productName: "Private Oud", variantName: "50 ml", quantity: 1 }],
    reasonCode: "WRONG_VARIANT",
    reasonDetail: null,
    exchange: {
      estimate: exchangeEstimate(
        direction,
        direction === "CUSTOMER_OWES" ? "40.00" : "0.00",
        direction === "REFUND_DUE" ? "15.00" : "0.00",
        blocked === null,
      ),
      lines: [{ orderLineId: LINE, productName: "Private Oud", variantName: "50 ml", quantity: 1, replacement: swap }],
    },
    blocked,
    reviewToken: "xtok-1",
    changed: false,
  },
});

const exchangeViews: Record<string, AssistantFlowView> = {
  order: { ...views.order, ...exchangeBase },
  items: { ...views.items, ...exchangeBase },
  replacement: {
    ...exchangeBase,
    status: "OPEN",
    step: "PICK_REPLACEMENT",
    replacementLines: [
      {
        orderLineId: LINE,
        productName: "Private Oud",
        variantName: "50 ml",
        quantity: 1,
        currencyCode: "AED",
        sameItemOnly: false,
        unavailableCount: 1,
        selectedSku: null,
        options: [
          { ...swap, sku: "SKU-A", variantName: "50 ml", sameItem: true, unitDifference: { direction: "EVEN", amount: "0.00" } },
          swap,
        ],
      },
    ],
  },
  reason: { ...exchangeBase, status: "OPEN", step: "PICK_REASON", reasons: ["WRONG_VARIANT", "OTHER"], reasonCode: null, reasonDetail: null },
};

const exchangeOffer: AssistantChatResponse = {
  ...offer,
  reply: {
    ...offer.reply,
    afterSales: ordersView({ return: true, exchange: true }),
  },
};

function setupExchange(api: Partial<AssistantReturnFlowApi> = {}) {
  const flow: AssistantReturnFlowApi = {
    start: vi.fn(async () => exchangeViews.order),
    active: vi.fn(async () => null),
    step: vi.fn(async (_s, _id, action) =>
      action.type === "PICK_ORDER"
        ? exchangeViews.items
        : action.type === "PICK_ITEMS"
          ? exchangeViews.replacement
          : action.type === "PICK_REPLACEMENT"
            ? exchangeViews.reason
            : exchangeReview("CUSTOMER_OWES"),
    ),
    confirm: vi.fn(
      async () =>
        ({
          ...exchangeBase,
          status: "CONFIRMED",
          step: "DONE",
          result: { requestNumber: "EX-9", status: "REQUESTED", statusMessage: "We have your exchange request." },
        }) as AssistantFlowView,
    ),
    cancel: vi.fn(async () => ({ ...exchangeViews.order, status: "CANCELLED", refusal: { code: "CLOSED" } }) as AssistantFlowView),
    ...api,
  };
  const history: AssistantHistory = { signedIn: true, conversationId: "conv-1", messages: [] };
  render(
    <AssistantWidget
      zoneCode="UAE"
      locale="en"
      send={vi.fn(async () => exchangeOffer)}
      loadHistory={async () => history}
      clearHistory={async () => undefined}
      addToBag={vi.fn(async () => true)}
      handoff={vi.fn(async () => ({ ticketNumber: "TKT-1" }))}
      returnFlow={flow}
    />,
  );
  return { flow, user: userEvent.setup() };
}

describe("AssistantWidget: an exchange in the chat", () => {
  const ask = async (user: ReturnType<typeof userEvent.setup>) => {
    await open(user);
    await user.type(await screen.findByLabelText("Your message"), "Can I exchange my order?");
    await user.click(screen.getByRole("button", { name: "Send" }));
  };

  it("offers both buttons and starts an exchange, not a return", async () => {
    const { flow, user } = setupExchange();
    await ask(user);
    expect(await screen.findByRole("button", { name: "Return items" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Exchange items" }));
    expect(flow.start).toHaveBeenCalledWith({ zoneCode: "UAE", locale: "en" }, "EXCHANGE", ORDER);
  });

  it("walks through the replacement, shows what the customer pays, and sends only after they confirm", async () => {
    const { flow, user } = setupExchange();
    await ask(user);
    await user.click(await screen.findByRole("button", { name: "Exchange items" }));
    await user.click(await screen.findByRole("button", { name: new RegExp(NUMBER) }));
    await user.click(await screen.findByRole("button", { name: "One more" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));

    // The replacement step: only offered options, with the money, and a note that some are not shown.
    expect(await screen.findByText("What would you like instead?")).toBeInTheDocument();
    expect(screen.getByText(/Some sizes are not shown/)).toBeInTheDocument();
    expect(screen.getByText(/\+ AED 40\.00 each/)).toBeInTheDocument();
    const cont = screen.getByRole("button", { name: "Continue" });
    expect(cont).toBeDisabled();
    await user.click(screen.getByLabelText(/100 ml/));
    await user.click(cont);
    expect(flow.step).toHaveBeenLastCalledWith(expect.anything(), "x1", {
      type: "PICK_REPLACEMENT",
      replacements: [{ orderLineId: LINE, sku: "SKU-B" }],
    });

    await user.click(await screen.findByLabelText("Wrong variant / size"));
    await user.click(screen.getByRole("button", { name: "Review" }));

    const panel = (await screen.findByText("Please check your exchange")).closest("[data-assistant-flow]") as HTMLElement;
    expect(within(panel).getByText("You pay")).toBeInTheDocument();
    expect(within(panel).getByText(/Swap for: 100 ml/)).toBeInTheDocument();
    expect(within(panel).getByText("Nothing is charged now.")).toBeInTheDocument();
    expect(within(panel).getByText(/not reserved until we approve/)).toBeInTheDocument();
    const send = within(panel).getByRole("button", { name: "Send exchange request" });
    expect(send).toBeDisabled();
    await user.click(within(panel).getByRole("checkbox"));
    await user.click(send);
    expect(flow.confirm).toHaveBeenCalledWith(expect.anything(), "x1", "xtok-1");
    expect(await screen.findByText("Your exchange request has been sent.")).toBeInTheDocument();
    expect(screen.getByText("EX-9")).toBeInTheDocument();
  });

  it.each([
    ["REFUND_DUE", "You get back"],
    ["EVEN", "Nothing to pay"],
  ] as const)("says the right thing when the difference is %s", async (direction, label) => {
    const { user } = setupExchange({ active: vi.fn(async () => exchangeReview(direction)) });
    await open(user);
    expect(await screen.findByText(label)).toBeInTheDocument();
  });

  it("never lets a replacement that sold out be sent", async () => {
    const { user } = setupExchange({ active: vi.fn(async () => exchangeReview("CUSTOMER_OWES", "OUT_OF_STOCK")) });
    await open(user);
    const panel = (await screen.findByText("Please check your exchange")).closest("[data-assistant-flow]") as HTMLElement;
    expect(within(panel).getByText(/just sold out/)).toBeInTheDocument();
    await user.click(within(panel).getByRole("checkbox"));
    expect(within(panel).getByRole("button", { name: "Send exchange request" })).toBeDisabled();
  });
});

describe("AssistantWidget: buttons on the order cards", () => {
  const ask = async (user: ReturnType<typeof userEvent.setup>) => {
    await open(user);
    await user.type(await screen.findByLabelText("Your message"), "Can I return my order?");
    await user.click(screen.getByRole("button", { name: "Send" }));
  };

  it("starts the flow for the order whose card was tapped", async () => {
    const { flow, user } = setup();
    await ask(user);
    await user.click(await screen.findByRole("button", { name: "Return items" }));
    expect(flow.start).toHaveBeenCalledWith({ zoneCode: "UAE", locale: "en" }, "RETURN", ORDER);
  });

  it("shows only the button the market and the order allow", async () => {
    const { user } = setup();
    await ask(user);
    expect(await screen.findByRole("button", { name: "Return items" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Exchange items" })).not.toBeInTheDocument();
  });

  it("falls back to the website's form when the chat has returns and exchanges off", async () => {
    const off: AssistantChatResponse = {
      ...offer,
      reply: { ...offer.reply, afterSales: ordersView({ return: false, exchange: false }) },
    };
    const history: AssistantHistory = { signedIn: true, conversationId: "conv-1", messages: [] };
    render(
      <AssistantWidget
        zoneCode="UAE"
        locale="en"
        send={vi.fn(async () => off)}
        loadHistory={async () => history}
        clearHistory={async () => undefined}
        addToBag={vi.fn(async () => true)}
        handoff={vi.fn(async () => ({ ticketNumber: "TKT-1" }))}
        returnFlow={{ start: vi.fn(), active: vi.fn(async () => null), step: vi.fn(), confirm: vi.fn(), cancel: vi.fn() }}
      />,
    );
    const user = userEvent.setup();
    await ask(user);
    expect(await screen.findByRole("link", { name: "Return or exchange items" })).toHaveAttribute(
      "href",
      expect.stringContaining("/return"),
    );
    expect(screen.queryByRole("button", { name: "Return items" })).not.toBeInTheDocument();
  });

  it("lists the order to choose with its state and the last day to ask", async () => {
    const { user } = setup();
    await ask(user);
    await user.click(await screen.findByRole("button", { name: "Return items" }));
    const order = await screen.findByRole("button", { name: new RegExp(NUMBER) });
    expect(order).toBeEnabled();
    expect(within(order).getByText(/Delivered/)).toBeInTheDocument();
    expect(within(order).getByText(/you can ask until/i)).toBeInTheDocument();
  });

  it("shows only orders a return or exchange can be asked for: the server sends no others, and the card list has none greyed out", async () => {
    const { user } = setup();
    await ask(user);
    await user.click(await screen.findByRole("button", { name: "Return items" }));
    await screen.findByRole("button", { name: new RegExp(NUMBER) });
    expect(screen.queryByText(/Cancelled/)).not.toBeInTheDocument();
  });
});

describe("AssistantWidget: the policy button", () => {
  const policyReply = (path: string): AssistantChatResponse => ({
    conversationId: "conv-1",
    lang: "en",
    reply: {
      intent: "RETURNS",
      text: "From our Returns policy: ...",
      cards: [],
      quickReplies: [],
      handoff: false,
      actions: [{ type: "OPEN_PAGE", label: "Read the full policy", path }],
    },
  });
  const run = async (path: string) => {
    const history: AssistantHistory = { signedIn: true, conversationId: "conv-1", messages: [] };
    render(
      <AssistantWidget
        zoneCode="UAE"
        locale="en"
        send={vi.fn(async () => policyReply(path))}
        loadHistory={async () => history}
        clearHistory={async () => undefined}
        addToBag={vi.fn(async () => true)}
        handoff={vi.fn(async () => ({ ticketNumber: "TKT-1" }))}
      />,
    );
    const user = userEvent.setup();
    await open(user);
    await user.type(await screen.findByLabelText("Your message"), "return policy");
    await user.click(screen.getByRole("button", { name: "Send" }));
  };

  it("is a button to our own policy page, not a printed path", async () => {
    await run("/pages/exchange-and-return-policy");
    const link = await screen.findByRole("link", { name: "Read the full policy" });
    expect(link).toHaveAttribute("href", "/pages/exchange-and-return-policy");
    expect(screen.queryByText("/pages/exchange-and-return-policy")).not.toBeInTheDocument();
  });

  it.each(["https://evil.example/x", "javascript:alert(1)", "/account/orders/abc", "//evil.example"])(
    "draws no button for %s",
    async (path) => {
      await run(path);
      await screen.findByText(/From our Returns policy/);
      expect(screen.queryByRole("link", { name: "Read the full policy" })).not.toBeInTheDocument();
    },
  );
});
