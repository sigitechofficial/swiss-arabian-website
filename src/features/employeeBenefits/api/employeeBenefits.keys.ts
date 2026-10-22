export const employeeBenefitsKeys = {
  all: ["employee-benefits"] as const,
  link: (customerId: string) => [...employeeBenefitsKeys.all, "link", customerId] as const,
  benefits: (customerId: string) => [...employeeBenefitsKeys.all, "benefits", customerId] as const,
};
