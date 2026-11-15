import { createHmac, timingSafeEqual } from "node:crypto";

/** Calls older or newer than this are refused (replay protection). */
export const SITE_REFRESH_MAX_SKEW_SECONDS = 300;
const MIN_SECRET_LENGTH = 32;
const HOST = /^[a-z0-9.-]+\.[a-z]{2,}$/;
const MAX_HOSTS = 500;

export type SiteRefreshCheck =
  | { ok: true; hosts: string[] }
  | { ok: false; status: 400 | 401 | 503; message: string };

/** `v1=<hex HMAC-SHA256 of "<timestamp>.<body>">`, as the backend signs it. */
export function siteRefreshSignature(secret: string, timestamp: string, body: string): string {
  return `v1=${createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex")}`;
}

/**
 * Checks a refresh call from the backend (ADR-005 phase E): signed with the
 * shared secret, recent, and naming plain website addresses. Never trusts the
 * body before the signature matches.
 */
export function checkSiteRefresh(input: {
  secret: string | undefined;
  timestamp: string | null;
  signature: string | null;
  body: string;
  nowSeconds: number;
}): SiteRefreshCheck {
  const secret = input.secret?.trim() ?? "";
  if (secret.length < MIN_SECRET_LENGTH) {
    return { ok: false, status: 503, message: "Refresh is not set up on this website" };
  }
  const timestamp = input.timestamp?.trim() ?? "";
  if (!/^\d{9,11}$/.test(timestamp)) return { ok: false, status: 401, message: "Not signed" };
  if (Math.abs(input.nowSeconds - Number(timestamp)) > SITE_REFRESH_MAX_SKEW_SECONDS) {
    return { ok: false, status: 401, message: "Signature expired" };
  }
  const expected = Buffer.from(siteRefreshSignature(secret, timestamp, input.body));
  const given = Buffer.from(input.signature?.trim() ?? "");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
    return { ok: false, status: 401, message: "Bad signature" };
  }
  let hosts: unknown;
  try {
    hosts = (JSON.parse(input.body) as { hosts?: unknown }).hosts;
  } catch {
    return { ok: false, status: 400, message: "Body is not JSON" };
  }
  if (!Array.isArray(hosts) || hosts.length === 0 || hosts.length > MAX_HOSTS) {
    return { ok: false, status: 400, message: "Name the addresses to refresh" };
  }
  const clean = [...new Set(hosts.map((h) => (typeof h === "string" ? h.trim().toLowerCase() : "")))];
  if (clean.some((h) => !HOST.test(h) || h.length > 253)) {
    return { ok: false, status: 400, message: "Not a website address" };
  }
  return { ok: true, hosts: clean };
}
