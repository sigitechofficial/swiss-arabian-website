/** Storefront Employee Benefits — identity link + read-only D365 staff-discount view. */

export type EmployeeLinkStatus = "ACTIVE" | "SUSPENDED" | "REVOKED";

export type EmployeeLinkView = {
  linked: boolean;
  status: EmployeeLinkStatus | null;
  legalEntityCode: string | null;
};

export type EmployeeContextView = {
  isEmployee: boolean;
  employeeLinkStatus: EmployeeLinkStatus | null;
  legalEntityCode: string | null;
  employeeId: string | null;
  personnelNumber: string | null;
  fullName: string | null;
};

export type EmployeeBenefitUnitStatus = "NOT_VERIFIED" | "VERIFIED" | string;

export type EmployeeBenefitRowView = {
  affiliationName: string | null;
  amountLimit: string | null;
  amountUsed: string | null;
  balanceRemaining: string | null;
  lastSyncedAt: string | null;
  unitStatus: EmployeeBenefitUnitStatus | null;
};

export type EmployeeBenefitsView = {
  linked: boolean;
  eligible: boolean | null;
  authority: "D365_STAFF_DISCOUNT";
  financialWriteEnabled: false;
  personnelNumber: string | null;
  fullName: string | null;
  designation: string | null;
  legalEntityCode: string | null;
  benefits: EmployeeBenefitRowView[];
  websiteAccounting: EmployeeWebsiteAccountingView | null;
};

export type EmployeeWebsiteAccountingView = {
  availability: "AVAILABLE" | "UNAVAILABLE_SCHEMA";
  currencyCode: string | null;
  activeProvisionalHolds: string | null;
  paidUsagePendingD365: string | null;
  websiteAvailableAllowance: string | null;
  d365ReconciliationStatus: string | null;
};

export type AcceptEmployeeInvitationResult = {
  status: "ACTIVE";
  alreadyAccepted: boolean;
};

const LINK_STATUSES = new Set<EmployeeLinkStatus>(["ACTIVE", "SUSPENDED", "REVOKED"]);

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function readTrimmed(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text || null;
}

const DECIMAL_RE = /^-?(?:0|[1-9]\d*)(?:\.\d+)?$/;

/** Display grouping for a decimal STRING. Does not use Number / parseFloat. */
export function formatBenefitQuantity(value: string): string {
  const trimmed = value.trim();
  if (!DECIMAL_RE.test(trimmed)) return trimmed;
  const negative = trimmed.startsWith("-");
  const unsigned = negative ? trimmed.slice(1) : trimmed;
  const dot = unsigned.indexOf(".");
  const intPart = dot === -1 ? unsigned : unsigned.slice(0, dot);
  const frac = dot === -1 ? "" : unsigned.slice(dot + 1);
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const body = frac ? `${grouped}.${frac}` : grouped;
  return negative ? `−${body}` : body;
}

function readLinkStatus(value: unknown): EmployeeLinkStatus | null {
  if (typeof value !== "string") return null;
  const key = value.trim().toUpperCase();
  if (LINK_STATUSES.has(key as EmployeeLinkStatus)) return key as EmployeeLinkStatus;
  return null;
}

export function readEmployeeLink(raw: unknown): EmployeeLinkView {
  const row = asRecord(raw) ?? {};
  const status = readLinkStatus(row.status);
  return {
    linked: row.linked === true && status === "ACTIVE",
    status,
    legalEntityCode: readTrimmed(row.legalEntityCode),
  };
}

/**
 * Backend `isEmployee` only. Never inferred from phone, name, email, or a typed personnel number.
 * Legal entity is whatever the Backend resolved from zoneCode — never derived in the Storefront.
 */
export function readEmployeeContext(raw: unknown): EmployeeContextView {
  const row = asRecord(raw) ?? {};
  const legalEntityCode = trustedLegalEntityCode(readTrimmed(row.legalEntityCode));
  const employeeLinkStatus = readLinkStatus(row.employeeLinkStatus);
  const isEmployee = row.isEmployee === true;
  return {
    isEmployee,
    employeeLinkStatus: isEmployee ? employeeLinkStatus ?? "ACTIVE" : employeeLinkStatus,
    legalEntityCode,
    employeeId: isEmployee ? readTrimmed(row.employeeId) : null,
    personnelNumber: isEmployee ? readTrimmed(row.personnelNumber) : null,
    fullName: isEmployee ? readTrimmed(row.fullName) : null,
  };
}

/** Selected market zone from catalog context — never a customer-typed value. */
export function trustedZoneCode(value?: string | null): string | null {
  const code = value?.trim() || "";
  return code || null;
}

/** Backend-resolved legal entity on a response — never sent as a GET query argument. */
export function trustedLegalEntityCode(value?: string | null): string | null {
  const code = value?.trim().toUpperCase() || "";
  return code || null;
}

function readBenefitRow(raw: unknown): EmployeeBenefitRowView | null {
  const row = asRecord(raw);
  if (!row) return null;
  return {
    affiliationName: readTrimmed(row.affiliationName),
    amountLimit: readTrimmed(row.amountLimit),
    amountUsed: readTrimmed(row.amountUsed),
    balanceRemaining: readTrimmed(row.balanceRemaining),
    lastSyncedAt: readTrimmed(row.lastSyncedAt),
    unitStatus: readTrimmed(row.unitStatus),
  };
}

function readWebsiteAccounting(raw: unknown): EmployeeWebsiteAccountingView | null {
  const row = asRecord(raw);
  if (!row) return null;
  if (row.availability === "UNAVAILABLE_SCHEMA") {
    return {
      availability: "UNAVAILABLE_SCHEMA",
      currencyCode: readTrimmed(row.currencyCode),
      activeProvisionalHolds: null,
      paidUsagePendingD365: null,
      websiteAvailableAllowance: null,
      d365ReconciliationStatus: null,
    };
  }
  if (row.availability !== "AVAILABLE") return null;
  return {
    availability: "AVAILABLE",
    currencyCode: readTrimmed(row.currencyCode),
    activeProvisionalHolds: readTrimmed(row.activeProvisionalHolds),
    paidUsagePendingD365: readTrimmed(row.paidUsagePendingD365),
    websiteAvailableAllowance: readTrimmed(row.websiteAvailableAllowance),
    d365ReconciliationStatus: readTrimmed(row.d365ReconciliationStatus),
  };
}

export function readEmployeeBenefits(raw: unknown): EmployeeBenefitsView {
  const row = asRecord(raw) ?? {};
  const benefits = Array.isArray(row.benefits)
    ? row.benefits.flatMap((item) => {
        const next = readBenefitRow(item);
        return next ? [next] : [];
      })
    : [];
  return {
    linked: row.linked === true,
    eligible: typeof row.eligible === "boolean" ? row.eligible : null,
    authority: "D365_STAFF_DISCOUNT",
    financialWriteEnabled: false,
    personnelNumber: readTrimmed(row.personnelNumber),
    fullName: readTrimmed(row.fullName),
    designation: readTrimmed(row.designation),
    legalEntityCode: readTrimmed(row.legalEntityCode),
    benefits,
    websiteAccounting: readWebsiteAccounting(row.websiteAccounting),
  };
}

export function readAcceptInvitationResult(raw: unknown): AcceptEmployeeInvitationResult {
  const row = asRecord(raw) ?? {};
  return {
    status: "ACTIVE",
    alreadyAccepted: row.alreadyAccepted === true,
  };
}

export const EMPLOYEE_BENEFITS_COPY = {
  title: "Employee Benefits",
  eyebrow: "Staff affiliation",
  intro:
    "Employee Benefits are shown when this customer account has a verified active staff link in the current market.",
  adminLink:
    "Employee account linking for this market can be completed through Swiss Arabian Admin verification.",
  loyaltyBalance: "Online rewards",
  loyaltyUnavailable: "Online rewards aren’t available for this account.",
  loyaltyUnchanged:
    "This figure is the website rewards wallet. It is not the store loyalty balance and it is not the staff allowance.",
  connected: "Connected",
  connectedHint: "This Storefront account is linked to a verified employee record. Figures below are read-only.",
  notConnected: "Not connected",
  unavailable: "Employee Benefits are currently unavailable for this account.",
  ineligible: "This linked account is not eligible for staff benefits right now.",
  emptyBenefits: "No staff benefit record is available for this affiliation yet.",
  loadError: "We couldn’t load Employee Benefits right now.",
  websiteAccountingUnavailable:
    "Your D365 employee benefit information is available. Website allowance tracking is temporarily unavailable.",
  retry: "Try again",
  limit: "Amount limit",
  used: "Amount used in D365",
  remaining: "Balance remaining in D365",
  provisionalUse: "Website provisional consumption",
  projectedRemaining: "Projected remaining. Not yet deducted in D365",
  affiliation: "Staff Affiliation",
  lastSynced: "Last Synced from D365",
  unitsUnverified: "D365 units — not verified",
  authority: "Source authority",
  employeeRef: "Personnel number",
  employeeName: "Employee name",
  designation: "Designation",
  legalEntity: "Legal entity",
  notSpendable: "These figures cannot be spent online yet.",
  support: "If you believe this is a mistake, contact HR or store support through the approved process.",
  rewardsSeparate: "Customer Rewards",
  waitingMarket: "Waiting for the current market…",
} as const;

export function acceptInvitationMessage(message: string | undefined): string {
  const text = message?.trim() ?? "";
  if (text === "Invitation is not active") {
    return "This invitation is expired or has already been used.";
  }
  if (text === "An active employee link already exists") {
    return "This customer account is already linked to an employee.";
  }
  if (text === "Employee is not eligible for a new link") {
    return "Employee Benefits are currently unavailable for this invitation.";
  }
  if (text === "Invitation cannot be accepted") {
    return "This invitation cannot be accepted with this account.";
  }
  if (!text) return "This invitation cannot be accepted right now.";
  return text;
}
