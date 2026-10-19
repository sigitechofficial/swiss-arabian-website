import { NextResponse, type NextRequest } from "next/server";
import {
  CMS_PREVIEW_COOKIE,
  encodePreviewSession,
} from "@/features/cms/preview/previewCookie";

export const dynamic = "force-dynamic";

const MAX_TTL_SECONDS = 15 * 60;

type Body = {
  token?: string;
  zoneCode?: string;
  languageCode?: string;
  /** Optional TTL hint from admin (seconds). Capped. */
  ttlSeconds?: number;
};

/**
 * Secure preview handoff.
 * Admin POSTs the short-lived preview token in the body (not query string).
 * Sets an HttpOnly cookie and redirects to the visual preview page.
 */
export async function POST(request: NextRequest) {
  let body: Body = {};
  const contentType = request.headers.get("content-type") || "";

  try {
    if (contentType.includes("application/json")) {
      body = (await request.json()) as Body;
    } else {
      const form = await request.formData();
      body = {
        token: String(form.get("token") || ""),
        zoneCode: String(form.get("zoneCode") || ""),
        languageCode: String(form.get("languageCode") || "en"),
        ttlSeconds: Number(form.get("ttlSeconds") || MAX_TTL_SECONDS),
      };
    }
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const token = body.token?.trim();
  const zoneCode = body.zoneCode?.trim().toUpperCase();
  const languageCode = (body.languageCode?.trim() || "en").toLowerCase();
  if (!token || !zoneCode) {
    return NextResponse.json(
      { error: "token and zoneCode are required" },
      { status: 400 },
    );
  }

  const ttl = Math.min(
    Math.max(Number(body.ttlSeconds) || MAX_TTL_SECONDS, 60),
    MAX_TTL_SECONDS,
  );
  const expiresAt = Date.now() + ttl * 1000;
  const payload = encodePreviewSession({
    token,
    zoneCode,
    languageCode,
    expiresAt,
  });

  // Locale is applied via cookie + preview fetch languageCode; path stays unprefixed
  // (storefront uses pathname locale helpers when browsing /ar/* shop routes).
  const redirectTo = new URL("/preview/home", request.url);
  const response = NextResponse.redirect(redirectTo, 303);

  response.cookies.set({
    name: CMS_PREVIEW_COOKIE,
    value: payload,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ttl,
  });

  // Never cache preview handoff.
  response.headers.set("Cache-Control", "no-store");
  return response;
}

/** Clear preview session. */
export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: CMS_PREVIEW_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
