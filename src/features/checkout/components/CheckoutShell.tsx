"use client";

import Image from "next/image";
import Link from "next/link";
import { homeAssets } from "@/features/home/constants/homeAssets";

// ─── Steps config ─────────────────────────────────────────────────────────────

const STEPS = ["Information", "Payment", "Done"] as const;
export type CheckoutStep = 1 | 2 | 3;

// ─── Step bar ─────────────────────────────────────────────────────────────────

export function CheckoutStepBar({ step }: { step: CheckoutStep }) {
  return (
    <nav aria-label="Checkout progress" className="flex items-center justify-center gap-0 py-5">
      {STEPS.map((label, idx) => {
        const n = (idx + 1) as CheckoutStep;
        const active = n === step;
        const done = n < step;

        return (
          <div key={label} className="flex items-center">
            {idx > 0 ? (
              <div
                className={`mx-3 h-px w-10 transition-colors sm:w-16 ${
                  done ? "bg-terra" : "bg-sa-border"
                }`}
              />
            ) : null}
            <div className="flex items-center gap-2">
              <span
                className={`flex size-7 items-center justify-center rounded-full text-[12px] font-bold transition-colors ${
                  active
                    ? "bg-terra text-white"
                    : done
                      ? "border-2 border-terra bg-white text-terra dark:bg-page"
                      : "border-2 border-sa-border bg-white text-sa-muted dark:bg-page"
                }`}
              >
                {done ? (
                  <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                    <path
                      d="M1 5l4 4 6-8"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  n
                )}
              </span>
              <span
                className={`text-[13px] font-medium transition-colors ${
                  active
                    ? "text-terra"
                    : done
                      ? "text-sa-primary"
                      : "text-sa-muted"
                }`}
              >
                {label}
              </span>
            </div>
          </div>
        );
      })}
    </nav>
  );
}

// ─── Payment icons ─────────────────────────────────────────────────────────────

function PaymentIcons() {
  return (
    <div className="flex items-center gap-2">
      {(["VISA", "MC", "APPLE PAY", "G PAY"] as const).map((c) => (
        <span
          key={c}
          className="rounded border border-sa-border bg-white px-2 py-1 text-[9px] font-bold tracking-wide text-sa-muted dark:bg-page"
        >
          {c}
        </span>
      ))}
    </div>
  );
}

// ─── Shell ────────────────────────────────────────────────────────────────────

interface CheckoutShellProps {
  step: CheckoutStep;
  children: React.ReactNode;
}

export function CheckoutShell({ step, children }: CheckoutShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-page font-sans text-sa-primary">

      {/* ── Header ── */}
      <header className="border-b border-sa-border bg-page">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" aria-label="Swiss Arabian home">
            <Image
              src={homeAssets.logo}
              alt="Swiss Arabian"
              width={130}
              height={36}
              className="site-logo h-9 w-auto object-contain object-left"
              priority
            />
          </Link>
          <div className="flex items-center gap-2 text-[13px] font-medium text-sa-muted">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <rect x="2" y="6" width="11" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
              <path d="M4.5 6V4.5a3 3 0 016 0V6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            Secure Checkout
          </div>
          <Link
            href="/cart"
            className="flex items-center gap-1.5 text-[13px] font-medium text-sa-muted transition-colors hover:text-terra"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M8 3L4 7l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Return to cart
          </Link>
        </div>
      </header>

      {/* ── Step bar ── */}
      <div className="border-b border-sa-border bg-page">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <CheckoutStepBar step={step} />
        </div>
      </div>

      {/* ── Page content ── */}
      <main className="flex flex-1 flex-col">{children}</main>

      {/* ── Footer ── */}
      <footer className="border-t border-sa-border bg-page">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 px-5 py-4 sm:flex-row sm:px-8">
          <div className="flex items-center gap-2 text-[12px] font-medium text-sa-muted">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="2" y="6" width="10" height="7" rx="1.2" stroke="currentColor" strokeWidth="1.2" />
              <path d="M4.5 6V4.5a2.5 2.5 0 015 0V6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            Secure Checkout
          </div>
          <PaymentIcons />
          <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-sa-muted">
            <Link href="/privacy-policy" className="hover:text-sa-primary hover:underline">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-sa-primary hover:underline">Terms & Conditions</Link>
            <Link href="/returns" className="hover:text-sa-primary hover:underline">Returns & Refunds</Link>
            <Link href="/contact" className="hover:text-sa-primary hover:underline">Contact Us</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
