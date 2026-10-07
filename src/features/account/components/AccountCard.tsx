"use client";

import Image from "next/image";
import { LocaleLink } from "@/lib/i18n/LocaleLink";
import type { ReactNode } from "react";

import { toast } from "@/components/ui/Toaster";

type AccountCardProps = {
  icon: string;
  title: string;
  description: string;
  /** Omit for destinations that do not exist yet. */
  href?: string;
};

const CARD_CLASS =
  "group relative flex flex-col gap-3 rounded-lg border border-sa-border bg-surface p-6 text-left transition-colors hover:border-terra";

export function AccountCard({
  icon,
  title,
  description,
  href,
}: AccountCardProps) {
  const inner: ReactNode = (
    <>
      <Image
        src={icon}
        alt=""
        width={28}
        height={28}
        className="h-7 w-7 shrink-0"
      />
      <p className="text-[16px] font-bold leading-[1.2] text-sa-primary">
        {title}
      </p>
      <p className="text-[12.5px] leading-[1.65] text-sa-secondary">
        {description}
      </p>
      <span
        className="absolute right-6 top-[23px] text-[14.5px] text-terra transition-transform group-hover:translate-x-1"
        aria-hidden
      >
        →
      </span>
    </>
  );

  if (!href) {
    return (
      <button
        type="button"
        className={CARD_CLASS}
        onClick={() => toast(`${title} will be available soon.`, "info")}
      >
        {inner}
      </button>
    );
  }

  return (
    <LocaleLink href={href} className={CARD_CLASS}>
      {inner}
    </LocaleLink>
  );
}
