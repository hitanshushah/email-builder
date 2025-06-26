-- migrate:up

-- Drop existing tables and recreate with new structure
DROP TABLE IF EXISTS versions CASCADE;
DROP TABLE IF EXISTS templates CASCADE;

CREATE TABLE templates (
  id SERIAL PRIMARY KEY,
  key VARCHAR(36) NOT NULL, -- UUID
  key_name VARCHAR(100) NOT NULL, -- Generated key name (lowercase, no spaces)
  display_name VARCHAR(100) NOT NULL, -- User-facing template name
  user_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create unique index on key and user_id to prevent duplicate keys per user
CREATE UNIQUE INDEX idx_templates_key_user_id ON templates(key, user_id);
-- Create unique index on key_name and user_id to prevent duplicate key_names per user
CREATE UNIQUE INDEX idx_templates_key_name_user_id ON templates(key_name, user_id);

-- Create versions table
CREATE TABLE versions (
  id SERIAL PRIMARY KEY,
  template_id INTEGER REFERENCES templates(id) ON DELETE CASCADE,
  file_name VARCHAR(100) NOT NULL, -- User entered file name
  link VARCHAR(255) NOT NULL,
  version_no INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(template_id, version_no)
);

-- Create index on template_id for faster lookups
CREATE INDEX idx_versions_template_id ON versions(template_id);

-- migrate:down
DROP TABLE IF EXISTS versions;
DROP TABLE IF EXISTS templates; 