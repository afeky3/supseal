-- Split from the batch fields migration: Postgres requires a new enum value
-- to be committed before it can be referenced (e.g. as a column DEFAULT) —
-- doing both in one transaction throws "unsafe use of new value". This
-- migration only adds the values; the next one uses them.
ALTER TYPE "BatchStatus" ADD VALUE 'PROCESSING';
ALTER TYPE "BatchStatus" ADD VALUE 'FAILED';
