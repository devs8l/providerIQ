# syntax=docker/dockerfile:1

##############################################################################
# ProviderIQ — Production image (single container)
#
# Serves BOTH the compiled dashboard (static) and the tRPC API on one port.
# The API is run with `tsx` because every workspace package is consumed as
# TypeScript source (package.json "main" -> ./src/index.ts), so there is no
# compiled JS entrypoint to `node`.
#
# Secrets are NOT baked in — pass them at runtime via `--env-file .env`.
##############################################################################
FROM node:22-bookworm-slim

# --- pnpm via corepack (uses the pinned packageManager version) -------------
ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Prisma's query engine needs OpenSSL present to pick the right native binary.
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Skip Playwright browser download: the core API (search/scoring) doesn't need
# a browser; only live crawling does. Keeps the image small & the build fast.
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV API_PORT=4000

WORKDIR /app

# --- Install dependencies --------------------------------------------------
# Copy the workspace definition + sources, then install. .dockerignore keeps
# node_modules / dist / .env out of the build context.
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY packages ./packages
COPY apps ./apps
COPY api ./api

# Install ALL deps INCLUDING devDependencies (vite/tsc to build the dashboard,
# tsx to run the API). NODE_ENV is intentionally NOT "production" here, otherwise
# pnpm skips devDependencies. Root `postinstall` runs `prisma generate`.
RUN pnpm install --frozen-lockfile

# --- Build the dashboard static bundle (and its workspace deps) ------------
RUN pnpm turbo run build --filter=dashboard

# Switch to production only for the runtime (enables static serving in the API
# and quieter Prisma logging). devDeps are already installed on disk.
ENV NODE_ENV=production

EXPOSE 4000

# Liveness check against the combined static + API server.
HEALTHCHECK --interval=30s --timeout=5s --start-period=25s --retries=3 \
  CMD node -e "fetch('http://localhost:4000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Run the API (which also serves the built dashboard in production).
CMD ["pnpm", "--filter", "api", "run", "start:prod"]
