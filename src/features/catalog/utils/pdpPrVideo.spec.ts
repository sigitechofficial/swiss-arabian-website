import { describe, expect, it } from "vitest";
import { pickPrVideo } from "./pdpPrVideo";

describe("pickPrVideo", () => {
  it("reads https prVideo from the detail payload", () => {
    expect(
      pickPrVideo({
        prVideo: {
          url: "https://cdn.example/pr.mp4",
          name: "Rose 01.mp4",
        },
      }),
    ).toEqual({ url: "https://cdn.example/pr.mp4", name: "Rose 01.mp4" });
  });

  it("reads prVideo nested on product", () => {
    expect(
      pickPrVideo({
        product: {
          prVideo: { url: "https://cdn.example/nested.mp4" },
        },
      }),
    ).toEqual({ url: "https://cdn.example/nested.mp4", name: null });
  });

  it("ignores non-https URLs", () => {
    expect(pickPrVideo({ prVideo: { url: "/local.mp4" } })).toBeUndefined();
  });
});
