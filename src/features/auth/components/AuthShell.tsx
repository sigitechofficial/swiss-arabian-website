import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { authAssets } from "../constants/authAssets";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-col bg-page font-sans text-sa-primary">
      <header className="flex w-full items-center border-b border-sa-border bg-surface px-4 py-3 sm:px-10 lg:px-20">
        <Link
          href="/"
          className="relative h-[50px] w-[90px] shrink-0"
          aria-label="Swiss Arabian home"
        >
          <Image
            src={authAssets.logo}
            alt="Swiss Arabian"
            fill
            priority
            className="site-logo object-contain object-left"
            sizes="90px"
          />
        </Link>
      </header>
      <main className="flex flex-1 justify-center bg-page px-4 py-10 sm:py-16 lg:py-20">
        {children}
      </main>
    </div>
  );
}
