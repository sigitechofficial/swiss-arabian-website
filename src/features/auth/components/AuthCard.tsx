import Image from "next/image";
import type { ReactNode } from "react";
import { authAssets } from "../constants/authAssets";

type AuthCardProps = {
  subtitle: string;
  title: string;
  children: ReactNode;
};

export function AuthCard({ subtitle, title, children }: AuthCardProps) {
  return (
    <div className="flex w-full max-w-[480px] flex-col gap-5 border border-sa-border bg-surface p-6 sm:p-12">
      <div className="flex flex-col items-center gap-3 pb-2 text-center">
        <div className="relative h-[50px] w-[90px] shrink-0">
          <Image
            src={authAssets.logo}
            alt="Swiss Arabian"
            fill
            className="site-logo object-contain"
            sizes="90px"
          />
        </div>
        <p className="max-w-[12rem] text-[13px] leading-normal text-sa-secondary">
          {subtitle}
        </p>
        <h1 className="text-[26px] font-bold leading-normal text-sa-primary">
          {title}
        </h1>
      </div>
      {children}
    </div>
  );
}
