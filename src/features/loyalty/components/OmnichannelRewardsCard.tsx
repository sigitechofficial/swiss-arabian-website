"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  formatPointQuantity,
  OMNICHANNEL_COPY,
  type OmnichannelLoyaltyView,
} from "../types/omnichannel";

function activityDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export type OmnichannelRefreshControl = {
  visible: boolean;
  busy: boolean;
  disabled: boolean;
  message: string | null;
  onRefresh: () => void;
};

function RefreshControl({ control }: { control: OmnichannelRefreshControl | null }) {
  if (!control?.visible) return null;
  return (
    <div className="mt-4 flex min-w-0 flex-col items-start gap-2">
      <button
        type="button"
        onClick={control.onRefresh}
        disabled={control.disabled}
        aria-busy={control.busy}
        aria-label={control.busy ? OMNICHANNEL_COPY.refreshing : OMNICHANNEL_COPY.refresh}
        className="text-[12.5px] font-semibold text-terra hover:underline disabled:cursor-not-allowed disabled:opacity-60 disabled:no-underline"
      >
        {control.busy ? OMNICHANNEL_COPY.refreshing : OMNICHANNEL_COPY.refresh}
      </button>
      {control.message ? (
        <p className="text-[13px] leading-relaxed text-sa-secondary" role="status">
          {control.message}
        </p>
      ) : null}
    </div>
  );
}

function CardShell({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-sa-border bg-page px-5 py-6 sm:px-7 sm:py-7">{children}</div>
  );
}

function lastKnownBalance(omnichannel: OmnichannelLoyaltyView): boolean {
  return omnichannel.sync.source === "LAST_KNOWN_GOOD" || omnichannel.sync.isFresh === false;
}

function LinkedBalance({
  omnichannel,
  refresh,
}: {
  omnichannel: OmnichannelLoyaltyView;
  refresh: OmnichannelRefreshControl | null;
}) {
  const active = omnichannel.balance?.activePoints ?? "";
  const known = lastKnownBalance(omnichannel);
  const stale = omnichannel.sync.isFresh === false;
  const syncedAt = activityDate(omnichannel.sync.lastSuccessfulSyncAt ?? omnichannel.sync.fetchedAt);

  return (
    <section aria-labelledby="store-rewards-heading">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-sa-muted">
        {OMNICHANNEL_COPY.eyebrow}
      </p>
      <p
        className="mt-3 font-sans text-[40px] font-medium leading-none tracking-[-0.03em] text-sa-primary tabular-nums sm:text-[48px]"
        aria-label={`${formatPointQuantity(active)} store reward points`}
      >
        {formatPointQuantity(active)}
      </p>
      <h2
        id="store-rewards-heading"
        className="mt-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-sa-muted"
      >
        {known ? OMNICHANNEL_COPY.lastKnownHeading : "Active points"}
      </h2>
      <p className="mt-3 text-[13px] leading-relaxed text-sa-secondary">
        {known ? OMNICHANNEL_COPY.lastKnownHint : OMNICHANNEL_COPY.linkedHint}
      </p>
      {stale ? (
        <p className="mt-2 text-[13px] leading-relaxed text-sa-secondary" role="status">
          {syncedAt ? `${OMNICHANNEL_COPY.lastSynced} ${syncedAt}` : OMNICHANNEL_COPY.stale}
        </p>
      ) : null}
      <RefreshControl control={refresh} />
    </section>
  );
}

/** Customer-safe D365 omnichannel status. Never a redemption control. */
export function OmnichannelRewardsCard({
  omnichannel,
  refresh = null,
}: {
  omnichannel: OmnichannelLoyaltyView | null | undefined;
  refresh?: OmnichannelRefreshControl | null;
}) {
  if (!omnichannel) return null;

  if (omnichannel.status === "LINKED" && omnichannel.balance?.activePoints) {
    return (
      <CardShell>
        <LinkedBalance omnichannel={omnichannel} refresh={refresh} />
      </CardShell>
    );
  }

  if (omnichannel.status === "LINKED") {
    return (
      <CardShell>
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-sa-muted">
          {OMNICHANNEL_COPY.eyebrow}
        </p>
        <p className="mt-3 max-w-[520px] text-[14px] leading-relaxed text-sa-secondary" role="status">
          {OMNICHANNEL_COPY.balanceUnavailable}
        </p>
        <RefreshControl control={refresh} />
      </CardShell>
    );
  }

  if (omnichannel.status === "NOT_ENROLLED") {
    return (
      <CardShell>
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-sa-muted">
          {OMNICHANNEL_COPY.eyebrow}
        </p>
        <p className="mt-3 max-w-[520px] text-[14px] leading-relaxed text-sa-primary">
          {OMNICHANNEL_COPY.notEnrolled}
        </p>
        <RefreshControl control={refresh} />
      </CardShell>
    );
  }

  if (omnichannel.status === "ACTION_REQUIRED") {
    return (
      <CardShell>
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-sa-muted">
          {OMNICHANNEL_COPY.eyebrow}
        </p>
        <p className="mt-3 max-w-[520px] text-[14px] leading-relaxed text-sa-primary">
          {OMNICHANNEL_COPY.actionRequired}
        </p>
        <Link
          href="/faq#contact"
          className="mt-4 inline-flex text-[12.5px] font-semibold text-terra hover:underline"
        >
          {OMNICHANNEL_COPY.contact}
        </Link>
        <RefreshControl control={refresh} />
      </CardShell>
    );
  }

  return (
    <CardShell>
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-sa-muted">
        {OMNICHANNEL_COPY.eyebrow}
      </p>
      <p className="mt-3 max-w-[520px] text-[14px] leading-relaxed text-sa-secondary" role="status">
        {OMNICHANNEL_COPY.unavailable}
      </p>
      <RefreshControl control={refresh} />
    </CardShell>
  );
}
