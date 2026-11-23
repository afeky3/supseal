FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /repo

FROM base AS deps
COPY package.json package-lock.json* ./
COPY packages/shared-types/package.json packages/shared-types/package.json
COPY apps/brand-admin/package.json apps/brand-admin/package.json
RUN npm install --workspace=@supseal/shared-types --workspace=brand-admin --include-workspace-root

FROM deps AS build
COPY packages/shared-types packages/shared-types
COPY apps/brand-admin apps/brand-admin
RUN npm run build --workspace=@supseal/shared-types
RUN npm run build --workspace=brand-admin

# outputFileTracingRoot (next.config.ts) points at the monorepo root, so the
# standalone bundle nests as apps/brand-admin/server.js with node_modules at
# the tree root — copy the whole traced tree, not just the app's own folder.
FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /repo/apps/brand-admin/.next/standalone ./
COPY --from=build /repo/apps/brand-admin/.next/static ./apps/brand-admin/.next/static
COPY --from=build /repo/apps/brand-admin/public ./apps/brand-admin/public
WORKDIR /app/apps/brand-admin
ENV PORT=3002
EXPOSE 3002
CMD ["node", "server.js"]
