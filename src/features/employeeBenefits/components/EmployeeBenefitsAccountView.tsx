"use client";

import type { ReactNode } from "react";
import { PageLoading } from "@/components/ui/PageLoading";
import { AccountBreadcrumb } from "@/features/account/components/AccountBreadcrumb";
import { AccountPageShell } from "@/features/account/components/AccountPageShell";
import { accountContainer } from "@/features/account/constants/accountLayout";
import { accountBtnPrimary } from "@/features/account/constants/accountForm";
import { useLoyaltyAccount } from "@/features/loyalty/hooks/useLoyaltyAccount";
import { isPositiveServerMoney, websiteHoldLabel } from "../types/employeeCheckout";
import { useCartStore } from "@/stores/useCartStore";
import { formatPoints } from "@/features/loyalty/types/loyalty";
import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { intlLocale } from "@/lib/i18n/locales";
import { useShopLocale } from "@/lib/i18n/ShopLocaleProvider";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { useEmployeeBenefitsCopy } from "./useEmployeeBenefitsCopy";
import { ApiClientError } from "@/lib/api/apiError";
import { useEmployeeBenefitsAccount } from "../hooks/useEmployeeBenefitsAccount";
import {
  formatBenefitQuantity,
  type EmployeeBenefitRowView,
  type EmployeeBenefitsView,
  type EmployeeContextView,
} from "../types/employeeBenefits";

function Card({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-sa-border bg-page px-5 py-6 sm:px-7 sm:py-7">{children}</div>
  );
}

function syncedLabel(value: string | null, locale = "en"): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : intlLocale(locale), {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function quantity(value: string | null): string {
  if (!value) return "—";
  return formatBenefitQuantity(value);
}

function BenefitCard({ row }: { row: EmployeeBenefitRowView }) {
  const copy = useEmployeeBenefitsCopy();
  const t = useShopCopy();
  const locale = useShopLocale();
  const unverified = !row.unitStatus || row.unitStatus.toUpperCase() === "NOT_VERIFIED";
  const synced = syncedLabel(row.lastSyncedAt, locale);
  return (
    <article className="rounded-lg border border-sa-border px-4 py-4 sm:px-5">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-sa-muted">{copy.affiliation}</p>
      <p className="mt-1 text-[16px] font-semibold text-sa-primary">{row.affiliationName ?? t("employee.staffAffiliation")}</p>
      <dl className="mt-4 grid gap-3 sm:grid-cols-3">
        <div>
          <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-sa-muted">{copy.limit}</dt>
          <dd className="mt-1 text-[14px] font-semibold tabular-nums text-sa-primary">{quantity(row.amountLimit)}</dd>
        </div>
        <div>
          <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-sa-muted">{copy.used}</dt>
          <dd className="mt-1 text-[14px] font-semibold tabular-nums text-sa-primary">{quantity(row.amountUsed)}</dd>
        </div>
        <div>
          <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-sa-muted">{copy.remaining}</dt>
          <dd className="mt-1 text-[14px] font-semibold tabular-nums text-sa-primary">
            {quantity(row.balanceRemaining)}
          </dd>
        </div>
      </dl>
      {unverified ? <p className="mt-3 text-[13px] text-sa-secondary">{copy.unitsUnverified}</p> : null}
      {synced ? (
        <p className="mt-2 text-[12px] text-sa-muted">
          {copy.lastSynced}: {synced}
        </p>
      ) : null}
      <p className="mt-3 text-[12px] leading-relaxed text-sa-secondary">{copy.notSpendable}</p>
    </article>
  );
}

function sameLegalEntity(left: string | null | undefined, right: string | null | undefined): boolean {
  return Boolean(left && right && left.trim().toUpperCase() === right.trim().toUpperCase());
}

function LoyaltyAside() {
  const copy = useEmployeeBenefitsCopy();
  const { wallet } = useLoyaltyAccount();
  const data = wallet.data;
  const showPoints = Boolean(
    data?.hasServerWallet && (data.availability === "ACTIVE" || data.availablePoints !== 0),
  );
  return (
    <Card>
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-sa-muted">{copy.loyaltyBalance}</p>
      {showPoints && data ? (
        <p className="mt-2 text-[20px] font-semibold tabular-nums text-sa-primary">{formatPoints(data.availablePoints)}</p>
      ) : (
        <p className="mt-2 text-[14px] leading-relaxed text-sa-primary">{copy.loyaltyUnavailable}</p>
      )}
      <p className="mt-3 max-w-[560px] text-[13px] leading-relaxed text-sa-secondary">{copy.loyaltyUnchanged}</p>
      <LocaleLink href="/account/rewards" className="mt-3 inline-block text-[13px] font-semibold text-terra hover:underline">
        {copy.rewardsSeparate}
      </LocaleLink>
    </Card>
  );
}

function CartAllowanceNote() {
  const copy = useEmployeeBenefitsCopy();
  const t = useShopCopy();
  const checkout = useCartStore((state) => state.employeeCheckout);
  const allowance = checkout?.allowance;
  if (!checkout?.authorized) return null;
  const hold = websiteHoldLabel(allowance?.websiteHold);
  const showConsumption = checkout.pricingApplied && isPositiveServerMoney(allowance?.thisPurchaseConsumption);
  if (!hold && !showConsumption) return null;
  return (
    <Card>
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-sa-muted">{copy.provisionalUse}</p>
      {showConsumption ? <p className="mt-2 text-[14px] text-sa-primary">{allowance?.thisPurchaseConsumption}</p> : null}
      {showConsumption && allowance?.projectedRemaining ? (
        <p className="mt-2 text-[13px] text-sa-secondary">
          {copy.projectedRemaining}: {allowance.projectedRemaining}
          {allowance.projectedIsAuthoritative === true ? t("employee.authoritative") : t("employee.projectionOnly")}
        </p>
      ) : null}
      {showConsumption && isPositiveServerMoney(allowance?.otherProvisionalHolds) ? (
        <p className="mt-2 text-[13px] text-sa-secondary">
          {t("employee.otherHolds", { amount: allowance?.otherProvisionalHolds ?? "" })}
        </p>
      ) : null}
      {hold ? <p className="mt-2 text-[13px] text-sa-secondary">{hold}</p> : null}
      <p className="mt-3 text-[12px] leading-relaxed text-sa-secondary">
        {t("employee.notConfirmed")}
      </p>
    </Card>
  );
}

function ConnectedSummary({
  context,
  benefits,
}: {
  context: EmployeeContextView;
  benefits: EmployeeBenefitsView | undefined;
}) {
  const copy = useEmployeeBenefitsCopy();
  const t = useShopCopy();
  const sameRecord =
    !benefits?.legalEntityCode || sameLegalEntity(benefits.legalEntityCode, context.legalEntityCode);
  const scoped = sameRecord ? benefits : undefined;
  const reference = (sameRecord ? benefits?.personnelNumber : null) ?? context.personnelNumber;
  const employeeName = (sameRecord ? benefits?.fullName : null) ?? context.fullName;
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-terra">{copy.connected}</p>
        <p className="mt-2 max-w-[560px] text-[13px] leading-relaxed text-sa-secondary">{copy.connectedHint}</p>
        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
          {reference ? (
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-sa-muted">{copy.employeeRef}</dt>
              <dd className="mt-1 text-[14px] text-sa-primary">{reference}</dd>
            </div>
          ) : null}
          {employeeName ? (
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-sa-muted">{copy.employeeName}</dt>
              <dd className="mt-1 text-[14px] text-sa-primary">{employeeName}</dd>
            </div>
          ) : null}
          {scoped?.designation ? (
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-sa-muted">{copy.designation}</dt>
              <dd className="mt-1 text-[14px] text-sa-primary">{scoped.designation}</dd>
            </div>
          ) : null}
          <div>
            <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-sa-muted">{copy.legalEntity}</dt>
            <dd className="mt-1 text-[14px] text-sa-primary">{context.legalEntityCode ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-sa-muted">{copy.authority}</dt>
            <dd className="mt-1 text-[14px] text-sa-primary">{t("employee.authorityValue")}</dd>
          </div>
        </dl>
      </Card>
      <LoyaltyAside />
      <CartAllowanceNote />
      {scoped?.eligible === false ? (
        <Card>
          <p className="text-[14px] text-sa-primary">{copy.ineligible}</p>
        </Card>
      ) : null}
      {scoped && scoped.eligible !== false && scoped.benefits.length === 0 ? (
        <Card>
          <p className="text-[14px] text-sa-primary">{copy.emptyBenefits}</p>
        </Card>
      ) : null}
      {scoped?.benefits.map((row, index) => (
        <BenefitCard key={`${row.affiliationName ?? "benefit"}-${index}`} row={row} />
      ))}
      {scoped?.websiteAccounting?.availability === "UNAVAILABLE_SCHEMA" ? (
        <Card>
          <p className="max-w-[560px] text-[14px] leading-relaxed text-sa-primary" role="status">
            {copy.websiteAccountingUnavailable}
          </p>
        </Card>
      ) : null}
    </div>
  );
}

function Unavailable({ status }: { status: string }) {
  const copy = useEmployeeBenefitsCopy();
  return (
    <Card>
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-sa-muted">{status}</p>
      <p className="mt-3 max-w-[520px] text-[14px] leading-relaxed text-sa-primary">{copy.unavailable}</p>
      <p className="mt-3 max-w-[520px] text-[13px] leading-relaxed text-sa-secondary">{copy.support}</p>
    </Card>
  );
}

function AdminLinkNote() {
  const copy = useEmployeeBenefitsCopy();
  return (
    <Card>
      <p className="max-w-[560px] text-[14px] leading-relaxed text-sa-primary">{copy.adminLink}</p>
      <LocaleLink href="/account/rewards" className="mt-4 inline-block text-[13px] font-semibold text-terra hover:underline">
        {copy.rewardsSeparate}
      </LocaleLink>
    </Card>
  );
}

export function EmployeeBenefitsAccountView() {
  const {
    link,
    context,
    benefits,
    isEmployee,
    zoneCode,
    legalEntityCode,
    bootstrapped,
    isAuthenticated,
  } = useEmployeeBenefitsAccount();
  const copy = useEmployeeBenefitsCopy();
  const t = useShopCopy();

  const currentLinkInEntity =
    Boolean(legalEntityCode) && sameLegalEntity(link.data?.legalEntityCode, legalEntityCode);
  const loadError = context.error ?? link.error;

  let body;
  if (!bootstrapped || !isAuthenticated) {
    body = <PageLoading label={!bootstrapped ? t("loadingLabel.session") : t("loadingLabel.redirecting")} />;
  } else if (!zoneCode) {
    body = <PageLoading label={copy.waitingMarket} />;
  } else if (context.isPending || link.isPending) {
    body = <PageLoading label={t("employee.loading")} />;
  } else if (context.isError || link.isError) {
    const status = loadError instanceof ApiClientError ? loadError.status : 0;
    body = (
      <Card>
        <p className="text-[14px] text-sa-primary">
          {status === 403 ? copy.unavailable : copy.loadError}
        </p>
        {status !== 401 ? (
          <button
            type="button"
            className={`${accountBtnPrimary} mt-4`}
            onClick={() => {
              void context.refetch();
              void link.refetch();
            }}
          >
            {copy.retry}
          </button>
        ) : null}
      </Card>
    );
  } else if (isEmployee && context.data) {
    body = benefits.isError ? (
      <Card>
        <p className="text-[14px] text-sa-primary">{copy.loadError}</p>
        <button type="button" className={`${accountBtnPrimary} mt-4`} onClick={() => void benefits.refetch()}>
          {copy.retry}
        </button>
      </Card>
    ) : benefits.isPending ? (
      <PageLoading label={t("employee.loading")} />
    ) : (
      <ConnectedSummary context={context.data} benefits={benefits.data} />
    );
  } else if (
    currentLinkInEntity &&
    (link.data?.status === "SUSPENDED" || link.data?.status === "REVOKED")
  ) {
    body = <Unavailable status={link.data.status} />;
  } else {
    body = <AdminLinkNote />;
  }

  return (
    <AccountPageShell>
      <AccountBreadcrumb label={copy.title} />
      <div className={`${accountContainer} pb-2 pt-7 sm:pt-8`}>
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-sa-muted">{copy.eyebrow}</p>
        <h1 className="mt-2 text-[22px] font-bold leading-tight text-sa-primary sm:text-[26px] lg:text-[30px]">
          {copy.title}
        </h1>
      </div>
      <div className={`${accountContainer} pb-16 pt-4`}>{body}</div>
    </AccountPageShell>
  );
}
