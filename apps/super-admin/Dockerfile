FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /repo

FROM base AS deps
COPY package.json package-lock.json* ./
COPY packages/shared-types/package.json packages/shared-types/package.json
COPY apps/super-admin/package.json apps/super-admin/package.json
RUN npm install --workspace=@supseal/shared-types --workspace=super-admin --include-workspace-root

FROM deps AS build
COPY packages/shared-types packages/shared-types
COPY apps/super-admin apps/super-admin
RUN npm run build --workspace=@supseal/shared-types
RUN npm run build --workspace=super-admin

# outputFileTracingRoot (next.config.ts) points at the monorepo root, so the
# standalone bundle nests as apps/super-admin/server.js with node_modules at
# the tree root — copy the whole traced tree, not just the app's own folder.
FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /repo/apps/super-admin/.next/standalone ./
COPY --from=build /repo/apps/super-admin/.next/static ./apps/super-admin/.next/static
COPY --from=build /repo/apps/super-admin/public ./apps/super-admin/public
WORKDIR /app/apps/super-admin
ENV PORT=3003
EXPOSE 3003
CMD ["node", "server.js"]
