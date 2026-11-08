/**
 * Single source of truth for which remote image URLs Next.js may optimize.
 * `next.config.ts` passes REMOTE_IMAGE_PATTERNS to `images.remotePatterns`,
 * and `<MediaImage>` uses `isOptimizableImageSrc` to fall back to an
 * unoptimized image for anything else, so an unknown host renders the image
 * instead of breaking the page.
 *
 * Kept free of path aliases and browser APIs: it is imported by next.config.ts.
 */

export type RemoteImagePattern = {
  protocol: "http" | "https";
  hostname: string;
  port?: string;
  /** Exact path or a prefix ending in `/**`. */
  pathname: string;
};

export function remotePatternFromBaseUrl(
  baseUrl: string | undefined,
  pathname: string,
): RemoteImagePattern | null {
  const raw = baseUrl?.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw.includes("://") ? raw : `https://${raw}`);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return {
      protocol: url.protocol.replace(":", "") as "http" | "https",
      hostname: url.hostname,
      ...(url.port ? { port: url.port } : {}),
      pathname,
    };
  } catch {
    return null;
  }
}

const CATALOG_MEDIA_PATH = "/catalog/media/**";

// NEXT_PUBLIC_* values are read with static property access so Next.js can
// inline them into the browser bundle.
const catalogMediaPatterns = [
  remotePatternFromBaseUrl(process.env.NEXT_PUBLIC_CATALOG_MEDIA_BASE_URL, CATALOG_MEDIA_PATH),
  remotePatternFromBaseUrl(process.env.NEXT_PUBLIC_DEV_API_BASE_URL, CATALOG_MEDIA_PATH),
  remotePatternFromBaseUrl(process.env.NEXT_PUBLIC_LOCAL_API_BASE_URL, CATALOG_MEDIA_PATH),
  remotePatternFromBaseUrl(process.env.NEXT_PUBLIC_STAGING_API_BASE_URL, CATALOG_MEDIA_PATH),
  remotePatternFromBaseUrl(process.env.NEXT_PUBLIC_PRODUCTION_API_BASE_URL, CATALOG_MEDIA_PATH),
  {
    protocol: "https" as const,
    hostname: "ca-swissarabian-backend-dev.greenbush-d5b07575.uaenorth.azurecontainerapps.io",
    pathname: CATALOG_MEDIA_PATH,
  },
].filter((pattern): pattern is RemoteImagePattern => pattern != null);

export const REMOTE_IMAGE_PATTERNS: RemoteImagePattern[] = [
  { protocol: "https", hostname: "cdn.shopify.com", pathname: "/s/files/**" },
  {
    protocol: "https",
    hostname: "stswissarabiandev.blob.core.windows.net",
    pathname: "/catalog-images/**",
  },
  { protocol: "https", hostname: "dossier.eu", pathname: "/cdn/shop/files/**" },
  { protocol: "https", hostname: "swissarabian.com", pathname: "/cdn/shop/files/**" },
  ...catalogMediaPatterns,
];

function pathMatches(pattern: string, pathname: string): boolean {
  if (pattern.endsWith("/**")) return pathname.startsWith(pattern.slice(0, -2));
  return pathname === pattern;
}

/** Next.js refuses to optimize local/private addresses by default. */
function isLocalOrPrivateHost(hostname: string): boolean {
  if (hostname === "localhost" || hostname.endsWith(".localhost")) return true;
  if (hostname === "[::1]" || hostname === "::1") return true;
  const octets = hostname.split(".").map(Number);
  if (octets.length !== 4 || octets.some((n) => !Number.isInteger(n))) return false;
  const [a, b] = octets as [number, number, number, number];
  return a === 127 || a === 10 || (a === 192 && b === 168) || (a === 172 && b >= 16 && b <= 31);
}

/**
 * True when Next.js can optimize `src` with this configuration: a site-local
 * path, or a URL matching REMOTE_IMAGE_PATTERNS on a public host. SVGs are
 * never optimized (Next.js would refuse them).
 */
export function isOptimizableImageSrc(
  src: string,
  patterns: RemoteImagePattern[] = REMOTE_IMAGE_PATTERNS,
): boolean {
  const value = src.trim();
  if (!value) return false;
  if (value.startsWith("/") && !value.startsWith("//")) {
    return !/\.svg($|\?)/i.test(value);
  }
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (/\.svg$/i.test(url.pathname)) return false;
  if (isLocalOrPrivateHost(url.hostname)) return false;
  const protocol = url.protocol.replace(":", "");
  return patterns.some(
    (pattern) =>
      pattern.protocol === protocol &&
      pattern.hostname === url.hostname &&
      (pattern.port ?? "") === url.port &&
      pathMatches(pattern.pathname, url.pathname),
  );
}
