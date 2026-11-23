-- Row-Level Security (SUPSEAL_Technical_Plan Section 8 / FR-AUTH-04).
--
-- Two session variables drive every policy below, set per-transaction by
-- PrismaService.withBrandContext()/withSuperAdminContext() in platform-api:
--   app.current_brand_id  -- the caller's own brand (Brand Admin/Staff)
--   app.is_super_admin    -- 'true' for the Super Admin platform-wide surface
--
-- FORCE ROW LEVEL SECURITY matters here: by default Postgres exempts a
-- table's OWNER from its own RLS policies, and the app's migration role
-- (supseal_app) IS the owner of these tables. Without FORCE, RLS would
-- silently do nothing for the exact role that runs all of platform-api's
-- queries. verification-service does not go through any of this — it
-- connects as supseal_verify (BYPASSRLS), created in
-- infra/postgres-init/01-roles.sh, because its lookups are legitimately
-- cross-brand and unauthenticated by design.

-- ── brands ──────────────────────────────────────────────────────────────
ALTER TABLE "brands" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "brands" FORCE ROW LEVEL SECURITY;
CREATE POLICY brand_isolation ON "brands"
  USING (
    current_setting('app.is_super_admin', true) = 'true'
    OR id = NULLIF(current_setting('app.current_brand_id', true), '')
  );

-- ── users ───────────────────────────────────────────────────────────────
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" FORCE ROW LEVEL SECURITY;
CREATE POLICY brand_isolation ON "users"
  USING (
    current_setting('app.is_super_admin', true) = 'true'
    OR brand_id = NULLIF(current_setting('app.current_brand_id', true), '')
  );

-- ── subscriptions ───────────────────────────────────────────────────────
ALTER TABLE "subscriptions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "subscriptions" FORCE ROW LEVEL SECURITY;
CREATE POLICY brand_isolation ON "subscriptions"
  USING (
    current_setting('app.is_super_admin', true) = 'true'
    OR brand_id = NULLIF(current_setting('app.current_brand_id', true), '')
  );

-- ── products ────────────────────────────────────────────────────────────
ALTER TABLE "products" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "products" FORCE ROW LEVEL SECURITY;
CREATE POLICY brand_isolation ON "products"
  USING (
    current_setting('app.is_super_admin', true) = 'true'
    OR brand_id = NULLIF(current_setting('app.current_brand_id', true), '')
  );

-- ── support_tickets ─────────────────────────────────────────────────────
ALTER TABLE "support_tickets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "support_tickets" FORCE ROW LEVEL SECURITY;
CREATE POLICY brand_isolation ON "support_tickets"
  USING (
    current_setting('app.is_super_admin', true) = 'true'
    OR brand_id = NULLIF(current_setting('app.current_brand_id', true), '')
  );

-- ── sticker_batches (via products.brand_id) ────────────────────────────
ALTER TABLE "sticker_batches" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sticker_batches" FORCE ROW LEVEL SECURITY;
CREATE POLICY brand_isolation ON "sticker_batches"
  USING (
    current_setting('app.is_super_admin', true) = 'true'
    OR EXISTS (
      SELECT 1 FROM "products" p
      WHERE p.id = "sticker_batches".product_id
        AND p.brand_id = NULLIF(current_setting('app.current_brand_id', true), '')
    )
  );

-- ── reviews (via products.brand_id) ────────────────────────────────────
ALTER TABLE "reviews" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "reviews" FORCE ROW LEVEL SECURITY;
CREATE POLICY brand_isolation ON "reviews"
  USING (
    current_setting('app.is_super_admin', true) = 'true'
    OR EXISTS (
      SELECT 1 FROM "products" p
      WHERE p.id = "reviews".product_id
        AND p.brand_id = NULLIF(current_setting('app.current_brand_id', true), '')
    )
  );

-- ── sticker_codes (via sticker_batches → products.brand_id) ───────────
-- Admin-side (platform-api) read access only, for batch management screens.
-- The public verification path never goes through this role — see header.
ALTER TABLE "sticker_codes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sticker_codes" FORCE ROW LEVEL SECURITY;
CREATE POLICY brand_isolation ON "sticker_codes"
  USING (
    current_setting('app.is_super_admin', true) = 'true'
    OR EXISTS (
      SELECT 1 FROM "sticker_batches" sb
      JOIN "products" p ON p.id = sb.product_id
      WHERE sb.id = "sticker_codes".batch_id
        AND p.brand_id = NULLIF(current_setting('app.current_brand_id', true), '')
    )
  );

-- ── verification_events (via sticker_codes → ... → brand_id) ──────────
ALTER TABLE "verification_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "verification_events" FORCE ROW LEVEL SECURITY;
CREATE POLICY brand_isolation ON "verification_events"
  USING (
    current_setting('app.is_super_admin', true) = 'true'
    OR EXISTS (
      SELECT 1 FROM "sticker_codes" sc
      JOIN "sticker_batches" sb ON sb.id = sc.batch_id
      JOIN "products" p ON p.id = sb.product_id
      WHERE sc.id = "verification_events".code_id
        AND p.brand_id = NULLIF(current_setting('app.current_brand_id', true), '')
    )
  );

-- ── fraud_flags (via verification_events → ... → brand_id) ────────────
ALTER TABLE "fraud_flags" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "fraud_flags" FORCE ROW LEVEL SECURITY;
CREATE POLICY brand_isolation ON "fraud_flags"
  USING (
    current_setting('app.is_super_admin', true) = 'true'
    OR EXISTS (
      SELECT 1 FROM "verification_events" ve
      JOIN "sticker_codes" sc ON sc.id = ve.code_id
      JOIN "sticker_batches" sb ON sb.id = sc.batch_id
      JOIN "products" p ON p.id = sb.product_id
      WHERE ve.id = "fraud_flags".verification_event_id
        AND p.brand_id = NULLIF(current_setting('app.current_brand_id', true), '')
    )
  );

-- ── coupons (via verification_events → ... → brand_id) ─────────────────
ALTER TABLE "coupons" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "coupons" FORCE ROW LEVEL SECURITY;
CREATE POLICY brand_isolation ON "coupons"
  USING (
    current_setting('app.is_super_admin', true) = 'true'
    OR EXISTS (
      SELECT 1 FROM "verification_events" ve
      JOIN "sticker_codes" sc ON sc.id = ve.code_id
      JOIN "sticker_batches" sb ON sb.id = sc.batch_id
      JOIN "products" p ON p.id = sb.product_id
      WHERE ve.id = "coupons".verification_event_id
        AND p.brand_id = NULLIF(current_setting('app.current_brand_id', true), '')
    )
  );

-- audit_logs and refresh_tokens intentionally have no brand RLS:
-- audit_logs is a Super-Admin-only, platform-wide surface by design;
-- refresh_tokens is only ever queried by the auth module scoped to a
-- single user id, never brand-scoped.

-- ── verification-service grants ─────────────────────────────────────────
-- supseal_verify (BYPASSRLS, see infra/postgres-init/01-roles.sh) needs
-- exactly these privileges and nothing else — no users, no audit_logs, no
-- brand-admin tables.
GRANT SELECT ON "products", "brands" TO supseal_verify;
GRANT SELECT, UPDATE ON "sticker_codes" TO supseal_verify;
GRANT SELECT, INSERT ON "verification_events" TO supseal_verify;
GRANT SELECT, INSERT ON "coupons" TO supseal_verify;

-- ── platform-api runtime grants ─────────────────────────────────────────
-- supseal_app (NOT a superuser, NOT the table owner — see
-- infra/postgres-init/01-roles.sh for why that distinction is what makes
-- the RLS policies above actually take effect) is what platform-api
-- connects as at runtime. It needs full CRUD on every table — RLS policies
-- above do the tenant-scoping, not table-level grants — and the ALTER
-- DEFAULT PRIVILEGES clause extends the same grant to tables created by
-- migrations that haven't been written yet.
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO supseal_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO supseal_app;
ALTER DEFAULT PRIVILEGES FOR ROLE supseal IN SCHEMA public GRANT ALL ON TABLES TO supseal_app;
ALTER DEFAULT PRIVILEGES FOR ROLE supseal IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO supseal_app;
