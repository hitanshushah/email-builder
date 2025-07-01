-- migrate:up

CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_categories_key ON categories(key);

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