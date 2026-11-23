import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AssistantWidget } from "./AssistantWidget";
import type { AssistantChatResponse, AssistantHistory } from "../types";

vi.mock("@/lib/i18n/LocaleLink", () => ({
  LocaleLink: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const card = {
  productId: "p1",
  slug: "oud-malaki",
  name: "Oud Malaki",
  image: null,
  shortDescription: null,
  priceSummary: { price: 250, currencyCode: "AED", hasValidPrice: true },
};

const reply = (
  over: Partial<AssistantChatResponse["reply"]>,
): AssistantChatResponse => ({
  conversationId: null,
  lang: "en",
  reply: {
    intent: "X",
    text: "ok",
    cards: [],
    quickReplies: [],
    handoff: false,
    ...over,
  },
});

function setup(options: {
  signedIn?: boolean;
  send: ReturnType<typeof vi.fn>;
}) {
  const history: AssistantHistory = {
    signedIn: options.signedIn ?? false,
    conversationId: null,
    messages: [],
  };
  const addToBag = vi.fn(async () => true);
  // Typed with its argument so the test can read what the widget sent.
  const handoff = vi.fn(async (_input: unknown) => ({ ticketNumber: "TKT-77" }));
  render(
    <AssistantWidget
      zoneCode="UAE"
      locale="en"
      send={options.send as never}
      loadHistory={async () => history}
      clearHistory={async () => undefined}
      addToBag={addToBag}
      handoff={handoff}
    />,
  );
  return { addToBag, handoff, user: userEvent.setup() };
}

const openChat = (user: ReturnType<typeof userEvent.setup>) =>
  user.click(
    screen.getByRole("button", { name: /chat with our shopping assistant/i }),
  );

const type = async (user: ReturnType<typeof userEvent.setup>, text: string) => {
  await user.type(
    screen.getByRole("textbox", { name: /your message/i }),
    `${text}{enter}`,
  );
};

describe("assistant actions", () => {
  it("a card has its own Add button and shows how much is off", async () => {
    const sale = {
      ...card,
      image: "https://cdn.example.com/oud.webp",
      priceSummary: { price: 50, compareAtPrice: 100, currencyCode: "AED", hasValidPrice: true },
    };
    const send = vi.fn().mockResolvedValue(reply({ text: "Try this.", cards: [sale] }));
    const { addToBag, user } = setup({ send });
    await openChat(user);
    await type(user, "oil");
    await screen.findByText("Oud Malaki");
    expect(screen.getByText("50% off")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Add" }));
    await waitFor(() => expect(addToBag).toHaveBeenCalledTimes(1));
    expect(addToBag).toHaveBeenCalledWith(expect.objectContaining({ slug: "oud-malaki", price: 50 }));
    expect(await screen.findByRole("button", { name: "Added" })).toBeDisabled;
  });

  it("adds to the bag only after the shopper confirms", async () => {
    const send = vi
      .fn()
      .mockResolvedValueOnce(
        reply({ text: "Here are some options.", cards: [card] }),
      )
      .mockResolvedValueOnce(
        reply({
          intent: "ADD_TO_BAG",
          text: "Would you like me to add Oud Malaki (AED 250.00) to your bag?",
          cards: [card],
          actions: [
            {
              type: "ADD_TO_BAG",
              productId: "p1",
              slug: "oud-malaki",
              name: "Oud Malaki",
              confirmLabel: "Yes, add to bag",
              cancelLabel: "No, thanks",
            },
          ],
        }),
      );
    const { addToBag, user } = setup({ send });
    await openChat(user);
    await type(user, "suggest something");
    await screen.findByText("Here are some options.");
    await type(user, "add the first one");
    await screen.findByText(/Would you like me to add Oud Malaki/);
    // The products shown last are sent so "the first one" can be understood.
    expect(send.mock.calls[1][0]).toMatchObject({ recentProductIds: ["p1"] });
    expect(addToBag).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Yes, add to bag" }));
    await waitFor(() =>
      expect(addToBag).toHaveBeenCalledWith(
        expect.objectContaining({ slug: "oud-malaki", price: 250 }),
      ),
    );
    await screen.findByText("Done. I've added it to your bag.");
    expect(
      screen.queryByRole("button", { name: "Yes, add to bag" }),
    ).toBeNull();
  });

  it("adds nothing when the shopper says no", async () => {
    const send = vi.fn().mockResolvedValue(
      reply({
        intent: "ADD_TO_BAG",
        text: "Add it?",
        cards: [card],
        actions: [
          {
            type: "ADD_TO_BAG",
            productId: "p1",
            slug: "oud-malaki",
            name: "Oud Malaki",
            confirmLabel: "Yes",
            cancelLabel: "No",
          },
        ],
      }),
    );
    const { addToBag, user } = setup({ send });
    await openChat(user);
    await type(user, "add it");
    await user.click(await screen.findByRole("button", { name: "No" }));
    await screen.findByText("No problem, I haven't added anything.");
    expect(addToBag).not.toHaveBeenCalled();
  });

  it("guest hand-off asks for an email and attaches the on-screen chat", async () => {
    const send = vi.fn().mockResolvedValue(
      reply({
        intent: "COMPLAINT",
        text: "I'm sorry about that.",
        handoff: true,
        actions: [
          { type: "HANDOFF", label: "Send this chat to customer care" },
        ],
      }),
    );
    const { handoff, user } = setup({ send });
    await openChat(user);
    await type(user, "my perfume arrived damaged");
    await user.click(
      await screen.findByRole("button", {
        name: "Send this chat to customer care",
      }),
    );

    await user.click(
      screen.getByRole("button", { name: "Send to customer care" }),
    );
    await screen.findByText(/valid email address/);
    expect(handoff).not.toHaveBeenCalled();

    await user.type(
      screen.getByRole("textbox", { name: "Email so they can reply" }),
      "guest@example.test",
    );
    await user.click(
      screen.getByRole("button", { name: "Send to customer care" }),
    );
    await screen.findByText(/ticket number is TKT-77/);
    const sent = handoff.mock.calls[0][0] as {
      email: string;
      transcript: Array<{ role: string; text: string }>;
    };
    expect(sent.email).toBe("guest@example.test");
    expect(
      sent.transcript.some(
        (line) => line.role === "user" && line.text.includes("arrived damaged"),
      ),
    ).toBe(true);
  });

  it("signed-in hand-off needs no email and sends no transcript", async () => {
    const send = vi
      .fn()
      .mockResolvedValue(
        reply({
          handoff: true,
          actions: [
            { type: "HANDOFF", label: "Send this chat to customer care" },
          ],
        }),
      );
    const { handoff, user } = setup({ signedIn: true, send });
    await openChat(user);
    await type(user, "I need a person");
    await user.click(
      await screen.findByRole("button", {
        name: "Send this chat to customer care",
      }),
    );
    expect(
      screen.queryByRole("textbox", { name: "Email so they can reply" }),
    ).toBeNull();
    await user.click(
      screen.getByRole("button", { name: "Send to customer care" }),
    );
    await screen.findByText(/ticket number is TKT-77/);
    expect(handoff.mock.calls[0][0]).toMatchObject({
      transcript: undefined,
      email: undefined,
    });
  });
  it("opens when a pop-up button asks for the assistant", async () => {
    const send = vi.fn();
    setup({ send });
    expect(screen.queryByRole("textbox", { name: /your message/i })).toBeNull();
    window.dispatchEvent(new CustomEvent("sa:assistant-open"));
    await screen.findByRole("textbox", { name: /your message/i });
  });
});
