"use client";

import { useEffect, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageLoading } from "@/components/ui/PageLoading";
import { AccountBreadcrumb } from "@/features/account/components/AccountBreadcrumb";
import { AccountPageShell } from "@/features/account/components/AccountPageShell";
import { accountContainer } from "@/features/account/constants/accountLayout";
import {
  accountBtnPrimary,
  accountInputClass,
} from "@/features/account/constants/accountForm";
import { ApiClientError } from "@/lib/api/apiError";
import { getUserFacingErrorMessage } from "@/lib/api/userFacingErrors";
import {
  acceptInvitationSchema,
  type AcceptInvitationFormValues,
} from "../schemas/acceptInvitation.schema";
import { useEmployeeBenefitsAccount } from "../hooks/useEmployeeBenefitsAccount";
import {
  acceptInvitationMessage,
  EMPLOYEE_BENEFITS_COPY as COPY,
  formatBenefitQuantity,
  type EmployeeBenefitRowView,
  type EmployeeBenefitsView,
  type EmployeeLinkView,
} from "../types/employeeBenefits";

function Card({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-sa-border bg-page px-5 py-6 sm:px-7 sm:py-7">{children}</div>
  );
}

function syncedLabel(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
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

function ConnectForm({
  onSubmit,
  pending,
  error,
}: {
  onSubmit: (values: AcceptInvitationFormValues) => Promise<unknown>;
  pending: boolean;
  error: string | null;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AcceptInvitationFormValues>({
    resolver: zodResolver(acceptInvitationSchema),
    defaultValues: { invitationId: "", claimSecret: "" },
  });

  useEffect(() => () => reset({ invitationId: "", claimSecret: "" }), [reset]);

  return (
    <form
      className="mt-6 grid max-w-[480px] gap-4"
      autoComplete="off"
      onSubmit={handleSubmit(async (values) => {
        try {
          await onSubmit(values);
          reset({ invitationId: "", claimSecret: "" });
        } catch {
          reset({ invitationId: values.invitationId, claimSecret: "" });
        }
      })}
    >
      <h2 className="text-[16px] font-semibold text-sa-primary">{COPY.connectHeading}</h2>
      <p className="text-[13px] leading-relaxed text-sa-secondary">{COPY.connectHint}</p>
      <label className="grid gap-1.5">
        <span className="text-[12px] font-semibold text-sa-primary">{COPY.invitationId}</span>
        <input
          {...register("invitationId")}
          type="text"
          autoComplete="off"
          className={accountInputClass}
          disabled={pending}
        />
        {errors.invitationId ? (
          <span className="text-[12px] text-red-600">{errors.invitationId.message}</span>
        ) : null}
      </label>
      <label className="grid gap-1.5">
        <span className="text-[12px] font-semibold text-sa-primary">{COPY.claimSecret}</span>
        <input
          {...register("claimSecret")}
          type="password"
          autoComplete="off"
          className={accountInputClass}
          disabled={pending}
        />
        {errors.claimSecret ? (
          <span className="text-[12px] text-red-600">{errors.claimSecret.message}</span>
        ) : null}
      </label>
      {error ? (
        <p className="text-[13px] text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      <button type="submit" className={accountBtnPrimary} disabled={pending}>
        {pending ? COPY.connecting : COPY.submit}
      </button>
    </form>
  );
}

function BenefitCard({ row }: { row: EmployeeBenefitRowView }) {
  const unverified = !row.unitStatus || row.unitStatus.toUpperCase() === "NOT_VERIFIED";
  const synced = syncedLabel(row.lastSyncedAt);
  return (
    <article className="rounded-lg border border-sa-border px-4 py-4 sm:px-5">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-sa-muted">{COPY.affiliation}</p>
      <p className="mt-1 text-[16px] font-semibold text-sa-primary">{row.affiliationName ?? "Staff affiliation"}</p>
      <dl className="mt-4 grid gap-3 sm:grid-cols-3">
        <div>
          <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-sa-muted">{COPY.limit}</dt>
          <dd className="mt-1 text-[14px] font-semibold tabular-nums text-sa-primary">{quantity(row.amountLimit)}</dd>
        </div>
        <div>
          <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-sa-muted">{COPY.used}</dt>
          <dd className="mt-1 text-[14px] font-semibold tabular-nums text-sa-primary">{quantity(row.amountUsed)}</dd>
        </div>
        <div>
          <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-sa-muted">{COPY.remaining}</dt>
          <dd className="mt-1 text-[14px] font-semibold tabular-nums text-sa-primary">
            {quantity(row.balanceRemaining)}
          </dd>
        </div>
      </dl>
      {unverified ? <p className="mt-3 text-[13px] text-sa-secondary">{COPY.unitsUnverified}</p> : null}
      {synced ? (
        <p className="mt-2 text-[12px] text-sa-muted">
          {COPY.lastSynced}: {synced}
        </p>
      ) : null}
      <p className="mt-3 text-[12px] leading-relaxed text-sa-secondary">{COPY.notSpendable}</p>
    </article>
  );
}

function ConnectedSummary({
  link,
  benefits,
}: {
  link: EmployeeLinkView;
  benefits: EmployeeBenefitsView | undefined;
}) {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-terra">{COPY.connected}</p>
        <p className="mt-2 max-w-[560px] text-[13px] leading-relaxed text-sa-secondary">{COPY.connectedHint}</p>
        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
          {benefits?.personnelNumber ? (
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-sa-muted">{COPY.employeeRef}</dt>
              <dd className="mt-1 text-[14px] text-sa-primary">{benefits.personnelNumber}</dd>
            </div>
          ) : null}
          {benefits?.designation ? (
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-sa-muted">{COPY.designation}</dt>
              <dd className="mt-1 text-[14px] text-sa-primary">{benefits.designation}</dd>
            </div>
          ) : null}
          <div>
            <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-sa-muted">{COPY.legalEntity}</dt>
            <dd className="mt-1 text-[14px] text-sa-primary">
              {benefits?.legalEntityCode ?? link.legalEntityCode ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-sa-muted">{COPY.authority}</dt>
            <dd className="mt-1 text-[14px] text-sa-primary">D365 staff discount (read only)</dd>
          </div>
        </dl>
      </Card>
      {benefits?.eligible === false ? (
        <Card>
          <p className="text-[14px] text-sa-primary">{COPY.ineligible}</p>
        </Card>
      ) : null}
      {benefits && benefits.eligible !== false && benefits.benefits.length === 0 ? (
        <Card>
          <p className="text-[14px] text-sa-primary">{COPY.emptyBenefits}</p>
        </Card>
      ) : null}
      {benefits?.benefits.map((row, index) => (
        <BenefitCard key={`${row.affiliationName ?? "benefit"}-${index}`} row={row} />
      ))}
    </div>
  );
}

function Unavailable({ status }: { status: string }) {
  return (
    <Card>
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-sa-muted">{status}</p>
      <p className="mt-3 max-w-[520px] text-[14px] leading-relaxed text-sa-primary">{COPY.unavailable}</p>
      <p className="mt-3 max-w-[520px] text-[13px] leading-relaxed text-sa-secondary">{COPY.support}</p>
    </Card>
  );
}

function acceptErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError && error.status === 401) {
    return "Your session has expired. Please sign in again.";
  }
  if (error instanceof ApiClientError) {
    return acceptInvitationMessage(error.message);
  }
  return getUserFacingErrorMessage(error);
}

export function EmployeeBenefitsAccountView() {
  const { link, benefits, accept, bootstrapped, isAuthenticated } = useEmployeeBenefitsAccount();

  const connect = (values: AcceptInvitationFormValues) => accept.unwrap(values);

  let body;
  if (!bootstrapped || !isAuthenticated) {
    body = <PageLoading label={!bootstrapped ? "Checking session…" : "Redirecting…"} />;
  } else if (link.isPending) {
    body = <PageLoading label="Loading Employee Benefits…" />;
  } else if (link.isError) {
    const status = link.error instanceof ApiClientError ? link.error.status : 0;
    body = (
      <Card>
        <p className="text-[14px] text-sa-primary">
          {status === 403 ? COPY.unavailable : COPY.loadError}
        </p>
        {status !== 401 ? (
          <button type="button" className={`${accountBtnPrimary} mt-4`} onClick={() => void link.refetch()}>
            {COPY.retry}
          </button>
        ) : null}
      </Card>
    );
  } else if (link.data?.status === "SUSPENDED" || link.data?.status === "REVOKED") {
    body = <Unavailable status={link.data.status} />;
  } else if (link.data?.status === "ACTIVE") {
    body = benefits.isError ? (
      <Card>
        <p className="text-[14px] text-sa-primary">{COPY.loadError}</p>
        <button type="button" className={`${accountBtnPrimary} mt-4`} onClick={() => void benefits.refetch()}>
          {COPY.retry}
        </button>
      </Card>
    ) : benefits.isPending ? (
      <PageLoading label="Loading Employee Benefits…" />
    ) : (
      <ConnectedSummary link={link.data} benefits={benefits.data} />
    );
  } else {
    body = (
      <Card>
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-sa-muted">{COPY.notConnected}</p>
        <p className="mt-3 max-w-[560px] text-[14px] leading-relaxed text-sa-primary">{COPY.intro}</p>
        <ConnectForm
          onSubmit={connect}
          pending={accept.isPending}
          error={accept.error ? acceptErrorMessage(accept.error) : null}
        />
      </Card>
    );
  }

  return (
    <AccountPageShell>
      <AccountBreadcrumb label={COPY.title} />
      <div className={`${accountContainer} pb-2 pt-7 sm:pt-8`}>
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-sa-muted">{COPY.eyebrow}</p>
        <h1 className="mt-2 text-[22px] font-bold leading-tight text-sa-primary sm:text-[26px] lg:text-[30px]">
          {COPY.title}
        </h1>
      </div>
      <div className={`${accountContainer} pb-16 pt-4`}>{body}</div>
    </AccountPageShell>
  );
}
