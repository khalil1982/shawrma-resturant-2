export const schema = `
-- جدول المستخدمين
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT CHECK(role IN ('admin', 'cashier')) NOT NULL,
    full_name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- جدول الورديات
CREATE TABLE IF NOT EXISTS shifts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT CHECK(type IN ('morning', 'evening')) NOT NULL,
    opened_by INTEGER NOT NULL REFERENCES users(id),
    opened_at DATETIME NOT NULL,
    opening_balance REAL DEFAULT 0,
    closed_by INTEGER REFERENCES users(id),
    closed_at DATETIME,
    expected_balance REAL,
    actual_balance REAL,
    difference REAL,
    difference_reason TEXT,
    status TEXT CHECK(status IN ('open', 'closed')) DEFAULT 'open',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- جدول فئات الأصناف
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    icon TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- جدول الأصناف
CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL REFERENCES categories(id),
    name TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    price REAL NOT NULL CHECK(price >= 0),
    icon TEXT,
    is_active BOOLEAN DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- جدول الطلبات
CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shift_id INTEGER NOT NULL REFERENCES shifts(id),
    cashier_id INTEGER NOT NULL REFERENCES users(id),
    total_amount REAL NOT NULL CHECK(total_amount >= 0),
    payment_method TEXT CHECK(payment_method IN ('cash', 'card')) DEFAULT 'cash',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- جدول تفاصيل الطلبات
CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    item_id INTEGER NOT NULL REFERENCES items(id),
    quantity INTEGER NOT NULL CHECK(quantity > 0),
    unit_price REAL NOT NULL CHECK(unit_price >= 0),
    subtotal REAL NOT NULL CHECK(subtotal >= 0),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- جدول المصاريف
CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shift_id INTEGER REFERENCES shifts(id),
    category TEXT NOT NULL,
    amount REAL NOT NULL CHECK(amount > 0),
    description TEXT NOT NULL,
    receipt_number TEXT,
    recorded_by INTEGER NOT NULL REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- جدول المشتريات
CREATE TABLE IF NOT EXISTS purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    supplier_name TEXT NOT NULL,
    total_amount REAL NOT NULL CHECK(total_amount > 0),
    payment_status TEXT CHECK(payment_status IN ('paid', 'pending')) DEFAULT 'pending',
    invoice_number TEXT,
    notes TEXT,
    recorded_by INTEGER NOT NULL REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- جدول سجل التدقيق (Audit Log)
CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id INTEGER,
    old_values TEXT,
    new_values TEXT,
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- جدول الإعدادات
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_shifts_status ON shifts(status);
CREATE INDEX IF NOT EXISTS idx_shifts_opened_at ON shifts(opened_at);
CREATE INDEX IF NOT EXISTS idx_orders_shift_id ON orders(shift_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_expenses_shift_id ON expenses(shift_id);

-- Views
CREATE VIEW IF NOT EXISTS v_shift_summary AS
SELECT
  s.id,
  s.type,
  s.opened_at,
  s.closed_at,
  s.opening_balance,
  s.expected_balance,
  s.actual_balance,
  s.difference,
  s.status,
  COUNT(DISTINCT o.id) as total_orders,
  COALESCE(SUM(o.total_amount), 0) as total_sales,
  COALESCE(SUM(e.amount), 0) as total_expenses
FROM shifts s
LEFT JOIN orders o ON o.shift_id = s.id
LEFT JOIN expenses e ON e.shift_id = s.id
GROUP BY s.id;
`;
