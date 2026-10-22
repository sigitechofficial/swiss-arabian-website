import { z } from "zod";

export const acceptInvitationSchema = z.object({
  invitationId: z.string().trim().min(1, "Invitation ID is required"),
  claimSecret: z
    .string()
    .min(20, "Enter the full invitation claim code")
    .max(200, "Enter the invitation claim code you were given"),
});

export type AcceptInvitationFormValues = z.infer<typeof acceptInvitationSchema>;
