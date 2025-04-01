# syntax=docker/dockerfile:1

ARG NODE_VERSION=22.14.0

# ---------------------------
# Stage 1: Builder
# ---------------------------
FROM --platform=linux/amd64 node:${NODE_VERSION}-alpine AS builder

# Set tracing sampling rate (if needed during build)
ENV TRACING_SAMPLING_RATE=1

# Install pnpm globally
RUN npm install -g pnpm

# Set working directory for the entire repository (monorepo root)
WORKDIR /usr/src/web

# Copy the full repository (build context is the repo root)
COPY . .

# Remove any existing node_modules and install all workspace dependencies
RUN rm -rf node_modules
RUN pnpm install

# Change directory to the Next.js app folder and build the app
WORKDIR /usr/src/web/apps/web
RUN pnpm run build

# ---------------------------
# Stage 2: Production
# ---------------------------
FROM --platform=linux/amd64 node:${NODE_VERSION}-alpine AS production

# Set production environment variables
ENV TRACING_SAMPLING_RATE=1
ENV NODE_ENV=production
ENV PNPM_HOME="/usr/local/share/.pnpm"
ENV CI=true

# Create the pnpm store directory and update PATH
RUN mkdir -p ${PNPM_HOME}
ENV PATH="${PNPM_HOME}/bin:${PATH}"

# Install pnpm globally
RUN npm install -g pnpm

# Set working directory for the entire repository
WORKDIR /usr/src/web

# Copy the entire repository from the builder stage (all workspace packages included)
COPY --from=builder /usr/src/web .

# Install only production dependencies for the entire workspace
RUN pnpm install --prod --frozen-lockfile

# Change directory to the Next.js app folder
WORKDIR /usr/src/web/apps/web

# Run the application as a non-root user
USER node

# Expose the port that the application listens on
EXPOSE 8080

# Set the environment variable for the port (Cloud Run requires this to be 8080)
ENV PORT=8080

# Start the Next.js server (ensure your package.json "start" script uses "next start")
CMD ["pnpm", "run", "start"]
