/**
 * Sign-in, register, verify and password pages read `?returnTo=` / `?email=`
 * (useSearchParams). Prerendered, they would ship only their loading fallback
 * and draw the form after hydration; rendered per request (as before the
 * `[locale]` move) the form is in the HTML. They are noindex, so nothing is
 * lost by not caching them.
 */
export const dynamic = "force-dynamic";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
