export const customerAccountKeys = {
  all: ["customer-account"] as const,
  addresses: () => [...customerAccountKeys.all, "addresses"] as const,
  phones: () => [...customerAccountKeys.all, "phones"] as const,
  consents: () => [...customerAccountKeys.all, "consents"] as const,
};
