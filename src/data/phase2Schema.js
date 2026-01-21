const { run, all } = require("./db");

const PHASE2_PERMISSIONS = [
  "shift.open",
  "shift.close",
  "shift.override",
  "order.read",
  "order.create",
  "order.update",
  "order.cancel",
];

const initializePhase2Schema = async () => {
  await run(`
    CREATE TABLE IF NOT EXISTS shifts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shift_date TEXT NOT NULL,
      shift_type TEXT NOT NULL CHECK (shift_type IN ('morning', 'evening')),
      state TEXT NOT NULL CHECK (state IN ('open', 'active', 'closed')),
      opened_by INTEGER NOT NULL,
      opened_at TEXT NOT NULL,
      opening_cash REAL NOT NULL,
      closing_cash REAL,
      closed_by INTEGER,
      closed_at TEXT,
      close_reason TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (opened_by) REFERENCES users(id),
      FOREIGN KEY (closed_by) REFERENCES users(id)
    );
  `);

  // Enforce only one active/open shift at a time.
  await run(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_shifts_single_active
    ON shifts ((1))
    WHERE state IN ('open', 'active');
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS cash_variance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shift_id INTEGER NOT NULL UNIQUE,
      expected_cash REAL NOT NULL,
      actual_cash REAL NOT NULL,
      variance REAL NOT NULL,
      reason TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE CASCADE
    );
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shift_id INTEGER NOT NULL,
      status TEXT NOT NULL CHECK (
        status IN ('created', 'preparing', 'ready', 'delivered', 'cancelled')
      ),
      order_type TEXT NOT NULL CHECK (order_type IN ('dine_in', 'takeaway')),
      customer_count INTEGER NOT NULL,
      subtotal REAL NOT NULL DEFAULT 0,
      discount_percent REAL NOT NULL DEFAULT 0,
      discount_amount REAL NOT NULL DEFAULT 0,
      total_amount REAL NOT NULL DEFAULT 0,
      refunded_amount REAL NOT NULL DEFAULT 0,
      created_by INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      cancelled_by INTEGER,
      cancelled_at TEXT,
      cancel_reason TEXT,
      FOREIGN KEY (shift_id) REFERENCES shifts(id),
      FOREIGN KEY (created_by) REFERENCES users(id),
      FOREIGN KEY (cancelled_by) REFERENCES users(id)
    );
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      menu_item_id INTEGER,
      item_name TEXT NOT NULL,
      unit_price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      line_total REAL NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS order_status_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      from_status TEXT,
      to_status TEXT NOT NULL,
      changed_by INTEGER NOT NULL,
      changed_at TEXT NOT NULL DEFAULT (datetime('now')),
      reason TEXT,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (changed_by) REFERENCES users(id)
    );
  `);

  await seedPhase2Permissions();
  await seedPhase2RolePermissions();
};

const seedPhase2Permissions = async () => {
  for (const permission of PHASE2_PERMISSIONS) {
    await run("INSERT OR IGNORE INTO permissions (key) VALUES (?);", [
      permission,
    ]);
  }
};

const seedPhase2RolePermissions = async () => {
  const roles = await all("SELECT id, name FROM roles;");
  const perms = await all("SELECT id, key FROM permissions;");
  const permissionMap = new Map(perms.map((perm) => [perm.key, perm.id]));

  for (const role of roles) {
    const rolePerms =
      role.name === "manager"
        ? PHASE2_PERMISSIONS
        : ["order.read", "order.create", "order.update", "order.cancel"];
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

module.exports = { initializePhase2Schema };
