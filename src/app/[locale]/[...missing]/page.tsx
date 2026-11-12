import { notFound } from "next/navigation";

/**
 * Any address no route matches. The proxy sends every page address into the
 * `[locale]` tree, so this shows the shop's own 404 (./not-found.tsx, inside
 * the root layout) in the address's language.
 */
export default function MissingPage() {
  notFound();
}
