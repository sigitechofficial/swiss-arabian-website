import { LocaleLink } from "@/lib/i18n/LocaleLink";
import type { ReactNode } from "react";
import { LoaderMark } from "@/components/ui/PageLoading";
import {
  checkoutCrumbsList,
  collectionHeadFlush,
  crumbs,
  doneTitle,
  stateEyebrow,
  stateIntro,
} from "@/styles/shopChrome";
import { checkoutDone, checkoutLoading } from "@/styles/checkoutChrome";
import { pageContainer } from "@/styles/siteChrome";

/** Page chrome for the post-checkout screens — same head band as `/checkout`. */
export function CheckoutStateShell({
  current,
  children,
}: {
  current: string;
  children: ReactNode;
}) {
  return (
    <div>
      <section className={collectionHeadFlush}>
        <div className={pageContainer}>
          <nav className={crumbs} aria-label="Breadcrumb">
            <ol className={checkoutCrumbsList} role="list">
              <li>
                <LocaleLink href="/">Home</LocaleLink>
              </li>
              <li aria-current="page">{current}</li>
            </ol>
          </nav>
          {children}
        </div>
      </section>
    </div>
  );
}

export function CheckoutSpinnerState({
  eyebrow,
  title,
  body,
}: {
  eyebrow?: string;
  title: string;
  body?: string;
}) {
  return (
    <section className={`${checkoutDone} ${checkoutLoading}`} aria-live="polite" aria-busy="true">
      <LoaderMark className="mb-7" />
      {eyebrow ? <p className={stateEyebrow}>{eyebrow}</p> : null}
      <h1 className={doneTitle}>{title}</h1>
      {body ? <p className={stateIntro}>{body}</p> : null}
    </section>
  );
}
