import Link from "next/link";

export function LandingStory() {
  return (
    <section className="story" id="story" aria-labelledby="storyHeading">
      <div
        className="story__bg"
        id="storyBg"
        role="img"
        aria-label="Swiss Arabian heritage"
      />
      <div className="story__scrim" aria-hidden="true" />
      <div className="story__inner">
        <p className="story__eyebrow">Our Story · Est. 1974</p>
        <h2 className="story__title" id="storyHeading">
          A legacy <em>where two</em> worlds meet
        </h2>
        <p className="story__text">
          For five decades, Swiss Arabian has built its identity on duality — the
          meeting point of Western craftsmanship and Oriental tradition. From
          precious beginnings to a house known the world over, that fusion turns
          deep local knowledge into fragrance of universal quality.
        </p>
        <Link className="story__cta" href="/our-story">
          Read more
        </Link>
      </div>
    </section>
  );
}
