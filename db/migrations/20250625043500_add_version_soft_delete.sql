-- migrate:up
ALTER TABLE versions
  ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN deleted_at TIMESTAMP;

-- migrate:down
ALTER TABLE versions
  DROP COLUMN IF EXISTS updated_at,
  DROP COLUMN IF EXISTS deleted_at; 