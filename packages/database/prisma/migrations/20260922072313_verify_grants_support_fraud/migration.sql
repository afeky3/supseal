-- verification-service now takes two more public, unauthenticated write
-- paths from the consumer result pages: a support ticket (FR-SUP-01, needs
-- a resolvable brand via the code) and a fraud report (FR-FRD-04, has no
-- brand — attached to the verification_event itself instead). Both need
-- grants for supseal_verify (BYPASSRLS, see infra/postgres-init/01-roles.sh)
-- beyond what 20260913073054_rls_policies and
-- 20260913075353_verify_grant_sticker_batches already gave it.
GRANT INSERT ON "support_tickets" TO supseal_verify;
GRANT SELECT, INSERT ON "fraud_flags" TO supseal_verify;
