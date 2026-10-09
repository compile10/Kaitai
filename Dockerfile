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

# ──────────────────────────────────────────────
# Builder — production build; also runs one-off
# scripts such as `npm run seed:admin`
# ──────────────────────────────────────────────
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Server modules validate configuration on import. Inline placeholders let the
# build collect pages without baking values into the image environment.
RUN MONGODB_URI=mongodb://build-placeholder/kaitai \
    BETTER_AUTH_URL=https://build-placeholder.invalid \
    BETTER_AUTH_SECRET=build-placeholder-not-used-at-runtime-0000 \
    npm run build

# ──────────────────────────────────────────────
# Runner — minimal production server
# ──────────────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then((r) => process.exit(r.ok ? 0 : 1), () => process.exit(1))"
CMD ["node", "server.js"]
