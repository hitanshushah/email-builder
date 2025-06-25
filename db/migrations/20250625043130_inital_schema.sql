-- migrate:up
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100)
);

CREATE TABLE templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  link VARCHAR(255),
  user_id INTEGER REFERENCES users(id)
);


-- migrate:down

