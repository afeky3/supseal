-- Prisma's .create() always appends "RETURNING <selected columns>" to the
-- INSERT it generates — and Postgres requires SELECT privilege on any
-- column named in a RETURNING clause, not just INSERT privilege on the
-- table. 20260922072313_verify_grants_support_fraud granted supseal_verify
-- only INSERT on support_tickets, which is why FraudFlag creation worked
-- (it got both SELECT and INSERT there) but SupportTicket creation failed
-- with "permission denied for table support_tickets" despite the INSERT
-- grant clearly being present.
GRANT SELECT ON "support_tickets" TO supseal_verify;
