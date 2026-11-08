import { describe, expect, it } from "vitest";
import {
  isOptimizableImageSrc,
  remotePatternFromBaseUrl,
  type RemoteImagePattern,
} from "./remoteImagePatterns";

const patterns: RemoteImagePattern[] = [
  { protocol: "https", hostname: "cdn.shopify.com", pathname: "/s/files/**" },
  { protocol: "https", hostname: "api.example.com", pathname: "/catalog/media/**" },
];

describe("isOptimizableImageSrc", () => {
  it("optimizes site-local raster images", () => {
    expect(isOptimizableImageSrc("/assets/sa-logo-clear.png", patterns)).toBe(true);
  });

  it("never optimizes SVGs", () => {
    expect(isOptimizableImageSrc("/assets/catalog/empty-products.svg", patterns)).toBe(false);
    expect(isOptimizableImageSrc("https://cdn.shopify.com/s/files/a/logo.svg", patterns)).toBe(false);
  });

  it("optimizes URLs on an allowed host and path", () => {
    expect(isOptimizableImageSrc("https://cdn.shopify.com/s/files/1/p.jpg?v=2", patterns)).toBe(true);
    expect(isOptimizableImageSrc("https://api.example.com/catalog/media/x.webp", patterns)).toBe(true);
  });

  it("does not optimize an unknown host, path, protocol or port", () => {
    expect(isOptimizableImageSrc("https://images.sapil.com/p.jpg", patterns)).toBe(false);
    expect(isOptimizableImageSrc("https://cdn.shopify.com/other/p.jpg", patterns)).toBe(false);
    expect(isOptimizableImageSrc("http://cdn.shopify.com/s/files/p.jpg", patterns)).toBe(false);
    expect(isOptimizableImageSrc("https://api.example.com:8443/catalog/media/x.jpg", patterns)).toBe(false);
  });

  it("does not optimize local or private network hosts", () => {
    const local: RemoteImagePattern[] = [
      { protocol: "http", hostname: "localhost", port: "3002", pathname: "/catalog/media/**" },
      { protocol: "http", hostname: "192.168.1.5", pathname: "/catalog/media/**" },
    ];
    expect(isOptimizableImageSrc("http://localhost:3002/catalog/media/a.jpg", local)).toBe(false);
    expect(isOptimizableImageSrc("http://192.168.1.5/catalog/media/a.jpg", local)).toBe(false);
  });

  it("rejects empty, protocol-relative and malformed values", () => {
    expect(isOptimizableImageSrc("", patterns)).toBe(false);
    expect(isOptimizableImageSrc("//cdn.shopify.com/s/files/a.jpg", patterns)).toBe(false);
    expect(isOptimizableImageSrc("not a url", patterns)).toBe(false);
  });
});

describe("remotePatternFromBaseUrl", () => {
  it("builds a pattern from a base URL with port", () => {
    expect(remotePatternFromBaseUrl("http://localhost:3002", "/catalog/media/**")).toEqual({
      protocol: "http",
      hostname: "localhost",
      port: "3002",
      pathname: "/catalog/media/**",
    });
  });

  it("ignores empty or invalid values", () => {
    expect(remotePatternFromBaseUrl(undefined, "/x/**")).toBeNull();
    expect(remotePatternFromBaseUrl("ftp://host", "/x/**")).toBeNull();
  });
});
