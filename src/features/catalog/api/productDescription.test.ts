import { describe, expect, it } from "vitest";
import {
  PRODUCT_DESCRIPTION_PLACEHOLDER,
  productMetaDescription,
  realProductDescription,
} from "./catalog.service";

describe("realProductDescription", () => {
  it("keeps a real description", () => {
    expect(realProductDescription("  A floral oud.  ")).toBe("A floral oud.");
  });

  it("drops the page placeholder and empty values (never a meta description)", () => {
    expect(realProductDescription(PRODUCT_DESCRIPTION_PLACEHOLDER)).toBeUndefined();
    expect(realProductDescription("")).toBeUndefined();
    expect(realProductDescription(null)).toBeUndefined();
    expect(realProductDescription(undefined)).toBeUndefined();
  });
});

describe("productMetaDescription", () => {
  it("uses short descriptions as plain text", () => {
    expect(productMetaDescription("<p>A floral&nbsp;oud &amp; rose.</p>")).toBe("A floral oud & rose.");
  });

  it("cuts long descriptions at a word near 160 characters", () => {
    const long = "Rich amber and warm vanilla notes ".repeat(10);
    const meta = productMetaDescription(long)!;
    expect(meta.length).toBeLessThanOrEqual(160);
    expect(meta.endsWith("…")).toBe(true);
    expect(long.startsWith(meta.slice(0, -1))).toBe(true);
  });

  it("ends on a full sentence when one ends late enough (zahra)", () => {
    const zahra =
      "<p>Each precious droplet of Zahra encapsulates the breath-taking beauty of nature.</p>" +
      "<p>Opening with an opulent feast of fruits: ripe, juicy and inviting, Zahra is a refreshing and uplifting scent for a cold night.</p>";
    // The first sentence ends at 80 characters (< 104): too short, so it cuts at a word.
    const meta = productMetaDescription(zahra)!;
    expect(meta.length).toBeLessThanOrEqual(160);
    expect(meta.startsWith("Each precious droplet of Zahra encapsulates the breath-taking beauty of nature. Opening")).toBe(true);
    expect(meta.endsWith("…")).toBe(true);

    const twoSentences =
      "A warm amber with saffron and rose for evenings, layered over soft woods and a long, smooth trail. " +
      "Its heart opens slowly. More notes follow later in the day and stay close to the skin.";
    expect(productMetaDescription(twoSentences)).toBe(
      "A warm amber with saffron and rose for evenings, layered over soft woods and a long, smooth trail. Its heart opens slowly.",
    );
  });

  it("gives nothing for the placeholder", () => {
    expect(productMetaDescription(PRODUCT_DESCRIPTION_PLACEHOLDER)).toBeUndefined();
  });
});
