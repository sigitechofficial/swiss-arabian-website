import { z } from "zod";

const phoneLike = /^[+]?[\d\s()-]{7,20}$/;

export const forgotPasswordSchema = z.object({
  identifier: z
    .string()
    .min(1, "Enter your email or phone")
    .refine(
      (value) => z.email().safeParse(value).success || phoneLike.test(value),
      "Enter a valid email or phone",
    ),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    identifier: z.string().min(1, "Enter your email or phone"),
    code: z.string().trim().min(4, "Enter the code"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm your password"),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
