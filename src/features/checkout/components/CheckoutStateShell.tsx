"use client";

import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { createContext, useContext, type ComponentType, type ReactNode } from "react";
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

type ShellProps = { current: string; children: ReactNode };
type SpinnerProps = { eyebrow?: string; title: string; body?: string };

/**
 * Another brand's frame for the payment screens (provider forms, returns,
 * success / cancel). The views keep their logic; only this shell and the
 * spinner come from the brand.
 */
export type CheckoutStateUi = { Shell?: ComponentType<ShellProps>; Spinner?: ComponentType<SpinnerProps> };

const CheckoutStateUiContext = createContext<CheckoutStateUi | null>(null);

export function CheckoutStateUiProvider({ ui, children }: { ui: CheckoutStateUi; children: ReactNode }) {
  return <CheckoutStateUiContext.Provider value={ui}>{children}</CheckoutStateUiContext.Provider>;
}

/** Page chrome for the post-checkout screens — same head band as `/checkout`. */
export function CheckoutStateShell({ current, children }: ShellProps) {
  const Brand = useContext(CheckoutStateUiContext)?.Shell;
  if (Brand) return <Brand current={current}>{children}</Brand>;
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

export function CheckoutSpinnerState({ eyebrow, title, body }: SpinnerProps) {
  const Brand = useContext(CheckoutStateUiContext)?.Spinner;
  if (Brand) return <Brand eyebrow={eyebrow} title={title} body={body} />;
  return (
    <section className={`${checkoutDone} ${checkoutLoading}`} aria-live="polite" aria-busy="true">
      <LoaderMark className="mb-7" />
      {eyebrow ? <p className={stateEyebrow}>{eyebrow}</p> : null}
      <h1 className={doneTitle}>{title}</h1>
      {body ? <p className={stateIntro}>{body}</p> : null}
    </section>
  );
}
