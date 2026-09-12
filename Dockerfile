# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Multi-stage build for the Next.js app (Node 22 Alpine).
#
# NOTE: this image builds ONLY the app. Local development never touches it:
#   - `pnpm run dev` -> `docker compose up -d v0-postgres` starts the in-house
#     Postgres container and runs `next dev` on the host. No image build.
#   - `docker build` (or a prod compose file) is the only way this Dockerfile
#     is used, e.g.:
#       docker build -t v0-clone .
#       docker run --rm -p 3000:3000 \
#         -e DATABASE_URL=postgresql://postgres:postgres123@host.docker.internal:5432/v0-clone \
#         v0-clone
# ---------------------------------------------------------------------------

FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /app

# --- Install dependencies ------------------------------------------------
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# --no-optional: skips the likes of e2b/universal caches we don't need at build
RUN pnpm install --frozen-lockfile --no-optional

# --- Build the app --------------------------------------------------------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# `prisma.config.ts` resolves `env("DATABASE_URL")` at load time and throws if
# it's missing, so prime it with a placeholder just for `prisma generate`
# (the generated client needs no live database). The final image sets the real
# value at runtime.
ARG DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/v0-clone"
ENV DATABASE_URL=$DATABASE_URL

RUN pnpm prisma generate \
    && pnpm build

# --- Runtime --------------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Copy the standalone output (includes traced node_modules + server.js).
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# Static assets served by the Node server.
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Public assets (favicon, logo, etc.).
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
# Generated Prisma client (in case it wasn't traced into standalone/).
COPY --from=builder --chown=nextjs:nodejs /app/lib/generated ./lib/generated

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]