import { z } from "zod";

export const ADDRESS_COUNTRIES = [
  { name: "United Arab Emirates", code: "AE" },
  { name: "Saudi Arabia", code: "SA" },
  { name: "Qatar", code: "QA" },
  { name: "Kuwait", code: "KW" },
  { name: "Bahrain", code: "BH" },
  { name: "Oman", code: "OM" },
] as const;

export const UAE_EMIRATES = [
  "Abu Dhabi",
  "Dubai",
  "Sharjah",
  "Ajman",
  "Umm Al Quwain",
  "Ras Al Khaimah",
  "Fujairah",
] as const;

export const addressBookSchema = z.object({
  firstName: z.string().trim().max(100).optional().or(z.literal("")),
  lastName: z.string().trim().max(100).optional().or(z.literal("")),
  address1: z.string().trim().min(1, "Address is required").max(255),
  address2: z.string().trim().max(255).optional().or(z.literal("")),
  city: z.string().trim().min(1, "City is required").max(100),
  province: z.string().trim().max(100).optional().or(z.literal("")),
  countryCode: z.string().min(2, "Country is required"),
  phone: z.string().trim().max(32).optional().or(z.literal("")),
  isDefaultShipping: z.boolean(),
  isDefaultBilling: z.boolean(),
});

export type AddressBookFormValues = z.infer<typeof addressBookSchema>;

export function countryNameForCode(code: string): string {
  return (
    ADDRESS_COUNTRIES.find((c) => c.code === code)?.name ?? code
  );
}
