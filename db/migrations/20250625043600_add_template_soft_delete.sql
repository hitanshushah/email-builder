-- migrate:up
ALTER TABLE templates
  ADD COLUMN deleted_at TIMESTAMP;

-- migrate:down
ALTER TABLE templates
  DROP COLUMN IF EXISTS updated_at,
  DROP COLUMN IF EXISTS deleted_at; 