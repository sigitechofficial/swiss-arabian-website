"use client";

import { useSyncExternalStore } from "react";

const noSubscription = () => () => undefined;

/**
 * An inline `<script>` that exists only in the server-rendered HTML, where the
 * browser runs it while parsing (before hydration, so no theme flash).
 *
 * Next 16 renders the root layout again in the browser when an in-page
 * `notFound()` / error boundary has to be drawn after hydration (the layout
 * lives under `[locale]`). React then creates the layout's elements itself,
 * and a `<script>` created by React never runs and logs "Encountered a script
 * tag while rendering React component". `next/script` (`beforeInteractive`)
 * renders a `<script>` too, so it has the same problem.
 *
 * Here the script is kept while hydrating the server HTML (server snapshot)
 * and is never created by a browser render (client snapshot: nothing). Once
 * hydrated, the already-run tag is dropped from the DOM.
 */
export function ServerInlineScript({ html }: { html: string }) {
  const fromServerHtml = useSyncExternalStore(
    noSubscription,
    () => false,
    () => true,
  );
  if (!fromServerHtml) return null;
  return <script dangerouslySetInnerHTML={{ __html: html }} />;
}
