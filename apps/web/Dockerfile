# syntax=docker/dockerfile:1
ARG NODE_VERSION=22-alpine

#################################
# Stage 1: Builder (dev deps + build)
#################################
FROM node:${NODE_VERSION} AS builder
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy monorepo manifests, patches, workspace packages, and app code
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.json ./
COPY .npmrc ./
COPY patches ./patches
COPY packages ./packages
COPY apps/web ./apps/web

# Install all deps (prod + dev) for the web app
RUN pnpm install --frozen-lockfile -r

# Build the Next.js app
WORKDIR /app/apps/web
RUN pnpm run build

#################################
# Stage 2: Deps (prod deps only)
#################################
FROM node:${NODE_VERSION} AS deps
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy manifests and patches
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY patches ./patches
COPY packages ./packages
COPY apps/web/package.json ./apps/web/
COPY .npmrc ./

# Make tsconfig.json available to Next.js
COPY tsconfig.json ./apps/web/tsconfig.json

# Install only production deps for the web app
RUN pnpm install --frozen-lockfile --prod --filter ./apps/web...

#################################
# Stage 3: Distroless Production
#################################
FROM gcr.io/distroless/nodejs22-debian12 AS production
WORKDIR /app

# Copy built output
COPY --from=builder /app/apps/web/.next ./.next
COPY --from=builder /app/apps/web/public ./public
COPY --from=builder /app/apps/web/next.config.js ./
COPY --from=builder /app/apps/web/plugins ./plugins
COPY --from=builder /app/apps/web/stubs    ./stubs
COPY --from=builder /app/apps/web/polyfills ./polyfills


# Copy production node_modules
COPY --from=deps /app/node_modules ./node_modules

COPY --from=builder /app/packages/shared-ui ./node_modules/shared-ui

# Copy package.json for metadata
COPY --from=builder /app/apps/web/package.json ./

# Use a non-root user
USER nonroot

# Expose port and set environment
EXPOSE 8080
ENV PORT=8080

# Optional healthcheck
HEALTHCHECK --interval=30s --timeout=5s \
    CMD ["wget","--quiet","--tries=1","--spider","http://localhost:8080/_next/static/health"] || exit 1

# Start the Next.js server
CMD ["node_modules/next/dist/bin/next", "start", "-p", "8080"]
