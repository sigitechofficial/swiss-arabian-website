// @vitest-environment node
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const handler = require("./cache-handler.cjs");

type State = { stale?: number; expired?: number };

/** Two website replicas: one shared store, each with its own tag manifest. */
function twoServers(clock: { now: number }) {
  const store = handler.memoryStore();
  const make = () => {
    const manifest = new Map<string, State>();
    const Handler = handler.createCacheHandler({
      store,
      manifest,
      env: { NEXT_PUBLIC_STOREFRONT_BRAND_CODE: "SWISS_ARABIAN" },
      now: () => clock.now,
    });
    return { cache: new Handler({}), manifest };
  };
  return { a: make(), b: make(), store };
}

const page = (tags: string) => ({
  kind: "APP_PAGE",
  html: "<html>UAE</html>",
  rscData: Buffer.from("rsc-bytes"),
  segmentData: new Map([["/_tree", Buffer.from("seg")]]),
  headers: { "x-next-cache-tags": tags },
  status: 200,
});

describe("shared server cache across replicas (deployment plan W1)", () => {
  it("a page written by one replica is served by another, bytes and maps intact", async () => {
    const clock = { now: 1_000 };
    const { a, b } = twoServers(clock);
    await a.cache.set("/uae.swissarabian.com/en", page("site-integrations:uae.swissarabian.com"), {});
    const hit = await b.cache.get("/uae.swissarabian.com/en", { kind: "APP_PAGE" });
    expect(hit.value.html).toBe("<html>UAE</html>");
    expect(Buffer.isBuffer(hit.value.rscData)).toBe(true);
    expect(hit.value.rscData.toString()).toBe("rsc-bytes");
    expect(hit.value.segmentData.get("/_tree").toString()).toBe("seg");
    expect(hit.lastModified).toBe(1_000);
  });

  it("a tag expired on one replica (the backend's site refresh) is expired on every replica", async () => {
    const clock = { now: 1_000 };
    const { a, b } = twoServers(clock);
    const tag = "site-integrations:uae.swissarabian.com";
    await a.cache.set("k", { kind: "FETCH", data: { body: "old tag" }, revalidate: 300 }, {});
    clock.now = 2_000;
    await a.cache.revalidateTag(tag, { expire: 0 });
    clock.now = 2_001;
    // Replica B never saw the call: it learns it from the shared store.
    expect(await b.cache.get("k", { kind: "FETCH", tags: [tag], softTags: [] })).toBeNull();
    expect(b.manifest.get(tag)).toEqual({ stale: 2_000, expired: 2_000 });
  });

  it("an entry written after the revalidation is served again", async () => {
    const clock = { now: 1_000 };
    const { a, b } = twoServers(clock);
    const tag = "t";
    await a.cache.revalidateTag(tag, { expire: 0 });
    clock.now = 3_000;
    await b.cache.set("k", { kind: "FETCH", data: { body: "new" }, revalidate: 300 }, {});
    const hit = await a.cache.get("k", { kind: "FETCH", tags: [tag] });
    expect(hit.value.data.body).toBe("new");
  });

  it("stale-only revalidation (no expiry) marks the tag stale everywhere, keeps the entry", async () => {
    const clock = { now: 1_000 };
    const { a, b } = twoServers(clock);
    await a.cache.set("p", page("catalog"), {});
    clock.now = 2_000;
    await a.cache.revalidateTag("catalog", {});
    const hit = await b.cache.get("p", { kind: "APP_PAGE" });
    expect(hit).not.toBeNull();
    // Next serves it stale and re-renders in the background (its own manifest check).
    expect(b.manifest.get("catalog")).toEqual({ stale: 2_000 });
  });

  it("keeps brands and releases apart", async () => {
    const store = handler.memoryStore();
    const make = (brand: string) =>
      new (handler.createCacheHandler({
        store,
        manifest: new Map(),
        env: { NEXT_PUBLIC_STOREFRONT_BRAND_CODE: brand },
      }))({});
    await make("SWISS_ARABIAN").set("/home", page(""), {});
    expect(await make("SAPIL").get("/home", { kind: "APP_PAGE" })).toBeNull();
  });

  it("a store outage never serves a wrong page: reads miss, writes are skipped, revalidation fails", async () => {
    const broken = {
      get: async () => {
        throw new Error("down");
      },
      set: async () => {
        throw new Error("down");
      },
      hmget: async () => {
        throw new Error("down");
      },
      hset: async () => {
        throw new Error("down");
      },
    };
    const Handler = handler.createCacheHandler({ store: broken, manifest: new Map(), env: {} });
    const cache = new Handler({});
    expect(await cache.get("k", { kind: "APP_PAGE" })).toBeNull();
    await expect(cache.set("k", page(""), {})).resolves.toBeUndefined();
    await expect(cache.revalidateTag("t", { expire: 0 })).rejects.toThrow("down");
  });

  it("Next.js still has the tag manifest this handler keeps in step (pins the internal module)", () => {
    const manifest = handler.loadTagsManifest();
    expect(manifest).toBeInstanceOf(Map);
  });
});
