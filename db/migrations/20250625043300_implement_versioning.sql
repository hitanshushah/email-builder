-- migrate:up

DROP TABLE IF EXISTS versions CASCADE;
DROP TABLE IF EXISTS templates CASCADE;

CREATE TABLE templates (
  id SERIAL PRIMARY KEY,
  key VARCHAR(36) NOT NULL,
  key_name VARCHAR(100) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  user_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_templates_key_user_id ON templates(key, user_id);
CREATE UNIQUE INDEX idx_templates_key_name_user_id ON templates(key_name, user_id);

CREATE TABLE versions (
  id SERIAL PRIMARY KEY,
  template_id INTEGER REFERENCES templates(id) ON DELETE CASCADE,
  file_name VARCHAR(100) NOT NULL,
  link VARCHAR(255) NOT NULL,
  version_no INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(template_id, version_no)
);

CREATE INDEX idx_versions_template_id ON versions(template_id);

-- migrate:down
DROP TABLE IF EXISTS versions;
DROP TABLE IF EXISTS templates; 