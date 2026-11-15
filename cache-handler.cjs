// @ts-check
/* eslint-disable @typescript-eslint/no-require-imports -- Next.js loads this file with require() at runtime (CommonJS), outside the app bundle. */
/**
 * Shared Next.js server cache for the brand websites (deployment plan W1,
 * docs/multibrand/DEPLOYMENT_PLAN.md §4).
 *
 * Pages, route responses, `unstable_cache` / fetch entries and optimized images
 * are kept in Redis, so every replica of a brand's website serves the same
 * pages, and a `revalidateTag` on one replica (e.g. the backend's signed site
 * refresh) takes effect on all of them:
 *
 * - entries:      <prefix>e:<key>    JSON, 30-day TTL (re-rendered when evicted)
 * - tag state:    <prefix>tags       hash tag → {stale, expired} (ms), as Next records it
 * - <prefix>:     web:<BRAND>:<BUILD_ID>:  one brand never reads another's entries;
 *                                          a new release starts with a clean cache.
 *
 * Next.js checks tag state in an in-process manifest. Before an entry is
 * returned, the tag state of its tags is read from Redis and copied into that
 * manifest, so stale-while-revalidate and immediate expiry behave exactly as
 * with one server.
 *
 * Without REDIS_HOST (local, dev) the store is in memory, for one server only;
 * staging and production refuse to start without it (src/lib/site/sharedCache.ts).
 * Redis unavailable: reads miss (pages render fresh), writes are skipped, a
 * revalidation fails (so the caller retries) — never a wrong page.
 */
const fs = require("node:fs");
const path = require("node:path");

const ENTRY_TTL_SECONDS = 30 * 24 * 60 * 60;
const TAG_HEADER = "x-next-cache-tags";
const PAGE_KINDS = new Set(["APP_PAGE", "APP_ROUTE", "PAGES"]);

/** JSON-safe copy: Buffers / byte arrays and Maps survive the round trip. */
function encode(value) {
  if (Buffer.isBuffer(value) || value instanceof Uint8Array) {
    return { __t: "b", v: Buffer.from(value).toString("base64") };
  }
  if (value instanceof Map) {
    return { __t: "m", v: [...value.entries()].map(([k, v]) => [k, encode(v)]) };
  }
  if (Array.isArray(value)) return value.map(encode);
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = encode(v);
    return out;
  }
  return value;
}

function decode(value) {
  if (Array.isArray(value)) return value.map(decode);
  if (value && typeof value === "object") {
    if (value.__t === "b" && typeof value.v === "string") return Buffer.from(value.v, "base64");
    if (value.__t === "m" && Array.isArray(value.v)) {
      return new Map(value.v.map(([k, v]) => [k, decode(v)]));
    }
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = decode(v);
    return out;
  }
  return value;
}

/** The tags an entry depends on (same rules as Next's file-system cache). */
function entryTags(entry, ctx) {
  const kind = entry?.value?.kind;
  if (PAGE_KINDS.has(kind)) {
    const header = entry.value.headers?.[TAG_HEADER];
    return typeof header === "string" && header ? header.split(",") : [];
  }
  if (kind === "FETCH" && ctx?.kind === "FETCH") {
    return [...(ctx.tags || []), ...(ctx.softTags || [])];
  }
  return [];
}

function isExpired(state, lastModified, now) {
  return typeof state?.expired === "number" && state.expired <= now && state.expired > lastModified;
}

/** In-memory store with Redis' shape (local / dev: one server). */
function memoryStore() {
  const values = new Map();
  const hashes = new Map();
  return {
    async get(key) {
      const hit = values.get(key);
      if (!hit) return null;
      if (hit.until < Date.now()) {
        values.delete(key);
        return null;
      }
      return hit.value;
    },
    async set(key, value, ttlSeconds) {
      values.set(key, { value, until: Date.now() + ttlSeconds * 1000 });
    },
    async hmget(key, fields) {
      const hash = hashes.get(key) ?? new Map();
      return fields.map((field) => hash.get(field) ?? null);
    },
    async hset(key, entries) {
      const hash = hashes.get(key) ?? new Map();
      for (const [field, value] of entries) hash.set(field, value);
      hashes.set(key, hash);
    },
  };
}

/** Redis store (staging / production): one connection per server process. */
function redisStore(env) {
  const Redis = require("ioredis");
  const client = new Redis({
    host: env.REDIS_HOST,
    port: Number(env.REDIS_PORT || (env.REDIS_TLS === "true" ? 10000 : 6379)),
    password: env.REDIS_PASSWORD || undefined,
    tls: env.REDIS_TLS === "true" ? { servername: env.REDIS_HOST } : undefined,
    connectTimeout: 2000,
    commandTimeout: 1000,
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    lazyConnect: false,
  });
  let lastError = 0;
  client.on("error", (error) => {
    // One line a minute at most: an outage must be visible, not flood the logs.
    if (Date.now() - lastError > 60_000) {
      lastError = Date.now();
      console.error(`[cache] Redis error: ${error?.message ?? error}`);
    }
  });
  return {
    async get(key) {
      return client.get(key);
    },
    async set(key, value, ttlSeconds) {
      await client.set(key, value, "EX", ttlSeconds);
    },
    async hmget(key, fields) {
      return fields.length ? client.hmget(key, ...fields) : [];
    },
    async hset(key, entries) {
      if (!entries.length) return;
      await client
        .multi()
        .hset(key, Object.fromEntries(entries))
        .expire(key, ENTRY_TTL_SECONDS)
        .exec();
    },
  };
}

function readBuildId(serverDistDir) {
  try {
    if (serverDistDir) {
      return fs.readFileSync(path.join(serverDistDir, "..", "BUILD_ID"), "utf8").trim();
    }
  } catch {
    // next dev has no BUILD_ID: one prefix for the dev server.
  }
  return "dev";
}

function loadTagsManifest() {
  // The process-wide tag state Next's cache checks (an `.external` module: one
  // instance per process). Pinned by cache-handler.spec.ts.
  return require("next/dist/server/lib/incremental-cache/tags-manifest.external").tagsManifest;
}

/**
 * Builds the handler class. Tests pass their own store and manifest (two
 * "servers" sharing one store); Next.js loads the default export.
 */
function createCacheHandler({ store, manifest, env = process.env, now = () => Date.now() }) {
  const brand = (env.NEXT_PUBLIC_STOREFRONT_BRAND_CODE || "SWISS_ARABIAN").trim().toUpperCase();

  return class SharedCacheHandler {
    constructor(ctx = {}) {
      this.prefix = `web:${brand}:${readBuildId(ctx.serverDistDir)}:`;
      this.revalidatedTags = ctx.revalidatedTags || [];
      this.store = typeof store === "function" ? store() : store;
      this.manifest = typeof manifest === "function" ? manifest() : manifest;
    }

    /** Tag state from the shared store, copied into this server's manifest. */
    async syncTags(tags) {
      if (!tags.length) return new Map();
      const raw = await this.store.hmget(`${this.prefix}tags`, tags);
      const states = new Map();
      tags.forEach((tag, i) => {
        if (!raw[i]) return;
        const state = JSON.parse(raw[i]);
        states.set(tag, state);
        const local = this.manifest.get(tag) || {};
        this.manifest.set(tag, {
          ...local,
          ...(typeof state.stale === "number" ? { stale: Math.max(state.stale, local.stale ?? 0) } : {}),
          ...(typeof state.expired === "number"
            ? { expired: Math.max(state.expired, local.expired ?? 0) }
            : {}),
        });
      });
      return states;
    }

    async get(key, ctx) {
      try {
        const raw = await this.store.get(`${this.prefix}e:${key}`);
        if (!raw) return null;
        const entry = decode(JSON.parse(raw));
        const tags = entryTags(entry, ctx);
        if (entry.value?.kind === "FETCH" && tags.some((tag) => this.revalidatedTags.includes(tag))) {
          return null;
        }
        const states = await this.syncTags(tags);
        const at = now();
        for (const tag of tags) {
          if (isExpired(states.get(tag), entry.lastModified, at)) return null;
        }
        return entry;
      } catch (error) {
        console.error(`[cache] read failed, rendering fresh: ${error?.message ?? error}`);
        return null;
      }
    }

    async set(key, data, _ctx) {
      try {
        if (!data) return;
        const entry = { value: data, lastModified: now() };
        await this.store.set(`${this.prefix}e:${key}`, JSON.stringify(encode(entry)), ENTRY_TTL_SECONDS);
      } catch (error) {
        console.error(`[cache] write skipped: ${error?.message ?? error}`);
      }
    }

    /**
     * Same semantics as Next's own cache: with durations the tag is stale now
     * (and expires after `expire` seconds when given); without, it expires now.
     * Throws when the shared store cannot record it, so the caller retries.
     */
    async revalidateTag(tags, durations) {
      const list = [tags].flat().filter(Boolean);
      if (!list.length) return;
      const at = now();
      const current = await this.syncTags(list);
      const updates = list.map((tag) => {
        const existing = current.get(tag) || {};
        const next = durations
          ? {
              ...existing,
              stale: at,
              ...(durations.expire !== undefined ? { expired: at + durations.expire * 1000 } : {}),
            }
          : { ...existing, expired: at };
        this.manifest.set(tag, { ...(this.manifest.get(tag) || {}), ...next });
        return [tag, JSON.stringify(next)];
      });
      await this.store.hset(`${this.prefix}tags`, updates);
    }

    resetRequestCache() {}
  };
}

let sharedStore;
function defaultStore() {
  // One store per server process, whichever handler instance asks first.
  if (!sharedStore) sharedStore = process.env.REDIS_HOST ? redisStore(process.env) : memoryStore();
  return sharedStore;
}

module.exports = createCacheHandler({ store: defaultStore, manifest: loadTagsManifest });
module.exports.createCacheHandler = createCacheHandler;
module.exports.memoryStore = memoryStore;
module.exports.encode = encode;
module.exports.decode = decode;
module.exports.loadTagsManifest = loadTagsManifest;
