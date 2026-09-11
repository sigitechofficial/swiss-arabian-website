/**
 * Account pages share the site chrome's content box so their edges line up with
 * the navbar. Mirrors `.site-header .primary-nav__list` exactly:
 *   --chrome-content-max → 1200px cap
 *   --chrome-edge        → gutter below 1200px
 *   ≥1200px              → gutter drops to 0, content runs edge-to-edge
 * Bound to the same custom properties so the two can never drift apart.
 */
export const accountContainer =
  "mx-auto w-full max-w-[var(--chrome-content-max)] px-[var(--chrome-edge)] [@media(min-width:1200px)]:px-0";
