##### DEPENDENCIES
FROM node:24-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
RUN npm install -g pnpm@11.0.0
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* package-lock.json* ./

RUN \
  if [ -f pnpm-lock.yaml ]; then pnpm install --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  else echo "Lockfile not found." && exit 1; \
  fi

##### BUILDER
FROM node:24-alpine AS builder
RUN npm install -g pnpm@11.0.0
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV CI=true
ARG NEXT_PUBLIC_ENVIRONMENT=production
ENV NEXT_PUBLIC_ENVIRONMENT=${NEXT_PUBLIC_ENVIRONMENT}

# Client environment variables are needed at build time
ARG NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
ENV NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=${NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
ARG NEXT_PUBLIC_GA_MEASUREMENT_ID
ENV NEXT_PUBLIC_GA_MEASUREMENT_ID=${NEXT_PUBLIC_GA_MEASUREMENT_ID}

RUN \
  if [ -f pnpm-lock.yaml ]; then SKIP_ENV_VALIDATION=1 pnpm run build; \
  elif [ -f package-lock.json ]; then SKIP_ENV_VALIDATION=1 npm run build; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Normalize the standalone app root because Next may nest it differently
# depending on the tracing root and build context.
RUN server_dir=$(find /app/.next/standalone -name server.js -exec dirname {} \; | head -n 1) \
  && test -n "$server_dir" \
  && mkdir -p /app/.next/standalone-root \
  && cp -R "$server_dir"/. /app/.next/standalone-root/ \
  && rm -f /app/.next/standalone-root/.env

# Set read-only permissions for the build assets
RUN chmod -R a-w /app/.next/standalone
RUN chmod -R a-w /app/.next/static

##### RUNNER
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Fix for https://sonarcloud.io/organizations/didx-xyz/rules?open=docker%3AS6504&rule_key=docker%3AS6504
# Copy files without changing ownership to nextjs
COPY --from=builder /app/.next/standalone-root ./
COPY --from=builder /app/.next/static ./.next/static

# Next.js Image needs the .next/cache directory to be writable
RUN mkdir -p ./.next/cache && chown nextjs:nodejs ./.next/cache

# Next.js standalone output does not always include .next/server/pages.
# Only relax permissions when that directory is present.
RUN if [ -d /app/.next/server/pages ]; then chmod -R 777 /app/.next/server/pages; fi

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
