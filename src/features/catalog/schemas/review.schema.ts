import { z } from "zod";

/** Validation messages in the page's language (`reviews.*` copy). */
export type WriteReviewMessages = { rating: string; body: string; name: string; honest: string };

const ENGLISH: WriteReviewMessages = {
  rating: "Choose a rating first.",
  body: "Write at least a few words (10 characters).",
  name: "Enter your name.",
  honest: "Please confirm this is your own experience.",
};

/** The write-a-review form, every brand. */
export function writeReviewSchema(messages: WriteReviewMessages = ENGLISH) {
  return z.object({
    rating: z.number().min(1, messages.rating).max(5),
    title: z.string().trim().max(120).optional().or(z.literal("")),
    body: z.string().trim().min(10, messages.body).max(2000),
    name: z.string().trim().min(2, messages.name).max(80),
    honest: z.literal(true, { message: messages.honest }),
  });
}

export type WriteReviewValues = z.infer<ReturnType<typeof writeReviewSchema>>;
