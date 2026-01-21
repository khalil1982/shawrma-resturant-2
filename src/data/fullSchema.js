const { run, all } = require("./db");
const { hashPassword } = require("../logic/authService");

/**
 * النظام الكامل لقاعدة البيانات
 * يحتوي على جميع الجداول من Phase 1 إلى Phase 5
 */

// ==================== الصلاحيات الكاملة ====================
const ALL_PERMISSIONS = [
  // صلاحيات المصادقة
  "auth.login",
  "auth.logout",

  // صلاحيات المستخدمين
  "user.read",
  "user.create",
  "user.update",
  "user.delete",
  "user.manage",

  // صلاحيات الورديات
  "shift.read",
  "shift.open",
  "shift.close",
  "shift.override",

  // صلاحيات الطلبات
  "order.read",
  "order.create",
  "order.update",
  "order.delete",
  "order.cancel",

  // صلاحيات الأصناف
  "menu.read",
  "menu.create",
  "menu.update",
  "menu.delete",

  // صلاحيات الفئات
  "category.read",
  "category.create",
  "category.update",
  "category.delete",

  // صلاحيات المصاريف
  "expense.read",
  "expense.create",
  "expense.update",
  "expense.delete",

  // صلاحيات التقارير
  "report.daily",
  "report.period",
  "report.shift",
  "report.export",

  // صلاحيات التدقيق
  "audit.read",
  "audit.export",

  // صلاحيات النظام
  "system.settings",
  "system.backup",
];

// ==================== الأدوار ====================
const ROLES = [
  { name: "admin", display_name: "مدير" },
  { name: "manager", display_name: "مشرف" },
  { name: "cashier", display_name: "كاشير" },
];

/**
 * تهيئة جميع الجداول
 */
const initializeFullSchema = async () => {
  // ========== Phase 1 & 2: الأساسيات ==========
  await createRolesTables();
  await createUsersTables();
  await createAuditTables();

  // ========== Phase 3: الورديات والطلبات ==========
  await createShiftsTables();
  await createMenuTables();
  await createOrdersTables();

  // ========== Phase 4: المصاريف والتقارير ==========
  await createExpensesTables();
  await createCashManagementTables();

  // ========== Phase 5: التحسينات ==========
  await createSettingsTables();
  await createBackupTables();

  // ========== Seed البيانات الأولية ==========
  await seedRoles();
  await seedPermissions();
  await seedRolePermissions();
  await ensureDefaultUsers();
  await seedDefaultCategories();
  await seedDefaultMenu();

  console.log("✅ تم تهيئة قاعدة البيانات بنجاح");
};

// ==================== الأدوار والصلاحيات ====================

const createRolesTables = async () => {
  // جدول الأدوار
  await run(`
    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      description TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // جدول الصلاحيات
  await run(`
    CREATE TABLE IF NOT EXISTS permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // جدول ربط الأدوار بالصلاحيات
  await run(`
    CREATE TABLE IF NOT EXISTS role_permissions (
      role_id INTEGER NOT NULL,
      permission_id INTEGER NOT NULL,
      granted_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (role_id, permission_id),
      FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
      FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
    );
  `);
};

// ==================== المستخدمون ====================

const createUsersTables = async () => {
  // جدول المستخدمين
  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      role_id INTEGER NOT NULL,
      full_name TEXT,
      phone TEXT,
      email TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      last_login_at TEXT,
      failed_login_attempts INTEGER NOT NULL DEFAULT 0,
      locked_until TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (role_id) REFERENCES roles(id)
    );
  `);

  // جدول الجلسات
  await run(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      started_at TEXT NOT NULL DEFAULT (datetime('now')),
      expires_at TEXT NOT NULL,
      ended_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Index للجلسات النشطة
  await run(`
    CREATE INDEX IF NOT EXISTS idx_sessions_active
    ON sessions (user_id, expires_at)
    WHERE ended_at IS NULL;
  `);
};

// ==================== التدقيق ====================

const createAuditTables = async () => {
  // جدول سجلات التدقيق
  await run(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id INTEGER,
      old_value TEXT,
      new_value TEXT,
      ip_address TEXT,
      user_agent TEXT,
      meta TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // Index للبحث السريع
  await run(`
    CREATE INDEX IF NOT EXISTS idx_audit_logs_search
    ON audit_logs (user_id, entity_type, created_at);
  `);
};

// ==================== الورديات ====================

const createShiftsTables = async () => {
  // جدول الورديات
  await run(`
    CREATE TABLE IF NOT EXISTS shifts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shift_number INTEGER NOT NULL,
      shift_date TEXT NOT NULL,
      shift_type TEXT NOT NULL CHECK (shift_type IN ('morning', 'evening')),
      state TEXT NOT NULL CHECK (state IN ('open', 'active', 'closed')) DEFAULT 'open',
      opened_by INTEGER NOT NULL,
      opened_at TEXT NOT NULL DEFAULT (datetime('now')),
      opening_cash REAL NOT NULL DEFAULT 0,
      expected_cash REAL NOT NULL DEFAULT 0,
      actual_cash REAL,
      cash_variance REAL,
      variance_reason TEXT,
      closed_by INTEGER,
      closed_at TEXT,
      close_reason TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (opened_by) REFERENCES users(id),
      FOREIGN KEY (closed_by) REFERENCES users(id)
    );
  `);

  // فهرس فريد: وردية واحدة نشطة فقط
  await run(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_shifts_single_active
    ON shifts ((1))
    WHERE state IN ('open', 'active');
  `);

  // فهرس للبحث بالتاريخ
  await run(`
    CREATE INDEX IF NOT EXISTS idx_shifts_date
    ON shifts (shift_date, shift_type);
  `);

  // جدول تفاصيل الفروقات المالية
  await run(`
    CREATE TABLE IF NOT EXISTS cash_variance_details (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shift_id INTEGER NOT NULL,
      variance_type TEXT NOT NULL CHECK (
        variance_type IN ('shortage', 'overage', 'correction')
      ),
      amount REAL NOT NULL,
      reason TEXT NOT NULL,
      approved_by INTEGER,
      approved_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE CASCADE,
      FOREIGN KEY (approved_by) REFERENCES users(id)
    );
  `);
};

// ==================== القائمة والأصناف ====================

const createMenuTables = async () => {
  // جدول الفئات
  await run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      name_en TEXT,
      description TEXT,
      icon TEXT,
      display_order INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // جدول الأصناف
  await run(`
    CREATE TABLE IF NOT EXISTS menu_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      name_en TEXT,
      description TEXT,
      price REAL NOT NULL CHECK (price >= 0),
      cost REAL CHECK (cost >= 0),
      sku TEXT UNIQUE,
      barcode TEXT UNIQUE,
      icon TEXT,
      image_path TEXT,
      display_order INTEGER NOT NULL DEFAULT 0,
      is_available INTEGER NOT NULL DEFAULT 1,
      is_active INTEGER NOT NULL DEFAULT 1,
      preparation_time INTEGER DEFAULT 0,
      calories INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );
  `);

  // فهرس للبحث
  await run(`
    CREATE INDEX IF NOT EXISTS idx_menu_items_search
    ON menu_items (category_id, is_active, is_available);
  `);

  // جدول الإضافات والخيارات
  await run(`
    CREATE TABLE IF NOT EXISTS menu_item_options (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      menu_item_id INTEGER NOT NULL,
      option_name TEXT NOT NULL,
      option_type TEXT NOT NULL CHECK (
        option_type IN ('addon', 'size', 'modifier')
      ),
      price_adjustment REAL NOT NULL DEFAULT 0,
      is_default INTEGER NOT NULL DEFAULT 0,
      is_available INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
    );
  `);
};

// ==================== الطلبات ====================

const createOrdersTables = async () => {
  // جدول الطلبات
  await run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT NOT NULL UNIQUE,
      shift_id INTEGER NOT NULL,
      status TEXT NOT NULL CHECK (
        status IN ('pending', 'preparing', 'ready', 'completed', 'cancelled')
      ) DEFAULT 'pending',
      order_type TEXT NOT NULL CHECK (
        order_type IN ('dine_in', 'takeaway', 'delivery')
      ),
      customer_name TEXT,
      customer_phone TEXT,
      customer_count INTEGER NOT NULL DEFAULT 1,
      table_number TEXT,
      subtotal REAL NOT NULL DEFAULT 0,
      tax_rate REAL NOT NULL DEFAULT 0.15,
      tax_amount REAL NOT NULL DEFAULT 0,
      discount_type TEXT CHECK (discount_type IN ('percent', 'fixed')),
      discount_value REAL NOT NULL DEFAULT 0,
      discount_amount REAL NOT NULL DEFAULT 0,
      total_amount REAL NOT NULL DEFAULT 0,
      paid_amount REAL NOT NULL DEFAULT 0,
      change_amount REAL NOT NULL DEFAULT 0,
      payment_method TEXT CHECK (
        payment_method IN ('cash', 'card', 'split')
      ),
      notes TEXT,
      created_by INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at TEXT,
      cancelled_by INTEGER,
      cancelled_at TEXT,
      cancel_reason TEXT,
      FOREIGN KEY (shift_id) REFERENCES shifts(id),
      FOREIGN KEY (created_by) REFERENCES users(id),
      FOREIGN KEY (cancelled_by) REFERENCES users(id)
    );
  `);

  // فهرس للوردية والحالة
  await run(`
    CREATE INDEX IF NOT EXISTS idx_orders_shift_status
    ON orders (shift_id, status, created_at);
  `);

  // جدول أصناف الطلب
  await run(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      menu_item_id INTEGER,
      item_name TEXT NOT NULL,
      unit_price REAL NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      line_subtotal REAL NOT NULL,
      discount_amount REAL NOT NULL DEFAULT 0,
      line_total REAL NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
    );
  `);

  // جدول خيارات أصناف الطلب
  await run(`
    CREATE TABLE IF NOT EXISTS order_item_options (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_item_id INTEGER NOT NULL,
      option_name TEXT NOT NULL,
      price_adjustment REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE CASCADE
    );
  `);

  // جدول تاريخ حالات الطلب
  await run(`
    CREATE TABLE IF NOT EXISTS order_status_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      from_status TEXT,
      to_status TEXT NOT NULL,
      changed_by INTEGER NOT NULL,
      reason TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (changed_by) REFERENCES users(id)
    );
  `);
};

// ==================== المصاريف ====================

const createExpensesTables = async () => {
  // جدول المصاريف
  await run(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shift_id INTEGER,
      category TEXT NOT NULL,
      amount REAL NOT NULL CHECK (amount > 0),
      description TEXT NOT NULL,
      payment_method TEXT CHECK (
        payment_method IN ('cash', 'card', 'other')
      ) DEFAULT 'cash',
      receipt_number TEXT,
      vendor_name TEXT,
      approved_by INTEGER,
      approved_at TEXT,
      expense_date TEXT NOT NULL,
      created_by INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (shift_id) REFERENCES shifts(id),
      FOREIGN KEY (created_by) REFERENCES users(id),
      FOREIGN KEY (approved_by) REFERENCES users(id)
    );
  `);

  // فهرس للبحث بالتاريخ والفئة
  await run(`
    CREATE INDEX IF NOT EXISTS idx_expenses_search
    ON expenses (expense_date, category, shift_id);
  `);
};

// ==================== إدارة النقد ====================

const createCashManagementTables = async () => {
  // جدول حركات النقد
  await run(`
    CREATE TABLE IF NOT EXISTS cash_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shift_id INTEGER,
      movement_type TEXT NOT NULL CHECK (
        movement_type IN ('deposit', 'withdrawal', 'adjustment')
      ),
      amount REAL NOT NULL,
      reason TEXT NOT NULL,
      reference_type TEXT,
      reference_id INTEGER,
      performed_by INTEGER NOT NULL,
      approved_by INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (shift_id) REFERENCES shifts(id),
      FOREIGN KEY (performed_by) REFERENCES users(id),
      FOREIGN KEY (approved_by) REFERENCES users(id)
    );
  `);
};

// ==================== الإعدادات ====================

const createSettingsTables = async () => {
  // جدول الإعدادات
  await run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      value_type TEXT NOT NULL CHECK (
        value_type IN ('string', 'number', 'boolean', 'json')
      ),
      description TEXT,
      is_editable INTEGER NOT NULL DEFAULT 1,
      updated_by INTEGER,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (updated_by) REFERENCES users(id)
    );
  `);

  // إدراج الإعدادات الافتراضية
  await run(`
    INSERT OR IGNORE INTO settings (key, value, value_type, description, is_editable)
    VALUES
      ('restaurant_name', 'مطعم الشاورما', 'string', 'اسم المطعم', 1),
      ('tax_rate', '0.15', 'number', 'نسبة الضريبة', 1),
      ('currency', 'ر.س', 'string', 'العملة', 1),
      ('receipt_footer', 'شكراً لزيارتكم', 'string', 'نص أسفل الفاتورة', 1),
      ('auto_print_receipt', 'false', 'boolean', 'طباعة تلقائية للفاتورة', 1),
      ('allow_negative_stock', 'false', 'boolean', 'السماح بالمخزون السالب', 1),
      ('backup_enabled', 'true', 'boolean', 'تفعيل النسخ الاحتياطي', 0);
  `);
};

// ==================== النسخ الاحتياطي ====================

const createBackupTables = async () => {
  // جدول النسخ الاحتياطية
  await run(`
    CREATE TABLE IF NOT EXISTS backups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      backup_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER,
      backup_type TEXT NOT NULL CHECK (
        backup_type IN ('manual', 'automatic', 'scheduled')
      ),
      created_by INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );
  `);
};

// ==================== Seed Functions ====================

const seedRoles = async () => {
  for (const role of ROLES) {
    await run(
      `INSERT OR IGNORE INTO roles (name, display_name) VALUES (?, ?);`,
      [role.name, role.display_name]
    );
  }
};

const seedPermissions = async () => {
  for (const permission of ALL_PERMISSIONS) {
    await run(`INSERT OR IGNORE INTO permissions (key) VALUES (?);`, [
      permission,
    ]);
  }
};

const seedRolePermissions = async () => {
  const roles = await all("SELECT id, name FROM roles;");
  const perms = await all("SELECT id, key FROM permissions;");
  const permissionMap = new Map(perms.map((p) => [p.key, p.id]));

  for (const role of roles) {
    let rolePermissions = [];

    if (role.name === "admin") {
      // Admin له كل الصلاحيات
      rolePermissions = ALL_PERMISSIONS;
    } else if (role.name === "manager") {
      // Manager له معظم الصلاحيات ما عدا إعدادات النظام
      rolePermissions = ALL_PERMISSIONS.filter(
        (p) => !p.startsWith("system.")
      );
    } else if (role.name === "cashier") {
      // Cashier له صلاحيات محدودة
      rolePermissions = [
        "auth.login",
        "auth.logout",
        "shift.read",
        "order.read",
        "order.create",
        "menu.read",
        "category.read",
      ];
    }

    for (const key of rolePermissions) {
      const permissionId = permissionMap.get(key);
      if (!permissionId) continue;

      await run(
        `INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?);`,
        [role.id, permissionId]
      );
    }
  }
};

const ensureDefaultUsers = async () => {
  const existingUser = await all("SELECT id FROM users LIMIT 1;");
  if (existingUser.length > 0) return;

  const adminRole = await all("SELECT id FROM roles WHERE name = ?;", ["admin"]);
  const { hash, salt } = await hashPassword("admin123");

  await run(
    `INSERT INTO users (username, password_hash, password_salt, role_id, full_name)
     VALUES (?, ?, ?, ?, ?);`,
    [
      "admin",
      hash,
      salt,
      adminRole[0].id,
      "المدير العام",
    ]
  );

  console.log("✅ تم إنشاء المستخدم الافتراضي: admin / admin123");
};

const seedDefaultCategories = async () => {
  const categories = [
    { name: "شاورما", name_en: "Shawarma", icon: "🥙", display_order: 1 },
    { name: "فاهيتا", name_en: "Fajita", icon: "🌯", display_order: 2 },
    { name: "دجاج", name_en: "Chicken", icon: "🍗", display_order: 3 },
    { name: "مشروبات", name_en: "Drinks", icon: "🥤", display_order: 4 },
    { name: "مقبلات", name_en: "Appetizers", icon: "🍟", display_order: 5 },
  ];

  for (const cat of categories) {
    await run(
      `INSERT OR IGNORE INTO categories (name, name_en, icon, display_order)
       VALUES (?, ?, ?, ?);`,
      [cat.name, cat.name_en, cat.icon, cat.display_order]
    );
  }
};

const seedDefaultMenu = async () => {
  const existingItems = await all("SELECT id FROM menu_items LIMIT 1;");
  if (existingItems.length > 0) return;

  const categories = await all("SELECT id, name FROM categories;");
  const categoryMap = new Map(categories.map((c) => [c.name, c.id]));

  const menuItems = [
    {
      category: "شاورما",
      name: "شاورما عادي",
      name_en: "Regular Shawarma",
      price: 25,
      cost: 10,
    },
    {
      category: "شاورما",
      name: "شاورما خاص",
      name_en: "Special Shawarma",
      price: 30,
      cost: 12,
    },
    {
      category: "فاهيتا",
      name: "فاهيتا دجاج",
      name_en: "Chicken Fajita",
      price: 30,
      cost: 12,
    },
    {
      category: "دجاج",
      name: "دجاج مقلي",
      name_en: "Fried Chicken",
      price: 35,
      cost: 15,
    },
    {
      category: "مشروبات",
      name: "بيبسي",
      name_en: "Pepsi",
      price: 5,
      cost: 2,
    },
    {
      category: "مقبلات",
      name: "بطاطس مقلية",
      name_en: "French Fries",
      price: 10,
      cost: 3,
    },
  ];

  for (const item of menuItems) {
    const categoryId = categoryMap.get(item.category);
    if (!categoryId) continue;

    await run(
      `INSERT INTO menu_items (category_id, name, name_en, price, cost)
       VALUES (?, ?, ?, ?, ?);`,
      [categoryId, item.name, item.name_en, item.price, item.cost]
    );
  }

  console.log("✅ تم إنشاء قائمة الطعام الافتراضية");
};

module.exports = {
  initializeFullSchema,
};
