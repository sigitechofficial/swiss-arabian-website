import { z } from "zod";

export const phoneBookSchema = z.object({
  phone: z
    .string()
    .trim()
    .min(8, "Enter a valid phone number")
    .max(32, "Phone number is too long"),
  isPrimary: z.boolean(),
});

export type PhoneBookFormValues = z.infer<typeof phoneBookSchema>;

export const profileNameSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(100),
  lastName: z.string().trim().max(100).optional().or(z.literal("")),
});

export type ProfileNameFormValues = z.infer<typeof profileNameSchema>;
