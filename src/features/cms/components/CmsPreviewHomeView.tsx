import Link from "next/link";
import { loadCmsPreviewHome } from "../preview/loadPreviewHome";
import { CmsSectionList } from "./CmsSectionList";

export async function CmsPreviewHomeView() {
  const preview = await loadCmsPreviewHome();

  if (preview.status === "expired") {
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

  return (
    <div data-cms-home="preview" data-zone={preview.zoneCode} data-locale={preview.languageCode}>
      <div className="sticky top-0 z-50 border-b border-[var(--line,#E7DDCB)] bg-[#2C241D] px-4 py-2 text-center text-sm text-white">
        Draft preview · {preview.zoneCode} · {preview.languageCode}
        {" · "}
        <Link className="underline" href="/">
          Exit preview
        </Link>
      </div>
      {preview.status === "ready" ? (
        <CmsSectionList sections={preview.result.sections} logUnknown />
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
