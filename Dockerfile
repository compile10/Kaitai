# ──────────────────────────────────────────────
# Base — Node.js runtime
# ──────────────────────────────────────────────
FROM node:24-alpine AS base
WORKDIR /app

# ──────────────────────────────────────────────
# Dependencies — install once, cache the layer
# ──────────────────────────────────────────────
FROM base AS deps
COPY package.json package-lock.json .npmrc ./
RUN npm ci --legacy-peer-deps

# ──────────────────────────────────────────────
# Dev — used by docker-compose for local dev
# Hot-reloads via volume mounts
# ──────────────────────────────────────────────
FROM base AS dev
COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node . .
RUN chown node:node /app
ENV NODE_ENV=development
USER node
EXPOSE 3000
CMD ["npm", "run", "dev"]
