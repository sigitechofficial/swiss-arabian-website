import { z } from "zod";

export const writeReviewSchema = z.object({
  rating: z.number().min(1, "Choose a rating").max(5),
  title: z.string().trim().max(120).optional().or(z.literal("")),
  body: z.string().trim().min(20, "Tell us a little more about the scent").max(4000),
  name: z.string().trim().min(2, "Enter your name").max(80),
});

export type WriteReviewValues = z.infer<typeof writeReviewSchema>;
