-- supseal_verify's context/check queries join sticker_codes -> sticker_batches
-- -> products (to resolve product/brand info and to build coupon context).
-- The original grant list in 20260913073054_rls_policies missed
-- sticker_batches itself — Prisma's nested `select` on the batch relation
-- performs a real SQL join against this table, which needs SELECT even
-- though the application code never queries it by name directly.
GRANT SELECT ON "sticker_batches" TO supseal_verify;
