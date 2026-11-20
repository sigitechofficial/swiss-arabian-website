/** A product the assistant suggests. Same fields the shop's own product cards use. */
export type AssistantCard = {
  productId: string;
  slug: string | null;
  name: string;
  image: string | null;
  shortDescription: string | null;
  priceSummary: {
    price: number | string | null;
    compareAtPrice?: number | string | null;
    currencyCode?: string | null;
    hasValidPrice?: boolean;
  } | null;
};

/**
 * Something the shopper can confirm with a tap. The assistant only proposes: adding to the bag runs
 * through the shop's normal cart in this browser, and the hand-off creates a support ticket.
 */
export type AssistantAction =
  | {
      type: "ADD_TO_BAG";
      productId: string;
      slug: string | null;
      name: string;
      confirmLabel: string;
      cancelLabel: string;
    }
  | { type: "HANDOFF"; label: string };

export type AssistantReply = {
  intent: string;
  text: string;
  cards: AssistantCard[];
  quickReplies: string[];
  /** A person at customer care should follow up. */
  handoff: boolean;
  actions?: AssistantAction[];
};

export type AssistantChatResponse = {
  /** Null for guests: their chat is never saved. */
  conversationId: string | null;
  /** The language of the reply: "en", "ar", "ur", "fr", or another language code when it was translated. */
  lang: string;
  reply: AssistantReply;
};

/** What a signed-in customer sees when they open the chat again. */
export type AssistantHistory = {
  signedIn: boolean;
  conversationId: string | null;
  messages: Array<{ role: "user" | "assistant"; text: string; at: string }>;
};

/** One bubble in the chat window. */
export type AssistantBubble = {
  id: string;
  role: "user" | "assistant";
  text: string;
  cards?: AssistantCard[];
  quickReplies?: string[];
  actions?: AssistantAction[];
  /** The shopper has answered the actions of this bubble (confirmed, cancelled or sent). */
  actionsDone?: boolean;
  /** Shown in an error colour, for failures the shopper can retry. */
  isError?: boolean;
};
