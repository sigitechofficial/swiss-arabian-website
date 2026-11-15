import { env } from "@/lib/config/env";
import { edgeRequired } from "./edge";

/**
 * Staging and production run several replicas per brand website: they must share
 * one server cache (cache-handler.cjs, Redis), or a change reaches one replica
 * only. A server started without it refuses to start.
 */
export function assertSharedCacheConfigured(
  settings: { redisHost?: string; appEnv?: string } = {
    redisHost: process.env.REDIS_HOST,
    appEnv: env.appEnv,
  },
): void {
  if (edgeRequired(settings.appEnv) && !settings.redisHost?.trim()) {
    throw new Error(
      `REDIS_HOST is required when the website runs as ${settings.appEnv}: every replica must share one page cache.`,
    );
  }
}
