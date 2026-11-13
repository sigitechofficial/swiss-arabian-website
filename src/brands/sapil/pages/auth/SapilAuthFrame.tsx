import type { ReactNode } from "react";
import "@/brands/sapil/theme.css";
import { getBrand, localized } from "@/lib/brand";
import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { SapilRoot } from "../../ui/SapilRoot";
import { SapilCopyProvider } from "../../i18n/SapilCopy";
import { sapilTranslator } from "../../i18n/server";

/**
 * The auth routes render without the storefront shell, so Sapil's sign-in
 * pages bring their own frame: Sapil root (tokens, fonts), Sapil wording for
 * the page's language, the logo back home, and the form card on paper.
 */
export async function SapilAuthFrame({ children }: { children: ReactNode }) {
  const { locale, messages, t } = await sapilTranslator();
  const brand = getBrand();
  return (
    <SapilRoot className="min-h-screen bg-sapil-paper text-sapil-ink flex flex-col">
      <SapilCopyProvider messages={messages}>
        <header className="py-[22px] flex justify-center border-b border-sapil-line bg-sapil-white">
          <LocaleLink href="/" aria-label={t("account.authHomeLink")}>
            {/* eslint-disable-next-line @next/next/no-img-element -- small brand logo from /public */}
            <img
              src={brand.logo.src}
              alt={localized(brand.logo.alt, locale)}
              width={brand.logo.width}
              height={brand.logo.height}
              className="h-[34px] w-auto"
            />
          </LocaleLink>
        </header>
        <main id="main" className="flex-1 px-sapil-gut">
          {children}
        </main>
      </SapilCopyProvider>
    </SapilRoot>
  );
}
