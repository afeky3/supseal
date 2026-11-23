FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /repo

FROM base AS deps
COPY package.json package-lock.json* ./
COPY packages/shared-types/package.json packages/shared-types/package.json
COPY apps/consumer-web/package.json apps/consumer-web/package.json
RUN npm install --workspace=@supseal/shared-types --workspace=consumer-web --include-workspace-root

FROM deps AS build
COPY packages/shared-types packages/shared-types
COPY apps/consumer-web apps/consumer-web
RUN npm run build --workspace=@supseal/shared-types
RUN npm run build --workspace=consumer-web

# outputFileTracingRoot (next.config.ts) points at the monorepo root, so the
# standalone bundle nests as apps/consumer-web/server.js with node_modules at
# the tree root — copy the whole traced tree, not just the app's own folder.
FROM node:20-alpine AS runtime
RUN apk add --no-cache libc6-compat
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /repo/apps/consumer-web/.next/standalone ./
COPY --from=build /repo/apps/consumer-web/.next/static ./apps/consumer-web/.next/static
COPY --from=build /repo/apps/consumer-web/public ./apps/consumer-web/public
WORKDIR /app/apps/consumer-web
ENV PORT=3004
EXPOSE 3004
CMD ["node", "server.js"]
