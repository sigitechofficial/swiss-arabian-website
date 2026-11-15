# syntax=docker/dockerfile:1
# Production image for Azure Container Apps (Next.js storefront website).
# Do not bake .env / secrets into the image — inject NEXT_PUBLIC_* as build args.

FROM node:22-bookworm-slim AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-bookworm-slim AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# One image per brand, with no environment in it (deployment plan W4): it is
# built once and promoted unchanged from dev to staging to production.
# Environment settings (APP_ENV, API_BASE_URL, SEO_INDEXING_ENABLED,
# TRUSTED_EDGE_IDS, REDIS_*) are set on the container at runtime.
#
# The brand: its config and design system are compiled in. Required.
ARG NEXT_PUBLIC_STOREFRONT_BRAND_CODE
# Product switches: the same in every environment of the brand.
ARG NEXT_PUBLIC_ENABLE_MFA=false
ARG NEXT_PUBLIC_ENABLE_PASSWORD_RESET=true
ARG NEXT_PUBLIC_CUSTOMER_VERIFICATION_UI=true
# The build's commit: version skew protection across replicas (next.config deploymentId).
ARG NEXT_DEPLOYMENT_ID

ENV NEXT_PUBLIC_STOREFRONT_BRAND_CODE=$NEXT_PUBLIC_STOREFRONT_BRAND_CODE \
    NEXT_PUBLIC_ENABLE_MFA=$NEXT_PUBLIC_ENABLE_MFA \
    NEXT_PUBLIC_ENABLE_PASSWORD_RESET=$NEXT_PUBLIC_ENABLE_PASSWORD_RESET \
    NEXT_PUBLIC_CUSTOMER_VERIFICATION_UI=$NEXT_PUBLIC_CUSTOMER_VERIFICATION_UI \
    NEXT_DEPLOYMENT_ID=$NEXT_DEPLOYMENT_ID \
    NEXT_TELEMETRY_DISABLED=1

# Fails the image when the brand is not named / known, or when a setting the
# website no longer reads is set (src/lib/brand/validate.ts).
RUN npm run check:brand && npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# The shared page cache handler (next.config cacheHandler), loaded at runtime.
COPY --from=builder --chown=nextjs:nodejs /app/cache-handler.cjs ./cache-handler.cjs

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
