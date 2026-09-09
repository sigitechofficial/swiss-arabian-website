import { z } from "zod";

export const writeReviewSchema = z.object({
  rating: z.number().min(1, "Choose a rating").max(5),
  title: z.string().trim().min(3, "Enter a short title").max(80),
  body: z.string().trim().min(20, "Tell us a little more about the scent").max(800),
  name: z.string().trim().min(2, "Enter your name").max(60),
  email: z.string().trim().email("Enter a valid email"),
});

export type WriteReviewValues = z.infer<typeof writeReviewSchema>;
