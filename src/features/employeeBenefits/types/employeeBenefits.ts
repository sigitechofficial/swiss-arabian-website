/** Storefront Employee Benefits — identity link + read-only D365 staff-discount view. */

export type EmployeeLinkStatus = "ACTIVE" | "SUSPENDED" | "REVOKED";

export type EmployeeLinkView = {
  linked: boolean;
  status: EmployeeLinkStatus | null;
  legalEntityCode: string | null;
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
  designation: string | null;
  legalEntityCode: string | null;
  benefits: EmployeeBenefitRowView[];
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
    designation: readTrimmed(row.designation),
    legalEntityCode: readTrimmed(row.legalEntityCode),
    benefits,
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
    "Employee Benefits are available only to verified Swiss Arabian employees whose Storefront customer account has been linked through an authorised invitation.",
  connectHeading: "Connect my employee account",
  connectHint:
    "Enter the invitation ID and claim code you received through the approved verification process. We never ask for an employee ID as proof of identity.",
  invitationId: "Invitation ID",
  claimSecret: "Invitation claim code",
  submit: "Connect account",
  connecting: "Connecting…",
  connected: "Connected",
  connectedHint: "This Storefront account is linked to a verified employee record. Figures below are read-only.",
  notConnected: "Not connected",
  unavailable: "Employee Benefits are currently unavailable for this account.",
  ineligible: "This linked account is not eligible for staff benefits right now.",
  emptyBenefits: "No staff benefit record is available for this affiliation yet.",
  loadError: "We couldn’t load Employee Benefits right now.",
  retry: "Try again",
  limit: "Staff Benefit Limit",
  used: "Recorded Usage",
  remaining: "Remaining Staff Benefit",
  affiliation: "Staff Affiliation",
  lastSynced: "Last Synced from D365",
  unitsUnverified: "D365 units — not verified",
  authority: "Source authority",
  employeeRef: "Employee reference",
  designation: "Designation",
  legalEntity: "Legal entity",
  notSpendable: "These figures cannot be spent online yet.",
  support: "If you believe this is a mistake, contact HR or store support through the approved process.",
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
