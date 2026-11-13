import sharp from "sharp";
import { NextResponse, type NextRequest } from "next/server";
import {
  isAllowedShareSource,
  SHARE_IMAGE_SIZES,
  type ShareShape,
} from "@/lib/seo/shareImage";

export const runtime = "nodejs";

/** Link apps load images up to ~600 KB reliably; stay well under. */
const MAX_BYTES = 300 * 1024;
const MAX_SOURCE_BYTES = 15 * 1024 * 1024;

/**
 * GET /api/share-image?src=<image>&shape=square|wide
 * The image as a JPEG at the og:image size (white background, whole image
 * visible), for link previews. Only our own image hosts are accepted.
 */
export async function GET(request: NextRequest) {
  const src = request.nextUrl.searchParams.get("src")?.trim() ?? "";
  const shape: ShareShape =
    request.nextUrl.searchParams.get("shape") === "square" ? "square" : "wide";
  if (!src || !isAllowedShareSource(src)) {
    return new NextResponse("Image not allowed", { status: 400 });
  }
  const sourceUrl = src.startsWith("/")
    ? new URL(src, request.nextUrl.origin)
    : new URL(src);

  let input: Buffer;
  try {
    const response = await fetch(sourceUrl, {
      headers: { Accept: "image/webp,image/png,image/jpeg,*/*;q=0.5" },
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok)
      return new NextResponse("Image not found", { status: 404 });
    input = Buffer.from(await response.arrayBuffer());
    if (!input.length || input.length > MAX_SOURCE_BYTES) {
      return new NextResponse("Image not usable", { status: 422 });
    }
  } catch {
    return new NextResponse("Image not reachable", { status: 502 });
  }

  const { width, height } = SHARE_IMAGE_SIZES[shape];
  try {
    const base = sharp(input)
      .resize(width, height, {
        fit: "contain",
        background: { r: 255, g: 255, b: 255, alpha: 1 },
        withoutEnlargement: false,
      })
      .flatten({ background: "#ffffff" });
    let output = await base
      .clone()
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer();
    for (const quality of [72, 62, 52]) {
      if (output.length <= MAX_BYTES) break;
      output = await base.clone().jpeg({ quality, mozjpeg: true }).toBuffer();
    }
    return new NextResponse(new Uint8Array(output), {
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Length": String(output.length),
        // Same source address = same picture (stored files get new names when replaced).
        "Cache-Control":
          "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
      },
    });
  } catch {
    return new NextResponse("Image not readable", { status: 422 });
  }
}
