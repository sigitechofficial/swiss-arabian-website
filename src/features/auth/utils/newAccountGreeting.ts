/**
 * Remembers, for this browser tab, which account was just created so the
 * dashboard can say "Welcome" instead of "Welcome back" on that first visit.
 * Keyed by email so signing in as someone else in the same tab is not affected.
 */
import { englishTranslator, type Translator } from "@/lib/i18n/messages";

const KEY = "sa-new-account";

export function markNewAccount(email: string) {
  const value = email.trim().toLowerCase();
  if (!value || typeof window === "undefined") return;
  try {
    sessionStorage.setItem(KEY, value);
  } catch {
    // Storage blocked: the dashboard falls back to "Welcome back".
  }
}

export function isNewAccount(email: string | null | undefined): boolean {
  const value = email?.trim().toLowerCase();
  if (!value || typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(KEY) === value;
  } catch {
    return false;
  }
}

/** Signing out ends the first visit: the next sign-in is a return. */
export function clearNewAccount() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // Nothing to clear.
  }
}

export function welcomeHeading(firstName: string, isNew: boolean, t: Translator = englishTranslator): string {
  if (firstName) return t(isNew ? "account.welcomeName" : "account.welcomeBackName", { name: firstName });
  return t(isNew ? "account.welcome" : "account.welcomeBack");
}
