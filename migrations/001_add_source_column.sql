-- 001_add_source_column.sql
--
-- Adds the `source` column to an existing gullak database.
-- Fresh databases already get this column from createTableSQL in store.go;
-- this file is only for databases created before the feature landed.
--
-- Apply with:
--     sqlite3 /path/to/gullak.db < migrations/001_add_source_column.sql
--
-- Verify with:
--     sqlite3 /path/to/gullak.db "PRAGMA table_info(transactions);" | grep source
--
-- NOT idempotent: re-running fails with "duplicate column name: source", which
-- is the signal that it has already been applied. SQLite has no
-- ADD COLUMN IF NOT EXISTS.
--
-- Existing rows are backfilled with '' by the DEFAULT. This is intentional:
-- '' means "row predates the source feature". There is no data backfill.

ALTER TABLE transactions ADD COLUMN source TEXT NOT NULL DEFAULT '';
