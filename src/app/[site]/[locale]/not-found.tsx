"use client";

import { NotFoundView, StorefrontShell } from "@brand-ui/client";

/** Not found, in the brand's chrome (the content says which market was searched). */
export default function NotFound() {
  return (
    <StorefrontShell>
      <NotFoundView />
    </StorefrontShell>
  );
}
