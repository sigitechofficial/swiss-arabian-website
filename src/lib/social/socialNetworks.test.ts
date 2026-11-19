import { describe, expect, it } from "vitest";
import { socialNetwork } from "./socialNetworks";

const net = (id: string, href: string) =>
  socialNetwork({ id, label: id, href })?.label ?? null;

describe("footer social networks", () => {
  it("recognises the networks the admin offers", () => {
    expect(net("instagram", "https://www.instagram.com/sapilperfumes")).toBe(
      "Instagram",
    );
    expect(net("facebook", "https://www.facebook.com/sapilperfume")).toBe(
      "Facebook",
    );
    expect(net("tiktok", "https://www.tiktok.com/@sapil.perfumes")).toBe(
      "TikTok",
    );
    expect(net("snapchat", "https://www.snapchat.com/@sapilperfumes")).toBe(
      "Snapchat",
    );
    expect(net("x", "https://x.com/brand")).toBe("X");
    expect(net("pinterest", "https://www.pinterest.com/brand")).toBe(
      "Pinterest",
    );
    expect(net("whatsapp", "https://wa.me/971500000000")).toBe("WhatsApp");
  });

  it("does not mistake other addresses for X", () => {
    expect(net("shop", "https://dropbox.com/brand")).toBeNull();
  });
});
