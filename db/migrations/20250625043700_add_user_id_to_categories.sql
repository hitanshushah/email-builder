-- migrate:up
ALTER TABLE categories
  ADD COLUMN user_id INTEGER REFERENCES users(id),
  ADD COLUMN deleted_at TIMESTAMP;

-- migrate:down
ALTER TABLE categories
  DROP COLUMN IF EXISTS user_id,
  DROP COLUMN IF EXISTS updated_at,
  DROP COLUMN IF EXISTS deleted_at; 