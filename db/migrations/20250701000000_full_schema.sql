-- migrate:up
-- Drop dependent tables if they exist
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS versions CASCADE;
DROP TABLE IF EXISTS templates CASCADE;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100)
);

-- TEMPLATES
CREATE TABLE templates (
  id SERIAL PRIMARY KEY,
  key VARCHAR(36) NOT NULL,
  key_name VARCHAR(100) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  user_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);
CREATE UNIQUE INDEX idx_templates_key_user_id ON templates(key, user_id);
CREATE UNIQUE INDEX idx_templates_key_name_user_id ON templates(key_name, user_id);

-- VERSIONS
CREATE TABLE versions (
  id SERIAL PRIMARY KEY,
  template_id INTEGER REFERENCES templates(id) ON DELETE CASCADE,
  file_name VARCHAR(100) NOT NULL,
  link VARCHAR(255) NOT NULL,
  version_no INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  UNIQUE(template_id, version_no)
);
CREATE INDEX idx_versions_template_id ON versions(template_id);

-- CATEGORIES
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  user_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);
CREATE UNIQUE INDEX idx_categories_key_user_id ON categories(key, user_id);

-- TEMPLATE_CATEGORIES
CREATE TABLE template_categories (
  id SERIAL PRIMARY KEY,
  template_id INTEGER REFERENCES templates(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(template_id, category_id)
);
CREATE INDEX idx_template_categories_template_id ON template_categories(template_id);
CREATE INDEX idx_template_categories_category_id ON template_categories(category_id);

-- migrate:down
DROP TABLE IF EXISTS template_categories;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS versions;
DROP TABLE IF EXISTS templates;
DROP TABLE IF EXISTS users; 