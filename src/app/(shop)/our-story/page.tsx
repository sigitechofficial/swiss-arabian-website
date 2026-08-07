import type { Metadata } from "next";

import { StoryPageView } from "@/features/story";

export const metadata: Metadata = {
  title: "Our Story",
  description:
    "Two worlds, one signature — the first perfume house in the UAE, founded in 1974 on Arabian creativity and Swiss technique.",
};

export default function OurStoryPage() {
  return <StoryPageView />;
}
