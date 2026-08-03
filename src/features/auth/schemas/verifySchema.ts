import { z } from "zod";

export const verifySchema = z.object({
  code: z
    .string()
    .length(6, "Enter the 6-digit code")
    .regex(/^\d{6}$/, "Enter the 6-digit code"),
});

export type VerifyFormValues = z.infer<typeof verifySchema>;
