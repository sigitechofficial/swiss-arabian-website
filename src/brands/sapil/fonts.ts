import { Fraunces, Gloock, Poppins } from "next/font/google";

/**
 * Sapil typefaces, self-hosted by next/font at build time. Only what v9 requests:
 *   Gloock 400 (display headings),
 *   Fraunces variable (wght + opsz 9–144; v9 uses 300–500), roman + italic (`.serif` accents),
 *   Poppins 300/400/500/600/700 (UI and body).
 * Each sets a CSS variable that theme.css reads (--sapil-serif / -sans / -display).
 * Apply `sapilFontVariables` on the same element as data-brand="sapil" (SapilRoot does).
 */
export const sapilGloock = Gloock({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  adjustFontFallback: false,
  variable: "--font-sapil-gloock",
});

export const sapilFraunces = Fraunces({
  // next/font only accepts the opsz axis with weight "variable" (one variable file per style);
  // v9 uses 300/400/500 from it, same file Google serves for the design's opsz request.
  weight: "variable",
  style: ["normal", "italic"],
  axes: ["opsz"],
  subsets: ["latin"],
  display: "swap",
  adjustFontFallback: false,
  variable: "--font-sapil-fraunces",
});

export const sapilPoppins = Poppins({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  adjustFontFallback: false,
  variable: "--font-sapil-poppins",
});

export const sapilFontVariables = [
  sapilGloock.variable,
  sapilFraunces.variable,
  sapilPoppins.variable,
].join(" ");

/** First family of a next/font stack: the name next/font registered (hashed in some builds). */
const primary = (f: { style: { fontFamily: string } }) => f.style.fontFamily.split(",")[0].trim();

/**
 * The font variables reduced to the real family only. next/font appends a metric-adjusted
 * "… Fallback" (local Arial/Times) face, and Next 16.3 Turbopack emits it even with
 * adjustFontFallback:false. Glyphs the webfont lacks (e.g. "→", not in Poppins' latin subset)
 * would then come from that resized Arial. v9 falls through to system-ui / Georgia instead, so
 * SapilRoot sets these inline; theme.css appends the v9 fallbacks.
 */
export const sapilFontFamilies = {
  "--font-sapil-gloock": primary(sapilGloock),
  "--font-sapil-fraunces": primary(sapilFraunces),
  "--font-sapil-poppins": primary(sapilPoppins),
} as const;
