import type { ReactNode } from "react";
import Link from "next/link";
import { AuthVisualPanel } from "./AuthVisualPanel";

type AuthShellProps = {
  heading: string;
  subtitle: string;
  children: ReactNode;
};

/** Two-column auth layout matching the production storefront's `/login`,
 *  `/register` and `/forgot-password` pages — a rotating brand photo panel
 *  on desktop (`AuthVisualPanel`), collapsing to just the form on mobile. */
export function AuthShell({ heading, subtitle, children }: AuthShellProps) {
  return (
    <div className="flex min-h-dvh bg-page font-sans text-sa-primary">
      <AuthVisualPanel />
      <main className="flex min-h-dvh w-full flex-col items-center justify-center overflow-y-auto px-5 py-10 sm:px-12 sm:py-12 lg:w-1/2 lg:px-14 xl:px-20">
        <div className="w-full max-w-[26rem] sm:max-w-[28rem]">
          <div className="flex w-full flex-col items-stretch">
            <div className="flex flex-col items-center gap-2 text-center">
              <Link className="relative block h-16 w-[150px] shrink-0" aria-label="Swiss Arabian home" href="/">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/sa-logo-clear.png" alt="" className="site-logo h-full w-full object-contain" />
              </Link>
            </div>
            <div className="mt-9 flex flex-col items-center gap-2 text-center">
              <h1 className="font-sans text-[clamp(1.25rem,2.6vw,1.5rem)] font-normal leading-[1.15] tracking-[-0.01em] text-sa-primary">
                {heading}
              </h1>
              <p className="max-w-sm text-[13px] leading-normal text-sa-secondary">{subtitle}</p>
            </div>
            <div className="mt-9 w-full">{children}</div>
          </div>
        </div>
      </main>
    </div>
  );
}
