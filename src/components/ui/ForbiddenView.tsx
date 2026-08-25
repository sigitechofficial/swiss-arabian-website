"use client";

import Link from "next/link";
import { AppButton } from "./AppButton";

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
      <AppButton component={Link} href="/login">
        Sign in
      </AppButton>
    </div>
  );
}
