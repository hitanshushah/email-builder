-- migrate:up
-- Remove any existing unique constraint on key
ALTER TABLE categories DROP CONSTRAINT IF EXISTS idx_categories_key;
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_key_key;
DROP INDEX IF EXISTS idx_categories_key;

-- Add unique constraint on (key, user_id)
CREATE UNIQUE INDEX idx_categories_key_user_id ON categories(key, user_id);

-- migrate:down
DROP INDEX IF EXISTS idx_categories_key_user_id;
CREATE UNIQUE INDEX idx_categories_key ON categories(key); 