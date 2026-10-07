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

const STORY_IMAGE =
  "https://swissarabian.com/cdn/shop/files/Our-story-banner-for-homepage-_desktop_1024x1024.jpg?v=1706165511";

export function LandingStory() {
  return (
    <section className={story} id="story" aria-labelledby="storyHeading">
      <div
        className={storyBg}
        id="storyBg"
        role="img"
        aria-label="Swiss Arabian heritage"
        style={{ backgroundImage: `url("${STORY_IMAGE}")` }}
      />
      <div className={storyScrim} aria-hidden="true" />
      <div className={storyInner}>
        <p className={storyEyebrow}>Our Story · Est. 1974</p>
        <h2 className={storyTitle} id="storyHeading">
          A legacy <em>where two</em> worlds meet
        </h2>
        <p className={storyText}>
          For five decades, Swiss Arabian has built its identity on duality — the
          meeting point of Western craftsmanship and Oriental tradition. From
          precious beginnings to a house known the world over, that fusion turns
          deep local knowledge into fragrance of universal quality.
        </p>
        <LocaleLink className={storyCta} href="/our-story">
          Read more
        </LocaleLink>
      </div>
    </section>
  );
}
