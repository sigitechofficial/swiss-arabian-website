export const employeeBenefitsKeys = {
  all: ["employee-benefits"] as const,
  link: (customerId: string, zoneCode: string) =>
    [...employeeBenefitsKeys.all, "link", customerId, zoneCode] as const,
  context: (customerId: string, zoneCode: string) =>
    [...employeeBenefitsKeys.all, "context", customerId, zoneCode] as const,
  benefits: (customerId: string, zoneCode: string, legalEntityCode: string) =>
    [...employeeBenefitsKeys.all, "benefits", customerId, zoneCode, legalEntityCode] as const,
};
