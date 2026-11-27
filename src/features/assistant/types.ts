import type { ExchangeEstimate, ReturnEstimate } from "@/features/afterSales/types/afterSales";

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
  | { type: "HANDOFF"; label: string }
  /** A button to one of the shop's own pages (the full policy). The path is checked again before it is drawn. */
  | { type: "OPEN_PAGE"; label: string; path: string };

/** Whether a return (or an exchange) can be asked for one order, and if not, why. */
export type AssistantAfterSalesOption = {
  allowed: boolean;
  /** The reason code when it cannot (RETURN_WINDOW_CLOSED, AFTER_SALES_NOT_DELIVERED_YET, …). */
  code: string | null;
  /** The last day to ask (ISO date and time), when there is one. */
  eligibleUntil: string | null;
  /** The backend's English sentence: shown only for a code the website has no wording for. */
  message: string | null;
};

/** One of the signed-in customer's own orders in this market. */
export type AssistantAfterSalesOrder = {
  /** The customer's own order id: opens their own order page. */
  orderId: string;
  orderNumber: string;
  placedAt: string;
  itemCount: number;
  /** The order's state in the chat's language ("Delivered"). */
  statusLabel: string;
  returns: AssistantAfterSalesOption;
  exchanges: AssistantAfterSalesOption;
  /** What the customer may start from this card in the chat (what the order allows and the market has on). */
  chat?: { return: boolean; exchange: boolean };
};

/** One of the customer's own return or exchange requests in this market. */
export type AssistantAfterSalesRequest = {
  kind: "RETURN" | "EXCHANGE";
  id: string;
  /** The return or exchange number the customer sees in their email. */
  number: string;
  orderNumber: string | null;
  orderId: string | null;
  status: string;
  /** One sentence in the chat's language about where the request is now. */
  statusMessage: string;
  createdAt: string;
  unitCount: number;
};

/** The customer's own orders or requests, drawn as cards under the reply. Data only. */
export type AssistantAfterSalesView =
  | { kind: "ORDERS"; orders: AssistantAfterSalesOrder[] }
  | { kind: "REQUESTS"; requests: AssistantAfterSalesRequest[] };

export type AssistantReply = {
  intent: string;
  text: string;
  cards: AssistantCard[];
  /** Only for a signed-in customer: their own orders or requests. */
  afterSales?: AssistantAfterSalesView;
  quickReplies: string[];
  /** A person at customer care should follow up. */
  handoff: boolean;
  actions?: AssistantAction[];
  /** A shop page that lists every product of the group the cards come from. */
  seeAllHref?: string;
};

export type AssistantChatResponse = {
  /** A guest's chat is saved too (under a chat key kept in their browser). */
  conversationId: string | null;
  /** Only the first time a guest chats: the chat key to keep in this browser. */
  guestId?: string;
  /** The language of the reply: "en", "ar", "ur", "fr", or another language code when it was translated. */
  lang: string;
  reply: AssistantReply;
};

/** What a signed-in customer sees when they open the chat again. */
export type AssistantHistory = {
  signedIn: boolean;
  conversationId: string | null;
  messages: Array<{ role: "user" | "assistant"; text: string; at: string }>;
  /** Whether this chat is saved (a customer's, or a guest's under their chat key). */
  saved?: boolean;
  /** How many days a guest's chat is kept (the admin sets it). */
  retentionDays?: number;
};

/** One bubble in the chat window. */
export type AssistantBubble = {
  id: string;
  /** The greeting: its suggestions are drawn as tiles. */
  welcome?: boolean;
  role: "user" | "assistant";
  text: string;
  cards?: AssistantCard[];
  afterSales?: AssistantAfterSalesView;
  seeAllHref?: string;
  quickReplies?: string[];
  actions?: AssistantAction[];
  /** The shopper has answered the actions of this bubble (confirmed, cancelled or sent). */
  actionsDone?: boolean;
  /** Shown in an error colour, for failures the shopper can retry. */
  isError?: boolean;
};

/** Where a return the customer works through in the chat stands. The server holds it; this is what to draw. */
export type AssistantFlowStep = "PICK_ORDER" | "PICK_ITEMS" | "PICK_REPLACEMENT" | "PICK_REASON" | "REVIEW" | "DONE";
export type AssistantFlowStatus = "OPEN" | "REVIEWING" | "SENDING" | "CONFIRMED" | "CANCELLED" | "EXPIRED" | "REFUSED";

export type AssistantFlowOrderChoice = {
  orderId: string;
  orderNumber: string;
  placedAt: string;
  itemCount: number;
  /** The order's state in the chat's language ("Delivered"). */
  statusLabel: string;
  eligibleUntil: string | null;
};

export type AssistantFlowLineChoice = {
  orderLineId: string;
  productName: string | null;
  variantName: string | null;
  imageUrl: string | null;
  isGift: boolean;
  returnableQty: number;
  /** Why this line cannot be returned (the website's own code), or null. */
  blockedReason: string | null;
  selectedQty: number;
};

/** What one unit of a replacement adds or gives back (always positive; the direction says who pays). */
export type AssistantFlowUnitDifference = { direction: "EVEN" | "CUSTOMER_OWES" | "REFUND_DUE"; amount: string };

/** One thing an item can be swapped for. The server never offers one that is out of stock or has no price. */
export type AssistantFlowReplacementOption = {
  sku: string;
  productName: string | null;
  variantName: string | null;
  imageUrl: string | null;
  sameItem: boolean;
  unitDifference: AssistantFlowUnitDifference;
};

export type AssistantFlowReplacementLine = {
  orderLineId: string;
  productName: string | null;
  variantName: string | null;
  quantity: number;
  currencyCode: string;
  sameItemOnly: boolean;
  options: AssistantFlowReplacementOption[];
  /** How many replacements exist but are left out (sold out, no price today). */
  unavailableCount: number;
  selectedSku: string | null;
};

export type AssistantFlowExchangeReview = {
  /** The website's own difference estimate (same math as the approval). */
  estimate: ExchangeEstimate;
  lines: Array<{
    orderLineId: string;
    productName: string | null;
    variantName: string | null;
    quantity: number;
    replacement: AssistantFlowReplacementOption;
  }>;
};

export type AssistantFlowReview = {
  orderNumber: string | null;
  currencyCode: string;
  eligibleUntil: string | null;
  withinPolicyWindow: boolean;
  lines: Array<{ orderLineId: string; productName: string | null; variantName: string | null; quantity: number }>;
  reasonCode: string;
  reasonDetail: string | null;
  /** The same refund estimate the return form shows. */
  /** Returns: the refund estimate the return form shows. */
  estimate?: ReturnEstimate;
  /** Exchanges: what each item is swapped for and who pays what. */
  exchange?: AssistantFlowExchangeReview;
  blocked: "GIFT_REQUIRED" | "OUT_OF_STOCK" | null;
  reviewToken: string;
  /** The amounts or choices changed since the customer last saw them: they must look again. */
  changed: boolean;
};

export type AssistantFlowView = {
  flowId: string | null;
  kind: "RETURN" | "EXCHANGE";
  status: AssistantFlowStatus;
  step: AssistantFlowStep;
  expiresAt: string;
  orders?: AssistantFlowOrderChoice[];
  lines?: AssistantFlowLineChoice[];
  replacementLines?: AssistantFlowReplacementLine[];
  reasons?: string[];
  reasonCode?: string | null;
  reasonDetail?: string | null;
  review?: AssistantFlowReview;
  result?: { requestNumber: string; status: string; statusMessage: string };
  refusal?: { code: string };
  /** A guest's request: the order was proved by number and code; there is no order list and no way back to one. */
  guest?: boolean;
};

export type AssistantFlowAction =
  | { type: "PICK_ORDER"; orderId: string }
  | { type: "PICK_ITEMS"; items: Array<{ orderLineId: string; quantity: number }> }
  | { type: "PICK_REPLACEMENT"; replacements: Array<{ orderLineId: string; sku: string }> }
  | { type: "PICK_REASON"; reasonCode: string; detail?: string }
  | { type: "BACK" };
