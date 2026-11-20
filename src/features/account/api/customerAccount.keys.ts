export const customerAccountKeys = {
  all: ["customer-account"] as const,
  addresses: () => [...customerAccountKeys.all, "addresses"] as const,
  phones: () => [...customerAccountKeys.all, "phones"] as const,
  communication: () => [...customerAccountKeys.all, "communication"] as const,
};
