DROP TABLE IF EXISTS users;

CREATE TABLE users(
    id SERIAL PRIMARY KEY,
    first VARCHAR(200) NOT NULL,
    last VARCHAR(200) NOT NULL,
    email VARCHAR(200) NOT NULL UNIQUE,
    hashpassword VARCHAR(100) NOT NULL
);

-- createdb DataBaseName
-- DONT FORGET psql -d petition -f Sql/users.sql
-- INSIDE THE DATABASE psql -d petition
