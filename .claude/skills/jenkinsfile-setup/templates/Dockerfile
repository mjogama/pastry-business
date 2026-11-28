# Multi-stage NestJS image. Placeholders: <NODE_VERSION> (e.g. 22), <APP_PORT> (e.g. 3001).

# ---------- Stage 1: build ----------
# Compilers and dev deps live only here; nothing ships unless stage 2 copies it.
FROM node:<NODE_VERSION>-alpine AS build
WORKDIR /app

# Copy manifests first so the npm ci layer is cached when only code changes.
COPY package*.json ./
RUN npm ci

COPY . .
# Compile, then drop dev-only packages so node_modules is prod-only.
RUN npm run build && npm prune --omit=dev

# ---------- Stage 2: runtime ----------
FROM node:<NODE_VERSION>-alpine
ENV NODE_ENV=production
WORKDIR /app

COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

# Don't run as root.
USER node

# Documentation only; compose "ports:" publishes it.
EXPOSE <APP_PORT>

# Run node directly (not via npm) so it receives SIGTERM and shuts down cleanly.
# gym-app-be outputs dist/src/main (see "start:prod" in package.json); check yours.
CMD ["node", "dist/src/main"]
