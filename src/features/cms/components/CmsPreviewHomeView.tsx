import { headers } from "next/headers";
import { cookies } from "next/headers";
import Link from "next/link";
import { env } from "@/lib/config/env";
import { fetchPreviewHome } from "../api/cmsContent.service";
import {
  CMS_PREVIEW_COOKIE,
  decodePreviewSession,
} from "../preview/previewCookie";
import { CmsSectionList } from "./CmsSectionList";

export async function CmsPreviewHomeView() {
  const jar = await cookies();
  const session = decodePreviewSession(jar.get(CMS_PREVIEW_COOKIE)?.value);
  const headerStore = await headers();
  const hostHeader =
    headerStore.get("x-forwarded-host") || headerStore.get("host") || "";
  const storefrontHost =
    env.storefrontHost || hostHeader.split(":")[0] || null;

  if (!session) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-[var(--ink,#241f1b)]">
          Preview expired
        </h1>
        <p className="mt-2 text-[var(--ink-2,#5b5148)]">
          This Draft preview session is missing or has expired. Open Preview
          again from Admin.
        </p>
        <Link className="mt-6 inline-block underline" href="/">
          Back to storefront
        </Link>
      </div>
    );
  }

  const result = await fetchPreviewHome({
    zoneCode: session.zoneCode,
    languageCode: session.languageCode,
    previewToken: session.token,
    storefrontHost,
  });

  const hasSections =
    Boolean(result.page) &&
    Array.isArray(result.sections) &&
    result.sections.length > 0;

  return (
    <div data-cms-home="preview" data-zone={session.zoneCode} data-locale={session.languageCode}>
      <div className="sticky top-0 z-50 border-b border-[var(--line,#E7DDCB)] bg-[#2C241D] px-4 py-2 text-center text-sm text-white">
        Draft preview · {session.zoneCode} · {session.languageCode}
        {" · "}
        <Link className="underline" href="/">
          Exit preview
        </Link>
      </div>
      {hasSections ? (
        <CmsSectionList sections={result.sections} logUnknown />
      ) : (
        <div className="mx-auto max-w-xl px-4 py-16 text-center">
          <h1 className="text-xl font-semibold">Empty Draft</h1>
          <p className="mt-2 text-[var(--ink-2,#5b5148)]">
            No enabled sections in this Draft preview, or the token is invalid
            for this market.
          </p>
        </div>
      )}
    </div>
  );
}
