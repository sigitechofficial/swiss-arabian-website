"use client";

import Link from "next/link";
import { StorefrontShell } from "@/components/layout/StorefrontShell";
import { AppButton } from "@/components/ui";

export default function NotFound() {
  return (
    <StorefrontShell>
      <section className="mx-auto flex max-w-lg flex-col items-center gap-4 px-4 py-24 text-center">
        <h1 className="font-display text-4xl text-sa-primary">Page not found</h1>
        <p className="text-sa-muted">The page you are looking for does not exist.</p>
        <AppButton component={Link} href="/">
          Back home
        </AppButton>
      </section>
    </StorefrontShell>
  );
}
