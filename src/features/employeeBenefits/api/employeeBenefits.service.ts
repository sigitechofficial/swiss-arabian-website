import { apiGet, apiPost } from "@/lib/api/apiClient";
import {
  readAcceptInvitationResult,
  readEmployeeBenefits,
  readEmployeeLink,
  type AcceptEmployeeInvitationResult,
  type EmployeeBenefitsView,
  type EmployeeLinkView,
} from "../types/employeeBenefits";

const BASE = "/storefront/employee-benefits";

export async function fetchEmployeeLink(): Promise<EmployeeLinkView> {
  const data = await apiGet<unknown>(`${BASE}/link`);
  return readEmployeeLink(data);
}

export async function fetchEmployeeBenefits(): Promise<EmployeeBenefitsView> {
  const data = await apiGet<unknown>(BASE);
  return readEmployeeBenefits(data);
}

export async function acceptEmployeeInvitation(input: {
  invitationId: string;
  claimSecret: string;
}): Promise<AcceptEmployeeInvitationResult> {
  const data = await apiPost<unknown>(`${BASE}/invitations/accept`, {
    invitationId: input.invitationId,
    claimSecret: input.claimSecret,
  });
  return readAcceptInvitationResult(data);
}
