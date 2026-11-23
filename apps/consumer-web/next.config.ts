import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output for a small Docker runtime image — same pattern as
  // every other app/service in this monorepo.
  output: "standalone",
  // Served at /v/* behind Traefik (infra/traefik/dynamic/routes.yml) —
  // matches exactly what's encoded into every generated sticker's QR code
  // (see apps/platform-api/.../batch-pdf.util.ts), so this MUST stay "/v".
  basePath: "/v",
  outputFileTracingRoot: path.join(__dirname, "../.."),
};

export default nextConfig;
