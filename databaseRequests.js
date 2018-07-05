var spicedPg = require("spiced-pg");

var db = spicedPg(
    process.env.DATABASE_URL ||
        "postgres:postgres:postgres@localhost:5432/petition"
);

exports.registration = function(first, last, email, hashpassword) {
    return db.query(
        "INSERT INTO users (first, last, email, hashpassword) VALUES ($1, $2, $3, $4) RETURNING id,first,last", //code it against sequel injections
        [first, last, email, hashpassword]
    );
};

exports.signing = function(user_id, signature) {
    return db
        .query(
            "INSERT INTO signatures (user_id, signature) VALUES ($1, $2) RETURNING id", //code it against sequel injections
            [user_id, signature]
        )
        .then(function(results) {
            return results.rows[0].id;
        });
};

exports.signersList = function() {
    return db
        .query(
            `SELECT users.first, users.last, user_profiles.age, user_profiles.city, user_profiles.url
            FROM users
            LEFT JOIN user_profiles
            ON users.id = user_profiles.user_id`
        )
        .then(function(results) {
            return results.rows;
        });
};

exports.getSignatureById = function(sigId) {
    return db
        .query("SELECT signature FROM signatures WHERE id=$1", [sigId])
        .then(result => {
            return result.rows[0].signature;
        });
};

exports.getUserByEmail = function(email) {
    return db
        .query(
            `SELECT users.id, users.first, users.last, users.email, users.hashpassword, signatures.id AS sigid
            FROM users
            LEFT JOIN signatures
            ON users.id = signatures.user_id
            WHERE email = $1 `,
            [email]
        )
        .then(results => {
            return results.rows[0];
        });
};

exports.profileInformationToTable = function(userId, age, city, url) {
    return db.query(
        `INSERT INTO user_profiles (user_id, age, city, url) VALUES ($1, $2, $3, $4)`,
        [userId, age ? Number(age) : null, city, url]
    );
};

exports.getUsersRegistration = function(userId) {
    return db
        .query(
            `SELECT users.first, users.last, users.email, user_profiles.age, user_profiles.city, user_profiles.url
            FROM users
            LEFT JOIN user_profiles
            ON users.id = user_profiles.user_id
            WHERE users.id = $1`,
            [userId]
        )
        .then(function(results) {
            return results.rows[0];
        });
};

exports.updateProfileInUsersWithPass = function(
    first,
    last,
    email,
    hashpassword,
    id
) {
    return db.query(
        `UPDATE users
            SET first = $1, last = $2, email = $3, hashpassword =$4
            WHERE id=$5
            `,
        [first, last, email, hashpassword, id || null]
    );
};

exports.updateProfileInUsersNoPass = function(first, last, email, id) {
    return db.query(
        `UPDATE users
            SET first = $1, last = $2, email = $3
            WHERE id=$4
            `,
        [first, last, email, id || null]
    );
};

exports.updateProfileInUserProfiles = function(age, city, url, user_id) {
    return db.query(
        `INSERT INTO user_profiles (age, city, url, user_id)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (user_id)
            DO UPDATE SET age = $1, city = $2, url = $3`,
        [age ? Number(age) : null, city, url, user_id]
    );
};

exports.deleteSignature = function(userId) {
    return db.query(
        `DELETE FROM signatures
        WHERE user_id = $1`,
        [userId]
    );
};
