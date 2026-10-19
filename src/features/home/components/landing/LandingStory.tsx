import type { ReactNode } from "react";
import { LocaleLink } from "@/lib/i18n/LocaleLink";
import {
  story,
  storyBg,
  storyCta,
  storyEyebrow,
  storyInner,
  storyScrim,
  storyText,
  storyTitle,
} from "@/styles/landingChrome";

const DEFAULT_STORY_IMAGE =
  "https://swissarabian.com/cdn/shop/files/Our-story-banner-for-homepage-_desktop_1024x1024.jpg?v=1706165511";

export type LandingStoryProps = {
  eyebrow?: string;
  heading?: ReactNode;
  body?: string;
  imageUrl?: string | null;
  imageAlt?: string | null;
  ctaHref?: string | null;
  ctaLabel?: string | null;
};

export function LandingStory({
  eyebrow = "Our Story · Est. 1974",
  heading = (
    <>
      A legacy <em>where two</em> worlds meet
    </>
  ),
  body = "For five decades, Swiss Arabian has built its identity on duality — the meeting point of Western craftsmanship and Oriental tradition. From precious beginnings to a house known the world over, that fusion turns deep local knowledge into fragrance of universal quality.",
  imageUrl = DEFAULT_STORY_IMAGE,
  imageAlt = "Swiss Arabian heritage",
  ctaHref = "/our-story",
  ctaLabel = "Read more",
}: LandingStoryProps = {}) {
  const bg = imageUrl?.trim() || DEFAULT_STORY_IMAGE;

  return (
    <section className={story} id="story" aria-labelledby="storyHeading">
      <div
        className={storyBg}
        id="storyBg"
        role="img"
        aria-label={imageAlt || "Swiss Arabian heritage"}
        style={{ backgroundImage: `url("${bg}")` }}
      />
      <div className={storyScrim} aria-hidden="true" />
      <div className={storyInner}>
        {eyebrow ? <p className={storyEyebrow}>{eyebrow}</p> : null}
        <h2 className={storyTitle} id="storyHeading">
          {heading}
        </h2>
        {body ? <p className={storyText}>{body}</p> : null}
        {ctaHref ? (
          <LocaleLink className={storyCta} href={ctaHref}>
            {ctaLabel?.trim() || "Read more"}
          </LocaleLink>
        ) : null}
      </div>
    </section>
  );
}
