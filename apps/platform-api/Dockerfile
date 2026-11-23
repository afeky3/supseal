FROM node:20-alpine AS base
# Prisma's query/schema engines need libssl to load on musl — without this
# they fail with an opaque "Could not parse schema engine response" error
# rather than a clear "openssl not found" one.
RUN apk add --no-cache openssl
WORKDIR /repo

FROM base AS deps
COPY package.json package-lock.json* ./
COPY packages/database/package.json packages/database/package.json
COPY apps/platform-api/package.json apps/platform-api/package.json
RUN npm install --workspace=@supseal/database --workspace=platform-api --include-workspace-root

FROM deps AS build
COPY packages/database packages/database
COPY apps/platform-api apps/platform-api
RUN npm run generate --workspace=@supseal/database
RUN npm run build --workspace=@supseal/database
RUN npm run build --workspace=platform-api

# npm workspaces hoist all dependencies to the repo-root node_modules —
# apps/platform-api/node_modules does not exist as a separate directory, so
# the runtime image only needs the root node_modules (Node's resolution
# walks up parent directories to find it from apps/platform-api/dist/main.js).
FROM node:20-alpine AS runtime
RUN apk add --no-cache openssl
ENV NODE_ENV=production
WORKDIR /repo
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/packages/database ./packages/database
COPY --from=build /repo/apps/platform-api/dist ./apps/platform-api/dist
COPY --from=build /repo/apps/platform-api/package.json ./apps/platform-api/package.json
WORKDIR /repo/apps/platform-api
EXPOSE 3000
CMD ["node", "dist/main.js"]
