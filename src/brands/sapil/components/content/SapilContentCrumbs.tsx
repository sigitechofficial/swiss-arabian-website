"use client";

import { useSapilCopy } from "../../i18n/SapilCopy";
import { Breadcrumbs, type Crumb } from "../../ui";
import { SapilLink } from "../shared/SapilLink";

/** "Home / … / Current page" for content pages. */
export function SapilContentCrumbs({ current, middle = [] }: { current: string; middle?: Crumb[] }) {
  const t = useSapilCopy();
  return (
    <Breadcrumbs
      label={t("content.breadcrumb")}
      items={[{ label: t("content.home"), href: "/" }, ...middle, { label: current }]}
      LinkComponent={SapilLink}
    />
  );
}
