/**
 * A guest's chat key: a random id made by the server the first time a guest chats, kept in this browser
 * only, and sent with every assistant request so their saved chat (and a return they start) is found again.
 * The server stores only a one-way hash of it. It is not a login and not tied to an order.
 */
const KEY = "sa-assistant-guest";

export const ASSISTANT_GUEST_HEADER = "x-assistant-guest";

export function readGuestId(): string | null {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function rememberGuestId(id: string | null | undefined): void {
  if (!id) return;
  try {
    window.localStorage.setItem(KEY, id);
  } catch {
    /* the chat still works; it just is not found again next visit */
  }
}

export function forgetGuestId(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* nothing to forget */
  }
}

/** Request headers that carry the guest's chat key, when there is one. */
export function guestHeaders(): Record<string, string> {
  const id = typeof window === "undefined" ? null : readGuestId();
  return id ? { [ASSISTANT_GUEST_HEADER]: id } : {};
}
