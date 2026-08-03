import { z } from "zod";

export const registerSchema = z.object({
  fullName: z.string().min(2, "Enter your full name"),
  email: z.email("Enter a valid email"),
  mobile: z
    .string()
    .min(7, "Enter your mobile number")
    .regex(/^[+]?\d[\d\s()-]{6,19}$/, "Enter a valid mobile number"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type RegisterFormValues = z.infer<typeof registerSchema>;
