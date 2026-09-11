import Link from "next/link";
import type { ReactNode } from "react";
import { LoaderMark } from "@/components/ui/PageLoading";

/** Page chrome for the post-checkout screens — same head band as `/checkout`. */
export function CheckoutStateShell({
  current,
  children,
}: {
  current: string;
  children: ReactNode;
}) {
  return (
    <div className="landing">
      <section className="collection-head checkout-head-section">
        <div className="container container--full">
          <nav className="crumbs" aria-label="Breadcrumb">
            <ol className="crumbs__list" role="list">
              <li>
                <Link href="/">Home</Link>
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
    <section className="checkout-done checkout-loading" aria-live="polite" aria-busy="true">
      <LoaderMark className="mb-7" />
      {eyebrow ? <p className="collection-head__eyebrow">{eyebrow}</p> : null}
      <h1 className="collection-head__title">{title}</h1>
      {body ? <p className="collection-head__intro">{body}</p> : null}
    </section>
  );
}
