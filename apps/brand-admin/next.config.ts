import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output for a small Docker runtime image (same pattern as
  // the NestJS services — copy the traced output, not node_modules).
  output: "standalone",
  // Points file-tracing at the monorepo root (not this app's own folder) so
  // the standalone build correctly includes @supseal/shared-types and the
  // hoisted workspace node_modules it needs.
  outputFileTracingRoot: path.join(__dirname, "../.."),
  // Served at /portal/* behind Traefik (infra/traefik/dynamic/routes.yml) —
  // no dedicated subdomain/DNS record needed. Next.js applies this to its
  // own routing/assets automatically; fetch("/api/...") calls are
  // unaffected since they're not Next.js routes.
  basePath: "/portal",
};

export default nextConfig;
