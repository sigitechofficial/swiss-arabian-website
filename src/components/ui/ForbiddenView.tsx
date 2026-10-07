"use client";

import { LocaleLink } from "@/lib/i18n/LocaleLink";

export function ForbiddenView({
  title = "You need to sign in",
  message = "This page is only available to signed-in customers.",
}: {
  title?: string;
  message?: string;
}) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-4 py-20 text-center">
      <h1 className="font-display text-3xl text-sa-primary">{title}</h1>
      <p className="text-sa-muted">{message}</p>
      <LocaleLink
        className="inline-flex h-11 items-center justify-center rounded-md bg-terra px-5 text-sm font-semibold text-white hover:bg-[var(--sa-action-primary-hover)]"
        href="/login"
      >
        Sign in
      </LocaleLink>
    </div>
  );
}
