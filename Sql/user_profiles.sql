DROP TABLE IF EXISTS user_profiles;

CREATE TABLE user_profiles(
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE,
    age INTEGER,
    city VARCHAR(200),
    url VARCHAR(200)
);

-- createdb DataBaseName
-- DONT FORGET psql -d petition -f Sql/user_profiles.sql
-- INSIDE THE DATABASE psql -d petition
