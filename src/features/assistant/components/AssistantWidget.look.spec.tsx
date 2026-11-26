import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
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

const answer: AssistantChatResponse = {
  conversationId: null,
  lang: "en",
  reply: { intent: "CONTACT", text: "Here is how to reach us.", cards: [], quickReplies: [], handoff: false },
};

function setup(send = vi.fn(async () => answer)) {
  const history: AssistantHistory = { signedIn: false, conversationId: null, messages: [] };
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
  return { send, user: userEvent.setup() };
}

const open = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole("button", { name: /chat with our shopping assistant/i }));
  return screen.findByRole("dialog", { name: "Fragrance Concierge" });
};

describe("AssistantWidget: how it looks", () => {
  it("shows it is online in the header, and says under the input that it is an AI assistant", async () => {
    const { user } = setup();
    const panel = await open(user);
    expect(within(panel).getByText("Online")).toBeInTheDocument();
    expect(within(panel).getByText(/AI assistant\. It can make mistakes/)).toBeInTheDocument();
    // A face for the assistant (never a person's photo), with the online dot, in the header.
    expect(panel.querySelector("header [data-assistant-avatar]")).not.toBeNull();
    expect(panel.querySelector("header [data-assistant-online]")).not.toBeNull();
  });

  it("greets with the suggestions as tiles the shopper can tap", async () => {
    const { send, user } = setup();
    const panel = await open(user);
    const tiles = await within(panel).findByText("Track my order");
    expect(tiles.closest("[data-assistant-suggestions]")).not.toBeNull();
    await user.click(tiles);
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ message: "Track my order" }));
  });

  it("keeps customer care one tap away", async () => {
    const { send, user } = setup();
    const panel = await open(user);
    await user.click(await within(panel).findByRole("button", { name: "Customer care" }));
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ message: "Talk to customer care" }));
  });

  it("gives each assistant message a face, but not the shopper's own", async () => {
    const { user } = setup();
    const panel = await open(user);
    await user.type(await within(panel).findByLabelText("Your message"), "hello");
    await user.click(within(panel).getByRole("button", { name: "Send" }));
    await within(panel).findByText("Here is how to reach us.");
    const rows = [...panel.querySelectorAll("[data-bubble]")];
    const faceOf = (bubble: Element) => bubble.parentElement?.parentElement?.querySelector("[data-assistant-avatar]");
    expect(rows.filter((b) => b.getAttribute("data-bubble") === "user").every((b) => !faceOf(b))).toBe(true);
    expect(rows.filter((b) => b.getAttribute("data-bubble") === "assistant").every((b) => Boolean(faceOf(b)))).toBe(true);
  });
});
