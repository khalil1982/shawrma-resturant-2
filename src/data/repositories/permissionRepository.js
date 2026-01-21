const { get, all } = require("../db");

const userHasPermission = async (userId, permissionKey) => {
  const row = await get(
    `
    SELECT COUNT(*) AS count
    FROM users
    JOIN roles ON users.role_id = roles.id
    JOIN role_permissions ON roles.id = role_permissions.role_id
    JOIN permissions ON permissions.id = role_permissions.permission_id
    WHERE users.id = ? AND permissions.key = ?;
  `,
    [userId, permissionKey]
  );
  return row && row.count > 0;
};

const getPermissionsForUser = async (userId) => {
  return all(
    `
    SELECT permissions.key
    FROM users
    JOIN roles ON users.role_id = roles.id
    JOIN role_permissions ON roles.id = role_permissions.role_id
    JOIN permissions ON permissions.id = role_permissions.permission_id
    WHERE users.id = ?
    ORDER BY permissions.key ASC;
  `,
    [userId]
  );
};

module.exports = { userHasPermission, getPermissionsForUser };
