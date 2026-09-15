import { z } from "zod";
import { isValidPhoneNumber } from "libphonenumber-js";

export const phoneBookSchema = z.object({
  // The phone field emits E.164 (`+971501234567`) — validate per country.
  phone: z
    .string()
    .trim()
    .min(1, "Phone number is required")
    .refine((value) => isValidPhoneNumber(value), "Enter a valid phone number"),
  isPrimary: z.boolean(),
});

export type PhoneBookFormValues = z.infer<typeof phoneBookSchema>;

export const profileNameSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(100),
  lastName: z.string().trim().max(100).optional().or(z.literal("")),
});

export type ProfileNameFormValues = z.infer<typeof profileNameSchema>;
