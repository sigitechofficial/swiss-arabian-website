import { apiDelete, apiGet, apiPost } from "@/lib/api/apiClient";
import type { AssistantChatResponse, AssistantHistory } from "../types";

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

/** Whether the backend has the assistant switched on for this brand. Any failure means "no". */
export async function fetchAssistantEnabled(): Promise<boolean> {
  try {
    const data = await apiGet<{ enabled?: boolean }>("/storefront/assistant/status");
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
