const { get, run } = require("../db");

const getUserByUsername = async (username) => {
  return get(
    `
    SELECT users.id,
           users.username,
           users.password_hash,
           users.password_salt,
           users.is_active,
           roles.name AS role
    FROM users
    JOIN roles ON users.role_id = roles.id
    WHERE users.username = ?;
  `,
    [username]
  );
};

const getUserById = async (id) => {
  return get(
    `
    SELECT users.id,
           users.username,
           users.is_active,
           roles.name AS role
    FROM users
    JOIN roles ON users.role_id = roles.id
    WHERE users.id = ?;
  `,
    [id]
  );
};

const createUser = async ({ username, hash, salt, roleId }) => {
  return run(
    "INSERT INTO users (username, password_hash, password_salt, role_id) VALUES (?, ?, ?, ?);",
    [username, hash, salt, roleId]
  );
};

module.exports = { getUserByUsername, getUserById, createUser };
