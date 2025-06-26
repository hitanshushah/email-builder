-- migrate:up
ALTER TABLE templates ADD COLUMN key VARCHAR(100);

-- Update existing templates to have a key (lowercase, no spaces)
UPDATE templates SET key = LOWER(REPLACE(name, ' ', '')) WHERE key IS NULL;

-- Handle potential duplicate keys by adding a suffix
WITH duplicates AS (
  SELECT id, key, ROW_NUMBER() OVER (PARTITION BY key, user_id ORDER BY id) as rn
  FROM templates 
  WHERE key IS NOT NULL
)
UPDATE templates 
SET key = templates.key || '_' || (duplicates.rn - 1)
FROM duplicates 
WHERE templates.id = duplicates.id AND duplicates.rn > 1;

-- Create a unique index on key and user_id to prevent duplicate keys per user
CREATE UNIQUE INDEX idx_templates_key_user_id ON templates(key, user_id);

-- migrate:down
DROP INDEX IF EXISTS idx_templates_key_user_id;
ALTER TABLE templates DROP COLUMN IF EXISTS key; 