"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { getBrand } from "@/lib/brand";
import { Breadcrumbs, Eyebrow, Serif, Wrap } from "../../ui";
import { cx } from "../../ui/shared";
import { useSapilCopy, type SapilTranslator } from "../../i18n/SapilCopy";
import type { SapilCopyKey } from "../../i18n/catalog";
import { SapilLink } from "../commerce/shared";

/**
 * Account sections Sapil links to. Loyalty / rewards, subscriptions, employee
 * benefits and gift box stay on Swiss Arabian's views (their routes exist) but
 * are never linked from Sapil: those features are off in Sapil's brand config.
 */
export const SAPIL_ACCOUNT_NAV: Array<{ href: string; label: SapilCopyKey; tile: SapilCopyKey }> = [
  { href: "/account/orders", label: "account.navOrders", tile: "account.tileOrders" },
  { href: "/account/profile", label: "account.navProfile", tile: "account.tileProfile" },
  { href: "/account/addresses", label: "account.navAddresses", tile: "account.tileAddresses" },
  { href: "/account/wishlist", label: "account.navWishlist", tile: "account.tileWishlist" },
  { href: "/account/reviews", label: "account.navReviews", tile: "account.tileReviews" },
  { href: "/account/returns", label: "account.navReturns", tile: "account.tileReturns" },
  { href: "/account/payments", label: "account.navPayments", tile: "account.tilePayments" },
  { href: "/account/security", label: "account.navSecurity", tile: "account.tileSecurity" },
];

/** "PAYMENT_PENDING" → "Awaiting payment" (Sapil wording; unknown codes in sentence case). */
export function statusText(t: SapilTranslator, status: string | null | undefined): string {
  if (!status) return "";
  const key = `account.status${status.toUpperCase()}` as SapilCopyKey;
  const text = t(key);
  if (text !== key) return text;
  const cleaned = status.toLowerCase().replace(/[_-]+/g, " ").trim();
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

const TONE: Record<string, string> = {
  DELIVERED: "bg-sapil-ok-soft text-sapil-ok",
  PAID: "bg-sapil-ok-soft text-sapil-ok",
  CANCELLED: "bg-sapil-p-peach text-sapil-sale",
  FAILED: "bg-sapil-p-peach text-sapil-sale",
  PAYMENT_PENDING: "bg-sapil-p-butter text-sapil-ink",
  MANUAL_REVIEW: "bg-sapil-p-butter text-sapil-ink",
  REFUND_PENDING: "bg-sapil-p-butter text-sapil-ink",
};

export function StatusPill({ status, label }: { status: string; label: string }) {
  return (
    <span
      className={cx(
        "inline-flex items-center py-[3px] px-[10px] rounded-full text-[12px] font-[600]",
        TONE[status.toUpperCase()] ?? "bg-sapil-accent-soft text-sapil-accent",
      )}
    >
      {label}
    </span>
  );
}

/** Account page heading: breadcrumbs, eyebrow, serif title with an accent, section chips. */
export function AccountPage({
  title,
  accent,
  lede,
  crumb,
  actions,
  nav = true,
  children,
}: {
  title: ReactNode;
  accent?: ReactNode;
  lede?: ReactNode;
  crumb: string;
  actions?: ReactNode;
  nav?: boolean;
  children: ReactNode;
}) {
  const t = useSapilCopy();
  const pathname = usePathname() || "";
  const path = pathname.replace(/^\/[a-z]{2}(?:-[a-z]{2})?(?=\/account)/, "");
  return (
    <Wrap as="main" className="pt-[28px] pb-[88px] max-900:pt-[20px] max-900:pb-[56px]">
      <Breadcrumbs
        items={[
          { label: t("account.home"), href: "/" },
          ...(crumb === t("account.account") ? [] : [{ label: t("account.account"), href: "/account" }]),
          { label: crumb },
        ]}
        LinkComponent={SapilLink}
      />
      <header className="flex items-end justify-between gap-[16px] flex-wrap mt-[18px] mb-[20px]">
        <div className="min-w-0">
          <Eyebrow>{t("account.dashEyebrow")}</Eyebrow>
          <h1 className="font-sapil-display text-[clamp(34px,4vw,52px)] leading-[1.02] mt-[10px]">
            {title}
            {accent ? (
              <>
                {" "}
                <Serif>{accent}</Serif>
              </>
            ) : null}
          </h1>
          {lede ? <p className="mt-[10px] text-sapil-ink-2 max-w-[62ch]">{lede}</p> : null}
        </div>
        {actions}
      </header>
      {nav ? (
        <nav aria-label={t("account.navLabel")} className="flex gap-[8px] overflow-x-auto pb-[6px] mb-[24px] [scrollbar-width:none]">
          <ChipLink href="/account" current={path === "/account"}>
            {t("account.navOverview")}
          </ChipLink>
          {SAPIL_ACCOUNT_NAV.map((item) => (
            <ChipLink key={item.href} href={item.href} current={path === item.href || path.startsWith(`${item.href}/`)}>
              {t(item.label)}
            </ChipLink>
          ))}
        </nav>
      ) : null}
      {children}
    </Wrap>
  );
}

/** The v9 `.chip` look as a navigation link (current section in navy). */
export function ChipLink({ href, current, children }: { href: string; current?: boolean; children: ReactNode }) {
  return (
    <SapilLink
      href={href}
      aria-current={current ? "page" : undefined}
      className={cx(
        "shrink-0 h-[40px] px-[16px] rounded-full border text-[14px] font-[500] inline-flex items-center gap-[8px] whitespace-nowrap [transition:all_.18s_var(--sapil-ease)]",
        current ? "bg-sapil-accent border-sapil-accent text-sapil-white" : "border-sapil-line-2 bg-sapil-card hover:border-sapil-ink",
      )}
    >
      {children}
    </SapilLink>
  );
}

/** White rounded card (v9 `.od-card`). */
export function Card({
  title,
  children,
  className,
  headingLevel: H = "h2",
  id,
}: {
  title?: ReactNode;
  children: ReactNode;
  className?: string;
  headingLevel?: "h2" | "h3";
  id?: string;
}) {
  return (
    <section className={cx("bg-sapil-white rounded-[24px] py-[24px] px-[26px] max-900:p-[20px]", className)} aria-labelledby={title && id ? id : undefined}>
      {title ? (
        <H
          id={id}
          className={
            H === "h2"
              ? "font-sapil-sans font-[700] text-[20px] leading-[normal] tracking-[-.02em] mb-[6px]"
              : "font-sapil-sans font-[600] text-[13px] leading-[normal] tracking-[.1em] uppercase text-sapil-muted mb-[10px]"
          }
        >
          {title}
        </H>
      ) : null}
      {children}
    </section>
  );
}

/** "We couldn't load … / Try again" (design-system error state). */
export function LoadError({ onRetry, message }: { onRetry?: () => void; message?: ReactNode }) {
  const t = useSapilCopy();
  return (
    <div className="bg-sapil-white rounded-[24px] py-[48px] px-[24px] text-center" role="alert">
      <p className="text-sapil-ink-2">{message ?? t("account.loadFailed")}</p>
      {onRetry ? (
        <button type="button" onClick={onRetry} className="mt-[12px] font-[600] text-[15px] border-b border-current pb-[2px] hover:text-sapil-accent">
          {t("account.tryAgain")}
        </button>
      ) : null}
    </div>
  );
}

/** Brand legal links for auth and checkout copy. */
export function legalLinks() {
  return getBrand().legal;
}
