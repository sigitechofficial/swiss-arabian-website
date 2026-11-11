import { z } from "zod";

export const writeReviewSchema = z.object({
  rating: z.number().min(1, "Choose a rating").max(5),
  title: z.string().trim().max(120).optional().or(z.literal("")),
  body: z.string().trim().min(10, "Write at least a few words (10 characters)").max(2000),
  name: z.string().trim().min(2, "Enter your name").max(80),
  honest: z.literal(true, { message: "Please confirm this is your own experience" }),
});

export type WriteReviewValues = z.infer<typeof writeReviewSchema>;
