import Image from "next/image";
import Link from "next/link";

import { accountAssets } from "../constants/accountAssets";

type AccountDashboardHeroProps = {
  firstName: string;
};

/** Figma · acct-hero (1110:9319) — greeting | image | subscription panel */
export function AccountDashboardHero({
  firstName,
}: AccountDashboardHeroProps) {
  return (
    <section className="border-y border-sa-border">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col lg:flex-row lg:px-[120px]">
        <div className="flex flex-1 flex-col justify-center gap-4 bg-page px-6 py-10 sm:px-[52px] lg:border-r lg:border-sa-border lg:py-14">
          <h1 className="text-[32px] font-bold leading-tight text-sa-primary lg:text-[40px]">
            Hi {firstName}!
          </h1>
          <p className="max-w-[360px] text-[14px] leading-relaxed text-sa-secondary">
            Today is a great day to discover a new scent.
          </p>
        </div>

        <div className="relative h-[220px] flex-1 bg-surface sm:h-[280px] lg:h-auto lg:min-h-[320px]">
          <Image
            src={accountAssets.hero}
            alt="Swiss Arabian fragrance"
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 400px, 100vw"
            priority
          />
        </div>

        <div className="flex flex-1 flex-col justify-center gap-4 border-t border-sa-border bg-page px-6 py-10 sm:px-[52px] lg:border-l lg:border-t-0 lg:py-12">
          <div className="flex items-center gap-2.5">
            <Image
              src={accountAssets.icons.subscription}
              alt=""
              width={32}
              height={32}
              className="h-8 w-8"
            />
            <p className="text-[17px] font-semibold text-sa-primary">
              Subscription
            </p>
          </div>
          <p className="max-w-[308px] text-[15px] leading-relaxed text-sa-secondary">
            Check your level, explore your benefits, and get the most out of
            your subscription.
          </p>
          <Link
            href="/account/subscription"
            className="text-[14px] font-medium text-sa-primary hover:text-terra"
          >
            View Subscription &nbsp;→
          </Link>
        </div>
      </div>
    </section>
  );
}
