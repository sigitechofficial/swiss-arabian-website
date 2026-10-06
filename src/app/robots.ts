import type { MetadataRoute } from "next";
import { env } from "@/lib/config/env";

/**
 * Demo / staging must stay out of Google until go-live (SEO audit).
 * Only production allows crawling.
 */
export default function robots(): MetadataRoute.Robots {
  if (env.appEnv !== "production") {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
  };
}
