import { apiDelete, apiGet, apiPost } from "@/lib/api/apiClient";
import { guestHeaders, rememberGuestId } from "./assistantGuest";
import type { AssistantChatResponse, AssistantFlowAction, AssistantFlowView, AssistantHistory } from "../types";

export type AssistantSendInput = {
  message: string;
  zoneCode: string;
  locale: string;
  /** Ids of the products shown last, so "the first one" and "it" can be understood. Checked server-side. */
  recentProductIds?: string[];
};

export type AssistantHandoffInput = {
  zoneCode: string;
  locale: string;
  note?: string;
  /** Guests only. */
  name?: string;
  email?: string;
  phone?: string;
  /** Guests only: their on-screen chat (a signed-in customer's saved chat is used instead). */
  transcript?: Array<{ role: "user" | "assistant"; text: string }>;
};

/**
 * Whether the assistant is switched on for this brand and market (admin: Settings → Shopping
 * assistant). Any failure means "no".
 */
export async function fetchAssistantEnabled(zoneCode: string): Promise<boolean> {
  try {
    const params = new URLSearchParams({ zoneCode });
    const data = await apiGet<{ enabled?: boolean }>(`/storefront/assistant/status?${params}`);
    return data.enabled === true;
  } catch {
    return false;
  }
}

/**
 * Sends one message. The brand comes from the storefront host and the customer from the login
 * token the API client attaches; neither is sent in the body. A guest is known by a random chat key
 * kept in this browser (header), so their chat is saved for a limited time.
 */
export async function sendAssistantMessage(input: AssistantSendInput): Promise<AssistantChatResponse> {
  const result = await apiPost<AssistantChatResponse>(
    "/storefront/assistant/chat",
    {
      message: input.message,
      zoneCode: input.zoneCode,
      locale: input.locale,
      ...(input.recentProductIds?.length ? { recentProductIds: input.recentProductIds } : {}),
    },
    { headers: guestHeaders() },
  );
  rememberGuestId(result.guestId);
  return result;
}

/** Sends the chat to customer care as a support ticket. */
export async function sendAssistantHandoff(input: AssistantHandoffInput): Promise<{ ticketNumber: string }> {
  return apiPost<{ ticketNumber: string }>("/storefront/assistant/handoff", input, { headers: guestHeaders() });
}

/** The earlier chat of the signed-in customer, or of this browser's guest chat key. */
export async function fetchAssistantHistory(zoneCode: string): Promise<AssistantHistory> {
  const params = new URLSearchParams({ zoneCode });
  return apiGet<AssistantHistory>(`/storefront/assistant/history?${params}`, { headers: guestHeaders() });
}

/** Clears the saved chat (the customer's, or this browser's guest chat). */
export async function clearAssistantHistory(zoneCode: string): Promise<void> {
  const params = new URLSearchParams({ zoneCode });
  await apiDelete(`/storefront/assistant/history?${params}`, { headers: guestHeaders() });
}

/**
 * A return the signed-in customer works through in the chat. The server holds the whole flow: only its
 * id travels, and every choice is checked there against what it offered.
 */
export type AssistantReturnFlowApi = {
  start: (scope: AssistantFlowScope, kind?: "RETURN" | "EXCHANGE", orderId?: string) => Promise<AssistantFlowView>;
  active: (scope: AssistantFlowScope) => Promise<AssistantFlowView | null>;
  step: (scope: AssistantFlowScope, flowId: string, action: AssistantFlowAction) => Promise<AssistantFlowView>;
  confirm: (scope: AssistantFlowScope, flowId: string, reviewToken: string) => Promise<AssistantFlowView>;
  cancel: (scope: AssistantFlowScope, flowId: string) => Promise<AssistantFlowView>;
};

/**
 * A guest also sends the code from their confirmation email with every request (never stored by the
 * server), and their order number when they start.
 */
export type AssistantFlowScope = { zoneCode: string; locale: string; code?: string; orderNumber?: string };

const FLOW = "/storefront/assistant/after-sales";

export const assistantReturnFlowApi: AssistantReturnFlowApi = {
  start: async (scope, kind = "RETURN", orderId) => {
    const view = await apiPost<AssistantFlowView & { guestId?: string }>(
      `${FLOW}/start`,
      { ...scope, kind, ...(orderId ? { orderId } : {}) },
      { headers: guestHeaders() },
    );
    rememberGuestId(view.guestId);
    return view;
  },
  active: async (scope) => {
    const params = new URLSearchParams({ zoneCode: scope.zoneCode, locale: scope.locale });
    const data = await apiGet<{ flow: AssistantFlowView | null }>(`${FLOW}/active?${params}`, { headers: guestHeaders() });
    return data.flow;
  },
  step: (scope, flowId, action) =>
    apiPost<AssistantFlowView>(`${FLOW}/${flowId}/step`, { ...scope, ...action }, { headers: guestHeaders() }),
  confirm: (scope, flowId, reviewToken) =>
    apiPost<AssistantFlowView>(`${FLOW}/${flowId}/confirm`, { ...scope, reviewToken }, { headers: guestHeaders() }),
  cancel: (scope, flowId) => apiPost<AssistantFlowView>(`${FLOW}/${flowId}/cancel`, scope, { headers: guestHeaders() }),
};
