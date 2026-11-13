"use client";

import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { accountCrumbs } from "@/styles/accountChrome";
import { crumbsList } from "@/styles/shopChrome";
import { useShopCopy } from "@/lib/i18n/useShopCopy";

import { accountContainer } from "../constants/accountLayout";

type AccountBreadcrumbProps = {
  label: string;
};

/** Home / <page> — the same plain crumbs as the rest of the shop. */
export function AccountBreadcrumb({ label }: AccountBreadcrumbProps) {
  const t = useShopCopy();
  return (
    <nav aria-label={t("account.breadcrumbNav")} className={`${accountContainer} ${accountCrumbs}`}>
      <ol className={crumbsList} role="list">
        <li>
          <LocaleLink href="/">{t("home")}</LocaleLink>
        </li>
        <li aria-current="page">{label}</li>
      </ol>
    </nav>
  );
}
