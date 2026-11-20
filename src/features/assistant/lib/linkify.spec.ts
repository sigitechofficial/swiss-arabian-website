import { describe, expect, it } from "vitest";
import { splitLinks } from "./linkify";

describe("splitLinks", () => {
  it("leaves plain text alone", () => {
    expect(splitLinks("Hello there")).toEqual([{ kind: "text", value: "Hello there" }]);
  });

  it("finds our policy and page paths", () => {
    expect(splitLinks("See /policies/shipping-policy now")).toEqual([
      { kind: "text", value: "See " },
      { kind: "path", value: "/policies/shipping-policy" },
      { kind: "text", value: " now" },
    ]);
    expect(splitLinks("/pages/contact-us")).toEqual([{ kind: "path", value: "/pages/contact-us" }]);
  });

  it("keeps trailing punctuation out of the link", () => {
    expect(splitLinks("Visit https://example.com/help.")).toEqual([
      { kind: "text", value: "Visit " },
      { kind: "url", value: "https://example.com/help" },
      { kind: "text", value: "." },
    ]);
  });

  it("never links http, javascript or other schemes", () => {
    const parts = splitLinks("javascript:alert(1) http://plain.example data:text/html,x");
    expect(parts.every((p) => p.kind === "text")).toBe(true);
  });

  it("does not link other paths", () => {
    expect(splitLinks("go to /admin/users")).toEqual([{ kind: "text", value: "go to /admin/users" }]);
  });

  it("links the order-tracking page, and nothing that only starts with it", () => {
    expect(splitLinks("open /track and enter your order number")[1]).toEqual({ kind: "path", value: "/track" });
    expect(splitLinks("see /tracker now").some((part) => part.kind === "path")).toBe(false);
  });
});
