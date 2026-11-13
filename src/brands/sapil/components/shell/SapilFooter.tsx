"use client";

import { MediaImage } from "@/components/ui/MediaImage";
import { useId, type ReactNode } from "react";
import { toast } from "@/components/ui/Toaster";
import { useNewsletterSignup } from "@/features/newsletter/hooks/useNewsletterSignup";
import { useSapilCopy } from "../../i18n/SapilCopy";
import { Button, Serif, Wrap } from "../../ui";
import { SapilLink } from "../shared/SapilLink";
import type { SapilLogo } from "./SapilHeader";
import type { FooterColumn } from "./shellData";

export type SapilFooterViewProps = {
  logo: SapilLogo;
  columns: FooterColumn[];
  columnsLoading?: boolean;
  newsletterHeading?: string | null;
  newsletterPlaceholder?: string | null;
  newsletterButtonLabel?: string | null;
  copyright: string;
  /** right side of the legal row (market + language pickers) */
  legalEnd?: ReactNode;
};

/** v9 `footer`: newsletter, link columns from the market's footer menu, legal row. */
export function SapilFooterView({
  logo,
  columns,
  columnsLoading,
  newsletterHeading,
  newsletterPlaceholder,
  newsletterButtonLabel,
  copyright,
  legalEnd,
}: SapilFooterViewProps) {
  const t = useSapilCopy();
  const id = useId();
  const newsletter = useNewsletterSignup({
    onSuccess: () => {
      toast(t("shell.newsThanks"), "success");
      newsletter.reset();
    },
  });
  const cols = columnsLoading && !columns.length ? [] : columns;
  return (
    <footer data-sapil-footer="" className="pt-[72px] pb-[40px]">
      <Wrap>
        <div
          className="grid gap-[40px] max-900:!grid-cols-2"
          style={{ gridTemplateColumns: `minmax(0,5fr) repeat(${Math.max(cols.length, 3)},minmax(0,2fr))` }}
        >
          <div className="max-900:col-span-full">
            <MediaImage src={logo.src} alt={logo.alt} width={logo.width} height={logo.height} className="h-[30px] w-auto" />
            <h3 className="text-[30px] mt-[20px] mb-[10px]">
              {newsletterHeading || (
                <>
                  {t("shell.newsTitle")} <Serif>{t("shell.newsAccent")}</Serif>
                </>
              )}
            </h3>
            <p className="text-sapil-ink-2 text-[15px] mb-[20px]">{t("shell.newsText")}</p>
            <form
              noValidate
              onSubmit={newsletter.onSubmit}
              className="flex gap-[8px] max-w-[420px]"
            >
              <label className="sr-only" htmlFor={`${id}-email`}>
                {t("shell.email")}
              </label>
              <input
                id={`${id}-email`}
                type="email"
                name="email"
                autoComplete="email"
                required
                value={newsletter.email}
                onChange={(e) => newsletter.setEmail(e.target.value)}
                aria-invalid={newsletter.invalid || undefined}
                aria-describedby={newsletter.invalid ? `${id}-err` : undefined}
                placeholder={newsletterPlaceholder || t("shell.emailPlaceholder")}
                className="flex-1 min-w-0 h-[48px] rounded-full border border-sapil-line-2 bg-sapil-card px-[20px] text-[15px] focus:outline-none focus:border-sapil-ink placeholder:text-[#757575]"
              />
              <Button type="submit">{newsletterButtonLabel || t("shell.signUp")}</Button>
            </form>
            {newsletter.invalid ? (
              <p id={`${id}-err`} role="alert" className="text-[13px] text-sapil-sale mt-[8px]">
                {t("shell.emailInvalid")}
              </p>
            ) : null}
          </div>
          {cols.map((col) => (
            <div key={col.id}>
              {col.heading ? (
                <h4 className="text-[13px] font-[600] tracking-[.12em] uppercase text-sapil-muted mb-[16px]">{col.heading}</h4>
              ) : (
                <h4 className="text-[13px] font-[600] tracking-[.12em] uppercase text-sapil-muted mb-[16px]">{t("shell.moreLinks")}</h4>
              )}
              <ul className="list-none flex flex-col gap-[10px] text-[15px]">
                {col.links.map((l) => (
                  <li key={`${l.href}-${l.label}`}>
                    <SapilLink href={l.href} className="hover:text-sapil-accent">
                      {l.label}
                    </SapilLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center gap-[16px] flex-wrap mt-[56px] pt-[24px] border-t border-sapil-line text-[13px] text-sapil-muted">
          <span>{copyright}</span>
          {legalEnd}
        </div>
      </Wrap>
    </footer>
  );
}
