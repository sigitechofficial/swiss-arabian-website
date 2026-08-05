import { z } from "zod";

const phoneLike = /^[+]?[\d\s()-]{7,20}$/;

export const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, "Enter your email or phone")
    .refine(
      (value) => z.email().safeParse(value).success || phoneLike.test(value),
      "Enter a valid email or phone",
    ),
  password: z.string().min(8, "Password must be at least 8 characters"),
  remember: z.boolean().optional(),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
