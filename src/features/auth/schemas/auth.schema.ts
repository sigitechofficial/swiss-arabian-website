import { z } from "zod";
import { isValidPhoneNumber } from "libphonenumber-js";

export const loginSchema = z.object({
  identifier: z.string().min(1, "Email or phone is required"),
  password: z.string().min(1, "Password is required"),
  remember: z.boolean().optional(),
});

export const registerSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Enter a valid email"),
  // The phone field emits E.164 (`+971501234567`) — validate per country.
  phone: z
    .string()
    .min(1, "Mobile number is required")
    .refine((value) => isValidPhoneNumber(value), "Enter a valid mobile number"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const forgotPasswordSchema = z.object({
  identifier: z.string().min(1, "Email or phone is required"),
});

export const resetPasswordSchema = z.object({
  identifier: z.string().min(1, "Email or phone is required"),
  code: z.string().min(4, "Enter the reset code"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
