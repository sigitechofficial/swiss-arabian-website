export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // This environment's settings (APP_ENV, API_BASE_URL, …) must be right.
    const { assertRuntimeConfig } = await import("./lib/config/runtime");
    assertRuntimeConfig();
    // Staging / production serve only through Front Door: no edge, no start.
    const { assertEdgeConfigured } = await import("./lib/site/edge");
    assertEdgeConfigured();
    // ...and with one page cache shared by every replica.
    const { assertSharedCacheConfigured } = await import("./lib/site/sharedCache");
    assertSharedCacheConfigured();
    await import("./lib/api/registerStorefrontHost");
  }
}
