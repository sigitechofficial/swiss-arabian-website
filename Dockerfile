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

# NEXT_PUBLIC_* are inlined at build time for the client bundle.
ARG NEXT_PUBLIC_APP_ENV=dev
ARG NEXT_PUBLIC_DEV_API_BASE_URL=https://ca-swissarabian-backend-dev.greenbush-d5b07575.uaenorth.azurecontainerapps.io
ARG NEXT_PUBLIC_DEV_RETURN_URL=https://ca-swissarabian-website-dev.greenbush-d5b07575.uaenorth.azurecontainerapps.io
ARG NEXT_PUBLIC_ENABLE_MFA=false
ARG NEXT_PUBLIC_ENABLE_PASSWORD_RESET=true
ARG NEXT_PUBLIC_ENABLE_OAUTH=false
ARG NEXT_PUBLIC_USE_DEV_SESSION=false
ARG NEXT_PUBLIC_INSIDER_ENABLED=true
ARG NEXT_PUBLIC_INSIDER_ACCOUNT_ID=10015366
ARG NEXT_PUBLIC_INSIDER_SCRIPT_HOST=swissarabianuatnew.api.useinsider.com

ENV NEXT_PUBLIC_APP_ENV=$NEXT_PUBLIC_APP_ENV \
    NEXT_PUBLIC_DEV_API_BASE_URL=$NEXT_PUBLIC_DEV_API_BASE_URL \
    NEXT_PUBLIC_DEV_RETURN_URL=$NEXT_PUBLIC_DEV_RETURN_URL \
    NEXT_PUBLIC_ENABLE_MFA=$NEXT_PUBLIC_ENABLE_MFA \
    NEXT_PUBLIC_ENABLE_PASSWORD_RESET=$NEXT_PUBLIC_ENABLE_PASSWORD_RESET \
    NEXT_PUBLIC_ENABLE_OAUTH=$NEXT_PUBLIC_ENABLE_OAUTH \
    NEXT_PUBLIC_USE_DEV_SESSION=$NEXT_PUBLIC_USE_DEV_SESSION \
    NEXT_PUBLIC_INSIDER_ENABLED=$NEXT_PUBLIC_INSIDER_ENABLED \
    NEXT_PUBLIC_INSIDER_ACCOUNT_ID=$NEXT_PUBLIC_INSIDER_ACCOUNT_ID \
    NEXT_PUBLIC_INSIDER_SCRIPT_HOST=$NEXT_PUBLIC_INSIDER_SCRIPT_HOST \
    NEXT_TELEMETRY_DISABLED=1

RUN npm run build

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

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
