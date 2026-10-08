import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { authAssets } from "../constants/authAssets";

type AuthCardProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <div className="flex w-full flex-col items-stretch">
      <div className="flex flex-col items-center gap-2 text-center">
        <Link
          href="/"
          className="relative h-11 w-[100px] shrink-0"
          aria-label="Swiss Arabian home"
        >
          <Image
            src={authAssets.logo}
            alt=""
            fill
            priority
            className="site-logo object-contain"
            sizes="100px"
          />
        </Link>
      </div>

      <div className="mt-7 flex flex-col items-center gap-2 text-center">
        <h1 className="font-sans text-[clamp(1.625rem,4vw,1.875rem)] font-medium leading-[1.1] tracking-[-0.02em] text-sa-primary">
          {title}
        </h1>
        <p className="max-w-sm text-[15px] leading-normal text-sa-secondary">
          {subtitle}
        </p>
      </div>

      <div className="mt-6 w-full">{children}</div>
    </div>
  );
}
