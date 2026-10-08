/** Figma · div.story-art — node 254:2136 */
export function StoryArtPanel() {
  return (
    <div
      className="sa-grad-story-art relative flex min-h-[320px] items-center justify-center overflow-hidden py-[60px] lg:min-h-[480px]"
      role="img"
      aria-label="Swiss Arabian maison seal — since 1974"
    >
      <div
        className="pointer-events-none absolute inset-[18px] border border-[rgba(205,167,102,0.5)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-6 border border-[rgba(205,167,102,0.2)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 size-[min(78%,430px)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(205,167,102,0.16)_0%,rgba(205,167,102,0)_66%)]"
        aria-hidden
      />

      <svg
        viewBox="0 0 364 360"
        className="relative z-[1] h-auto w-[min(100%,364px)] px-4"
        aria-hidden
      >
        <defs>
          {/* Shallow upper arc for SWISS ARABIAN */}
          <path
            id="story-art-top-arc"
            d="M 58 118 A 145 78 0 0 1 306 118"
            fill="none"
          />
          {/* Shallow lower arc for SINCE 1974 */}
          <path
            id="story-art-bottom-arc"
            d="M 95 278 A 100 48 0 0 0 269 278"
            fill="none"
          />
          <linearGradient
            id="story-art-diamond-grad"
            x1="6.339"
            y1="0"
            x2="0"
            y2="6.339"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#E7D09C" />
            <stop offset="0.5" stopColor="#CDA766" />
            <stop offset="1" stopColor="#A07C3E" />
          </linearGradient>
        </defs>

        <text
          fill="#000"
          fontFamily="var(--font-nunito), ui-sans-serif, system-ui, sans-serif"
          fontSize="15.35"
          fontWeight="700"
          letterSpacing="0.1em"
        >
          <textPath
            href="#story-art-top-arc"
            startOffset="50%"
            textAnchor="middle"
          >
            SWISS ARABIAN
          </textPath>
        </text>

        <line
          x1="48"
          y1="178"
          x2="112"
          y2="178"
          stroke="#000"
          strokeWidth="1.2"
        />
        <g transform="translate(32 171.66)">
          <path
            d="M12.678 6.339L6.339 0L0 6.339L6.339 12.678L12.678 6.339Z"
            fill="url(#story-art-diamond-grad)"
          />
        </g>

        <line
          x1="252"
          y1="178"
          x2="316"
          y2="178"
          stroke="#000"
          strokeWidth="1.2"
        />
        <g transform="translate(319.32 171.66)">
          <path
            d="M12.678 6.339L6.339 0L0 6.339L6.339 12.678L12.678 6.339Z"
            fill="url(#story-art-diamond-grad)"
          />
        </g>

        <text
          x="182"
          y="212"
          textAnchor="middle"
          fill="#000"
          fontFamily="var(--font-nunito), ui-sans-serif, system-ui, sans-serif"
          fontSize="86.82"
          fontWeight="700"
        >
          SA
        </text>

        <text
          x="182"
          y="242"
          textAnchor="middle"
          fill="#000"
          fontFamily="var(--font-nunito), ui-sans-serif, system-ui, sans-serif"
          fontSize="9"
          fontWeight="700"
          letterSpacing="0.22em"
        >
          MAISON DE PARFUM
        </text>

        <text
          fill="#000"
          fontFamily="var(--font-nunito), ui-sans-serif, system-ui, sans-serif"
          fontSize="13.24"
          fontWeight="700"
          letterSpacing="0.14em"
        >
          <textPath
            href="#story-art-bottom-arc"
            startOffset="50%"
            textAnchor="middle"
          >
            SINCE 1974
          </textPath>
        </text>
      </svg>
    </div>
  );
}
