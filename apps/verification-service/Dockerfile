FROM node:20-alpine AS base
# Prisma's query/schema engines need libssl to load on musl — without this
# they fail with an opaque "Could not parse schema engine response" error
# rather than a clear "openssl not found" one.
RUN apk add --no-cache openssl
WORKDIR /repo

FROM base AS deps
COPY package.json package-lock.json* ./
COPY packages/database/package.json packages/database/package.json
COPY apps/verification-service/package.json apps/verification-service/package.json
RUN npm install --workspace=@supseal/database --workspace=verification-service --include-workspace-root

FROM deps AS build
COPY packages/database packages/database
COPY apps/verification-service apps/verification-service
RUN npm run generate --workspace=@supseal/database
RUN npm run build --workspace=@supseal/database
RUN npm run build --workspace=verification-service

# npm workspaces hoist all dependencies to the repo-root node_modules —
# apps/verification-service/node_modules does not exist as a separate
# directory, so the runtime image only needs the root node_modules (Node's
# resolution walks up parent directories to find it from dist/main.js).
FROM node:20-alpine AS runtime
RUN apk add --no-cache openssl
ENV NODE_ENV=production
WORKDIR /repo
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/packages/database ./packages/database
COPY --from=build /repo/apps/verification-service/dist ./apps/verification-service/dist
COPY --from=build /repo/apps/verification-service/package.json ./apps/verification-service/package.json
WORKDIR /repo/apps/verification-service
EXPOSE 3001
CMD ["node", "dist/main.js"]
