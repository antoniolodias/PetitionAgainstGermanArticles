DROP TABLE IF EXISTS signatures;

CREATE TABLE signatures (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    signature TEXT NOT NULL
);
