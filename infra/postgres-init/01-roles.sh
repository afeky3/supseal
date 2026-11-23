#!/bin/sh
# Runs once, on first container init, before any Prisma migration.
#
# Creates two additional Postgres roles beyond the bootstrap POSTGRES_USER
# (which the official postgres image makes a SUPERUSER — important below):
#
#   supseal_app    — what platform-api actually connects as at runtime.
#                    Deliberately NOT a superuser and NOT the table owner,
#                    because superusers bypass Row-Level Security
#                    unconditionally, and ALTER TABLE ... FORCE ROW LEVEL
#                    SECURITY only strips the *owner's* bypass — it has no
#                    effect on a superuser. Running the app as the same
#                    superuser that owns the tables would make every RLS
#                    policy in prisma/migrations/*_rls_policies a no-op.
#                    supseal_app gets its table privileges via GRANT +
#                    ALTER DEFAULT PRIVILEGES in that same migration, so it
#                    automatically gets access to tables created by later
#                    migrations too.
#
#   supseal_verify — what verification-service connects as. See the longer
#                    comment below; this one legitimately bypasses RLS
#                    because its lookups are cross-brand by design.
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
  DO \$\$
  BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'supseal_app') THEN
      CREATE ROLE supseal_app WITH LOGIN PASSWORD '${SUPSEAL_APP_PASSWORD}';
    END IF;
  END
  \$\$;

  DO \$\$
  BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'supseal_verify') THEN
      CREATE ROLE supseal_verify WITH LOGIN PASSWORD '${SUPSEAL_VERIFY_PASSWORD}' BYPASSRLS;
    END IF;
  END
  \$\$;
EOSQL
