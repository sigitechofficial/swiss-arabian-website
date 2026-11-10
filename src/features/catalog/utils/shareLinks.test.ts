import { describe, expect, it } from "vitest";
import { shareLinks } from "./shareLinks";

describe("shareLinks", () => {
  const url = "https://uae.swissarabian.com/ar/products/shaghaf-oud?x=1&y=2";
  const enc = encodeURIComponent;

  it("encodes the canonical address and title for each network", () => {
    const image = "https://cdn.example.com/a b.jpg";
    const links = shareLinks({ url, title: "Shaghaf Oud & Co", image });
    expect(links.whatsapp).toBe(`https://wa.me/?text=${enc(`Shaghaf Oud & Co ${url}`)}`);
    expect(links.facebook).toBe(`https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`);
    expect(links.x).toBe(`https://x.com/intent/tweet?url=${enc(url)}&text=${enc("Shaghaf Oud & Co")}`);
    expect(links.pinterest).toBe(
      `https://www.pinterest.com/pin/create/button/?url=${enc(url)}&media=${enc(image)}&description=${enc("Shaghaf Oud & Co")}`,
    );
    expect(new URL(links.facebook).searchParams.get("u")).toBe(url);
  });

  it("offers Pinterest only with an absolute image", () => {
    expect(shareLinks({ url, title: "A" }).pinterest).toBeNull();
    expect(shareLinks({ url, title: "A", image: "/media/a.jpg" }).pinterest).toBeNull();
  });

  it("leaves out an empty title", () => {
    const links = shareLinks({ url, title: "  " });
    expect(links.x).toBe(`https://x.com/intent/tweet?url=${enc(url)}`);
    expect(links.whatsapp).toBe(`https://wa.me/?text=${enc(url)}`);
  });
});
