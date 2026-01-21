const { run, get, all } = require("./db");
const { hashPassword } = require("../logic/authService");

const DEFAULT_ROLES = ["manager", "employee"];
const DEFAULT_PERMISSIONS = [
  "auth.login",
  "auth.logout",
  "user.read",
  "user.manage",
  "audit.read",
];

const initializeSchema = async () => {
  await run(`
    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    );
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL UNIQUE
    );
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS role_permissions (
      role_id INTEGER NOT NULL,
      permission_id INTEGER NOT NULL,
      PRIMARY KEY (role_id, permission_id),
      FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
      FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
    );
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      role_id INTEGER NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (role_id) REFERENCES roles(id)
    );
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      meta TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  await seedRoles();
  await seedPermissions();
  await seedRolePermissions();
  await ensureDefaultAdmin();
};

const seedRoles = async () => {
  for (const role of DEFAULT_ROLES) {
    await run("INSERT OR IGNORE INTO roles (name) VALUES (?);", [role]);
  }
};

const seedPermissions = async () => {
  for (const permission of DEFAULT_PERMISSIONS) {
    await run("INSERT OR IGNORE INTO permissions (key) VALUES (?);", [
      permission,
    ]);
  }
};

const seedRolePermissions = async () => {
  const roleRows = await all("SELECT id, name FROM roles;");
  const permRows = await all("SELECT id, key FROM permissions;");
  const permissionMap = new Map(permRows.map((p) => [p.key, p.id]));

  for (const role of roleRows) {
    const rolePerms =
      role.name === "manager"
        ? DEFAULT_PERMISSIONS
        : ["auth.login", "auth.logout", "user.read"];

    for (const key of rolePerms) {
      const permissionId = permissionMap.get(key);
      if (!permissionId) continue;
      await run(
        "INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?);",
        [role.id, permissionId]
      );
    }
  }
};

const ensureDefaultAdmin = async () => {
  const existingUser = await get("SELECT id FROM users LIMIT 1;");
  if (existingUser) return;

  const managerRole = await get("SELECT id FROM roles WHERE name = ?;", [
    "manager",
  ]);
  const { hash, salt } = await hashPassword("admin123");
  await run(
    "INSERT INTO users (username, password_hash, password_salt, role_id) VALUES (?, ?, ?, ?);",
    ["admin", hash, salt, managerRole.id]
  );
};

module.exports = { initializeSchema };
