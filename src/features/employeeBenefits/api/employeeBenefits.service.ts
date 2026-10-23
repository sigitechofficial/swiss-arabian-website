import { apiGet, apiPost } from "@/lib/api/apiClient";
import {
  readAcceptInvitationResult,
  readEmployeeBenefits,
  readEmployeeContext,
  readEmployeeLink,
  trustedZoneCode,
  type AcceptEmployeeInvitationResult,
  type EmployeeBenefitsView,
  type EmployeeContextView,
  type EmployeeLinkView,
} from "../types/employeeBenefits";

const BASE = "/storefront/employee-benefits";

function zoneQuery(zoneCode: string): string {
  const code = trustedZoneCode(zoneCode);
  if (!code) {
    throw new Error("Employee Benefits require the current market zone.");
  }
  return new URLSearchParams({ zoneCode: code }).toString();
}

export async function fetchEmployeeLink(zoneCode: string): Promise<EmployeeLinkView> {
  const data = await apiGet<unknown>(`${BASE}/link?${zoneQuery(zoneCode)}`);
  return readEmployeeLink(data);
}

export async function fetchEmployeeContext(zoneCode: string): Promise<EmployeeContextView> {
  const data = await apiGet<unknown>(`${BASE}/context?${zoneQuery(zoneCode)}`);
  return readEmployeeContext(data);
}

export async function fetchEmployeeBenefits(zoneCode: string): Promise<EmployeeBenefitsView> {
  const data = await apiGet<unknown>(`${BASE}?${zoneQuery(zoneCode)}`);
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
