import Image from "next/image";
import Link from "next/link";

import { accountAssets } from "../constants/accountAssets";

type AccountDashboardHeroProps = {
  firstName: string;
};

/** Greeting | image | subscription panel */
export function AccountDashboardHero({
  firstName,
}: AccountDashboardHeroProps) {
  return (
    <section className="border-y border-sa-border">
      <div className="mx-auto flex w-full max-w-[var(--chrome-content-max)] flex-col px-[var(--chrome-edge)] lg:flex-row [@media(min-width:1200px)]:px-0">
        <div className="flex flex-1 flex-col justify-center gap-4 bg-page py-10 pr-6 sm:pr-10 lg:border-r lg:border-sa-border lg:py-14">
          <h1 className="text-[28px] font-bold leading-tight text-sa-primary lg:text-[34px]">
            Hi {firstName}!
          </h1>
          <p className="max-w-[360px] text-[13px] leading-relaxed text-sa-secondary">
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

        <div className="flex flex-1 flex-col justify-center gap-4 border-t border-sa-border bg-page py-10 pl-0 pr-6 sm:pr-10 lg:border-l lg:border-t-0 lg:py-12 lg:pl-10 lg:pr-0">
          <div className="flex items-center gap-2.5">
            <Image
              src={accountAssets.icons.subscription}
              alt=""
              width={32}
              height={32}
              className="h-8 w-8"
            />
            <p className="text-[15px] font-semibold text-sa-primary">
              Subscription
            </p>
          </div>
          <p className="max-w-[308px] text-[13.5px] leading-relaxed text-sa-secondary">
            Check your level, explore your benefits, and get the most out of
            your subscription.
          </p>
          <Link
            href="/account/subscription"
            className="text-[13px] font-medium text-sa-primary hover:text-terra"
          >
            View Subscription &nbsp;→
          </Link>
        </div>
      </div>
    </section>
  );
}
