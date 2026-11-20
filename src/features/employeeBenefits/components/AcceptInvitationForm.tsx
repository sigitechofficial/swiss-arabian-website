"use client";

import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { accountBtnPrimary, accountInputClass } from "@/features/account/constants/accountForm";
import { ApiClientError } from "@/lib/api/apiError";
import { employeeBenefitsKeys } from "../api/employeeBenefits.keys";
import { acceptEmployeeInvitation } from "../api/employeeBenefits.service";
import { acceptInvitationSchema } from "../schemas/acceptInvitation.schema";
import { acceptInvitationMessage } from "../types/employeeBenefits";
import { useEmployeeBenefitsCopy } from "./useEmployeeBenefitsCopy";

/**
 * Lets a signed-in customer claim an employee link that HR issued for this account.
 * The Backend checks the invitation belongs to this customer, so nothing is inferred here.
 */
export function AcceptInvitationForm() {
  const copy = useEmployeeBenefitsCopy();
  const queryClient = useQueryClient();
  const [invitationId, setInvitationId] = useState("");
  const [claimSecret, setClaimSecret] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);

  const accept = useMutation({
    mutationFn: acceptEmployeeInvitation,
    onSuccess: () => {
      setClaimSecret("");
      // Link, context and benefits all change once the link is active.
      void queryClient.invalidateQueries({ queryKey: employeeBenefitsKeys.all });
    },
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = acceptInvitationSchema.safeParse({ invitationId, claimSecret });
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? null);
      return;
    }
    setFieldError(null);
    accept.mutate(parsed.data);
  }

  const apiMessage = accept.error instanceof ApiClientError ? accept.error.message : undefined;
  const error = fieldError ?? (accept.isError ? acceptInvitationMessage(apiMessage) : null);

  return (
    <form onSubmit={onSubmit} className="mt-6 border-t border-sa-border pt-6" noValidate>
      <p className="text-[14px] font-semibold text-sa-primary">{copy.acceptTitle}</p>
      <p className="mt-1 max-w-[560px] text-[13px] leading-relaxed text-sa-secondary">{copy.acceptHint}</p>
      <div className="mt-4 grid max-w-[560px] gap-3">
        <label className="grid gap-1 text-[12px] font-semibold text-sa-muted">
          {copy.invitationId}
          <input
            className={accountInputClass}
            value={invitationId}
            onChange={(event) => setInvitationId(event.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
        </label>
        <label className="grid gap-1 text-[12px] font-semibold text-sa-muted">
          {copy.claimSecret}
          <input
            className={accountInputClass}
            type="password"
            value={claimSecret}
            onChange={(event) => setClaimSecret(event.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
        </label>
      </div>
      {error ? (
        <p className="mt-3 text-[13px] text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      {accept.isSuccess ? (
        <p className="mt-3 text-[13px] text-sa-primary" role="status">
          {accept.data.alreadyAccepted ? copy.acceptAlready : copy.acceptSuccess}
        </p>
      ) : null}
      <button type="submit" className={`${accountBtnPrimary} mt-4`} disabled={accept.isPending}>
        {accept.isPending ? copy.acceptSubmitting : copy.acceptSubmit}
      </button>
    </form>
  );
}
