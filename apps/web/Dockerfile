# syntax=docker/dockerfile:1
ARG NODE_VERSION=22-alpine

FROM node:${NODE_VERSION} AS main

# 1) Install pnpm
RUN npm install -g pnpm

# 2) Set up our monorepo root
WORKDIR /app

# 3) Copy root manifest files and tsconfig (needed for workspace resolution)
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.json ./
COPY .npmrc ./

# 4) Copy any patches and all workspace packages (shared-ui, etc.)
COPY patches ./patches
COPY packages ./packages

# 5) Copy the entire `apps/web` folder
COPY apps/web ./apps/web

# 6) Install all dependencies (prod + dev) for the whole workspace
RUN pnpm install --frozen-lockfile -r

# 7) Build the Next.js app inside apps/web
WORKDIR /app/apps/web
RUN pnpm run build

# 8) Expose port and set production‐mode environment variables
ENV NODE_ENV=production
ENV PORT=8080
ENV NODE_OPTIONS="--enable-source-maps"
EXPOSE 8080

# 9) Start the custom server (with source maps + stacktrace support)
CMD ["node", "--enable-source-maps", "server.js", "-p", "8080", "--stacktrace"]
