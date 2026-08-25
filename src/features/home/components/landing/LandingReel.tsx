import { REEL_STILLS } from "../../constants/landingContent";

export function LandingReel() {
  return (
    <section id="scent-reel" className="reel-section" aria-label="Campaign films">
      <h2 className="reel-title">
        Scent just <strong>got</strong> personality.
      </h2>
      <div className="reel-stage">
        <div className="reel-grid">
          {REEL_STILLS.map((tile) => (
            <figure key={tile.className} className={`reel-tile ${tile.className}`}>
              <video
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                poster={tile.poster}
                aria-hidden="true"
              >
                <source src={tile.video} type="video/mp4" />
              </video>
              <img src={tile.poster} alt="" />
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
