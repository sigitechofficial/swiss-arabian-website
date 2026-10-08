"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps } from "react";
import { localizeHref } from "./localePath";

export function LocaleLink({ href, ...props }: ComponentProps<typeof Link>) {
  const pathname = usePathname() || "/";
  const next = typeof href === "string" ? localizeHref(href, pathname) : href;
  return <Link href={next} {...props} />;
}
