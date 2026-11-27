import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AssistantWidget } from "./AssistantWidget";
import type { AssistantReturnFlowApi } from "../api/assistant.service";
import type { AssistantFlowView, AssistantHistory } from "../types";

vi.mock("@/lib/i18n/LocaleLink", () => ({
  LocaleLink: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const items: AssistantFlowView = {
  flowId: "g1",
  kind: "RETURN",
  status: "OPEN",
  step: "PICK_ITEMS",
  expiresAt: "2026-11-26T14:00:00.000Z",
  guest: true,
  lines: [],
};
const notFound: AssistantFlowView = {
  flowId: null,
  kind: "RETURN",
  status: "CANCELLED",
  step: "PICK_ORDER",
  expiresAt: "2026-11-26T14:00:00.000Z",
  refusal: { code: "GUEST_ORDER_NOT_FOUND" },
};

function setup(start: AssistantReturnFlowApi["start"]) {
  const flow: AssistantReturnFlowApi = {
    start,
    active: vi.fn(async () => null),
    step: vi.fn(async () => items),
    confirm: vi.fn(async () => items),
    cancel: vi.fn(async () => items),
  };
  const history: AssistantHistory = { signedIn: false, conversationId: null, messages: [], saved: true, retentionDays: 30 };
  render(
    <AssistantWidget
      zoneCode="UAE"
      locale="en"
      send={vi.fn()}
      loadHistory={async () => history}
      clearHistory={async () => undefined}
      addToBag={vi.fn(async () => true)}
      handoff={vi.fn()}
      returnFlow={flow}
    />,
  );
  return { flow, user: userEvent.setup() };
}

async function openForm(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /chat with our shopping assistant/i }));
  await user.click(await screen.findByRole("button", { name: "Return or exchange an order" }));
}

describe("a guest's return in the chat", () => {
  it("proves the order by number and code, and starts the request with them", async () => {
    const start = vi.fn(async () => items);
    const { user } = setup(start);
    await openForm(user);
    await user.type(screen.getByLabelText("Order number"), "UAE-ABC-123");
    await user.type(screen.getByLabelText("Code from your email"), "secret-code");
    await user.click(screen.getByRole("radio", { name: "Exchange" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(start).toHaveBeenCalledWith(
      { zoneCode: "UAE", locale: "en", orderNumber: "UAE-ABC-123", code: "secret-code" },
      "EXCHANGE",
    );
    await waitFor(() => expect(document.querySelector("[data-assistant-flow]")).not.toBeNull());
  });

  it("needs both fields before it continues", async () => {
    const { user } = setup(vi.fn(async () => items));
    await openForm(user);
    await user.type(screen.getByLabelText("Order number"), "UAE-ABC-123");
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  });

  it("says one neutral thing when the order or code is wrong", async () => {
    const { user } = setup(vi.fn(async () => notFound));
    await openForm(user);
    await user.type(screen.getByLabelText("Order number"), "UAE-NOPE");
    await user.type(screen.getByLabelText("Code from your email"), "wrong");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(await screen.findByText(/could not find an order with that number and code/i)).toBeInTheDocument();
  });

  it("sends the code with each step and offers no way back at the items", async () => {
    const start = vi.fn(async () => items);
    const { flow, user } = setup(start);
    await openForm(user);
    await user.type(screen.getByLabelText("Order number"), "UAE-ABC-123");
    await user.type(screen.getByLabelText("Code from your email"), "secret-code");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await waitFor(() => expect(document.querySelector("[data-assistant-flow]")).not.toBeNull());
    expect(screen.queryByRole("button", { name: /back/i })).toBeNull();
    await user.click(screen.getByRole("button", { name: /stop/i }));
    expect(flow.cancel).toHaveBeenCalledWith(expect.objectContaining({ code: "secret-code" }), "g1");
  });
});
