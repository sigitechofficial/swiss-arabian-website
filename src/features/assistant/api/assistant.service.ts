import { apiDelete, apiGet, apiPost } from "@/lib/api/apiClient";
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
 * token the API client attaches; neither is sent in the body. Nothing identifies a guest: their
 * chat is not saved on the server.
 */
export async function sendAssistantMessage(input: AssistantSendInput): Promise<AssistantChatResponse> {
  return apiPost<AssistantChatResponse>("/storefront/assistant/chat", {
    message: input.message,
    zoneCode: input.zoneCode,
    locale: input.locale,
    ...(input.recentProductIds?.length ? { recentProductIds: input.recentProductIds } : {}),
  });
}

/** Sends the chat to customer care as a support ticket. */
export async function sendAssistantHandoff(input: AssistantHandoffInput): Promise<{ ticketNumber: string }> {
  return apiPost<{ ticketNumber: string }>("/storefront/assistant/handoff", input);
}

/** The signed-in customer's earlier chat. Guests get an empty list: their chat is never saved. */
export async function fetchAssistantHistory(zoneCode: string): Promise<AssistantHistory> {
  const params = new URLSearchParams({ zoneCode });
  return apiGet<AssistantHistory>(`/storefront/assistant/history?${params}`);
}

/** Clears the signed-in customer's saved chat. */
export async function clearAssistantHistory(zoneCode: string): Promise<void> {
  const params = new URLSearchParams({ zoneCode });
  await apiDelete(`/storefront/assistant/history?${params}`);
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

export type AssistantFlowScope = { zoneCode: string; locale: string };

const FLOW = "/storefront/assistant/after-sales";

export const assistantReturnFlowApi: AssistantReturnFlowApi = {
  start: (scope, kind = "RETURN", orderId) =>
    apiPost<AssistantFlowView>(`${FLOW}/start`, { ...scope, kind, ...(orderId ? { orderId } : {}) }),
  active: async (scope) => {
    const params = new URLSearchParams(scope);
    const data = await apiGet<{ flow: AssistantFlowView | null }>(`${FLOW}/active?${params}`);
    return data.flow;
  },
  step: (scope, flowId, action) => apiPost<AssistantFlowView>(`${FLOW}/${flowId}/step`, { ...scope, ...action }),
  confirm: (scope, flowId, reviewToken) =>
    apiPost<AssistantFlowView>(`${FLOW}/${flowId}/confirm`, { ...scope, reviewToken }),
  cancel: (scope, flowId) => apiPost<AssistantFlowView>(`${FLOW}/${flowId}/cancel`, scope),
};
