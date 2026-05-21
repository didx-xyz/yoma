##### BASE — shared setup for all stages
FROM docker.io/node:24-alpine AS base
RUN apk add --no-cache libc6-compat openssl
RUN corepack enable
WORKDIR /app

##### DEPENDENCIES — install full workspace, then deploy yoma-web in isolation
FROM base AS deps
# Workspace files (build context is repo root)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY src/web/package.json ./src/web/
RUN pnpm install --filter yoma-web --frozen-lockfile

# pnpm deploy materialises a self-contained directory containing only
# yoma-web and its dependencies (root devDeps like cypress/husky are excluded).
RUN pnpm deploy --filter=yoma-web --legacy /deploy

##### BUILDER
FROM base AS builder
# Bring in the isolated, yoma-web-only node_modules
COPY --from=deps /deploy/node_modules ./src/web/node_modules
COPY --from=deps /deploy/package.json ./src/web/package.json
# Source files
COPY src/web ./src/web

WORKDIR /app/src/web

ENV NEXT_TELEMETRY_DISABLED=1
ENV CI=true
ARG NEXT_PUBLIC_ENVIRONMENT=production
ENV NEXT_PUBLIC_ENVIRONMENT=${NEXT_PUBLIC_ENVIRONMENT}

# Client environment variables are needed at build time
ARG NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
ENV NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=${NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
ARG NEXT_PUBLIC_GA_MEASUREMENT_ID
ENV NEXT_PUBLIC_GA_MEASUREMENT_ID=${NEXT_PUBLIC_GA_MEASUREMENT_ID}

RUN SKIP_ENV_VALIDATION=1 node_modules/.bin/next build --webpack

# Set read-only permissions for the build assets
RUN chmod -R a-w .next/standalone
RUN chmod -R a-w .next/static

##### RUNNER
FROM base AS runner

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Without a workspace at build time, Next.js standalone output is rooted at the
# package directory: server.js, .next/, node_modules/ all sit at the root of
# /app/src/web/.next/standalone.
COPY --from=builder /app/src/web/.next/standalone ./
COPY --from=builder /app/src/web/public ./public
COPY --from=builder /app/src/web/.next/static ./.next/static

# Next.js Image needs the .next/cache directory to be writable
RUN mkdir -p ./.next/cache && chown nextjs:nodejs ./.next/cache

# Next.js SSG requires the .next/server/pages directory to be writable
RUN chmod -R 777 /app/.next/server/pages

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
