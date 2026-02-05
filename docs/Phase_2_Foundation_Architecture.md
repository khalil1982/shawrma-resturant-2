# Phase 2 – Foundation & Architecture

## 🎯 الهدف الرئيسي
بناء الأساس التقني الصلب للتطبيق وفق مبدأ Offline-First، مع ضمان قابلية التوسّع المستقبلية دون الحاجة لإعادة البناء من الصفر.

---

## 📋 النطاق التفصيلي

### 1. إعداد مشروع Electron Desktop Application

#### 1.1 متطلبات البيئة
```json
{
  "node": ">=18.0.0",
  "npm": ">=9.0.0",
  "electron": "^28.0.0"
}
```

#### 1.2 هيكل المشروع الأساسي
```
shawarma-restaurant/
├── src/
│   ├── main/                    # Electron Main Process
│   │   ├── index.ts            # نقطة البداية الرئيسية
│   │   ├── database/           # إدارة قاعدة البيانات
│   │   │   ├── connection.ts
│   │   │   ├── migrations/
│   │   │   └── seeds/
│   │   ├── services/           # خدمات الأعمال
│   │   │   ├── auth.service.ts
│   │   │   ├── shift.service.ts
│   │   │   ├── sales.service.ts
│   │   │   └── report.service.ts
│   │   └── ipc/                # IPC Handlers
│   │       ├── auth.handler.ts
│   │       ├── shift.handler.ts
│   │       └── sales.handler.ts
│   │
│   ├── renderer/               # Electron Renderer Process (UI)
│   │   ├── src/
│   │   │   ├── components/    # مكونات React
│   │   │   │   ├── common/    # مكونات مشتركة
│   │   │   │   ├── cashier/   # مكونات الكاشير
│   │   │   │   └── admin/     # مكونات المدير
│   │   │   ├── pages/         # الصفحات الرئيسية
│   │   │   │   ├── LoginPage.tsx
│   │   │   │   ├── SalesPage.tsx
│   │   │   │   ├── DashboardPage.tsx
│   │   │   │   └── ReportsPage.tsx
│   │   │   ├── hooks/         # Custom React Hooks
│   │   │   ├── contexts/      # React Contexts
│   │   │   ├── utils/         # وظائف مساعدة
│   │   │   ├── types/         # TypeScript Types
│   │   │   └── App.tsx
│   │   ├── public/
│   │   └── index.html
│   │
│   ├── shared/                 # كود مشترك بين Main و Renderer
│   │   ├── types/             # أنواع TypeScript مشتركة
│   │   ├── constants/         # ثوابت
│   │   └── validators/        # التحقق من البيانات
│   │
│   └── preload/               # Preload Scripts
│       └── index.ts           # Context Bridge
│
├── resources/                  # موارد التطبيق
│   ├── icons/
│   └── fonts/
│
├── dist/                      # ملفات البناء
├── docs/                      # التوثيق
├── tests/                     # الاختبارات
│   ├── unit/
│   └── integration/
│
├── package.json
├── tsconfig.json
├── electron-builder.json
└── README.md
```

#### 1.3 التقنيات المستخدمة
**Frontend:**
- React 18+ with TypeScript
- TailwindCSS for styling
- Shadcn/UI for components
- Zustand for state management
- React Router for navigation
- React Hook Form + Zod for forms
- date-fns for date handling

**Backend (Electron Main):**
- TypeScript
- SQLite3 (better-sqlite3)
- Electron IPC for communication

**Dev Tools:**
- Vite for fast development
- ESLint + Prettier for code quality
- Husky for Git hooks
- Jest for testing

---

### 2. قاعدة البيانات SQLite المحلية

#### 2.1 لماذا SQLite؟
- **Offline-First:** لا يحتاج اتصال بالإنترنت
- **Zero Configuration:** لا حاجة لتثبيت سيرفر
- **Fast & Reliable:** سريع وموثوق
- **File-based:** ملف واحد فقط
- **ACID Compliant:** معاملات آمنة

#### 2.2 مخطط قاعدة البيانات (Database Schema)

```sql
-- جدول المستخدمين
CREATE TABLE users (
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
CREATE TABLE shifts (
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
CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    icon TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- جدول الأصناف
CREATE TABLE items (
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
CREATE TABLE orders (
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
CREATE TABLE order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    item_id INTEGER NOT NULL REFERENCES items(id),
    quantity INTEGER NOT NULL CHECK(quantity > 0),
    unit_price REAL NOT NULL CHECK(unit_price >= 0),
    subtotal REAL NOT NULL CHECK(subtotal >= 0),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- جدول المصاريف
CREATE TABLE expenses (
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
CREATE TABLE purchases (
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
CREATE TABLE audit_log (
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
CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- فهارس لتحسين الأداء
CREATE INDEX idx_shifts_status ON shifts(status);
CREATE INDEX idx_shifts_opened_at ON shifts(opened_at);
CREATE INDEX idx_orders_shift_id ON orders(shift_id);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);
```

#### 2.3 Migrations System
**استخدام مكتبة migrate لإدارة التحديثات:**
```typescript
// src/main/database/migrations/001_initial_schema.ts
export const up = (db: Database) => {
  // تنفيذ SQL أعلاه
};

export const down = (db: Database) => {
  // التراجع عن التغييرات
};
```

#### 2.4 Seed Data (بيانات أولية)
```typescript
// src/main/database/seeds/initial-data.ts
const seedData = {
  users: [
    {
      username: 'admin',
      password_hash: /* bcrypt hash */,
      role: 'admin',
      full_name: 'المدير'
    }
  ],
  categories: [
    { name: 'Shawarma', name_ar: 'شاورما', icon: 'utensils', sort_order: 1 },
    { name: 'Drinks', name_ar: 'مشروبات', icon: 'coffee', sort_order: 2 },
    { name: 'Extras', name_ar: 'إضافات', icon: 'plus', sort_order: 3 }
  ],
  items: [
    { category_id: 1, name: 'Chicken Shawarma', name_ar: 'شاورما دجاج', price: 5.00 },
    { category_id: 1, name: 'Meat Shawarma', name_ar: 'شاورما لحم', price: 6.00 },
    { category_id: 2, name: 'Cola', name_ar: 'كولا', price: 1.50 },
    { category_id: 3, name: 'French Fries', name_ar: 'بطاطس', price: 2.00 }
  ]
};
```

---

### 3. نظام الصلاحيات والأمان

#### 3.1 الأدوار (Roles)
```typescript
enum UserRole {
  ADMIN = 'admin',
  CASHIER = 'cashier'
}

interface Permission {
  resource: string;
  actions: ('create' | 'read' | 'update' | 'delete')[];
}

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    { resource: 'shifts', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'orders', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'reports', actions: ['read'] },
    { resource: 'expenses', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'settings', actions: ['read', 'update'] },
    { resource: 'users', actions: ['create', 'read', 'update', 'delete'] }
  ],
  [UserRole.CASHIER]: [
    { resource: 'shifts', actions: ['read'] },
    { resource: 'orders', actions: ['create', 'read'] },
    { resource: 'reports', actions: [] },
    { resource: 'expenses', actions: [] },
    { resource: 'settings', actions: [] },
    { resource: 'users', actions: [] }
  ]
};
```

#### 3.2 المصادقة (Authentication)
```typescript
// src/main/services/auth.service.ts
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

class AuthService {
  async login(username: string, password: string): Promise<{
    token: string;
    user: User;
  }> {
    // 1. البحث عن المستخدم
    const user = await db.getUserByUsername(username);
    if (!user || !user.is_active) {
      throw new Error('Invalid credentials');
    }

    // 2. التحقق من كلمة المرور
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    // 3. إنشاء JWT Token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '24h' }
    );

    // 4. تسجيل في Audit Log
    await auditLog.log({
      user_id: user.id,
      action: 'LOGIN',
      table_name: 'users',
      record_id: user.id
    });

    return { token, user };
  }

  async verifyToken(token: string): Promise<User> {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    return await db.getUserById(payload.id);
  }

  async logout(userId: number): Promise<void> {
    await auditLog.log({
      user_id: userId,
      action: 'LOGOUT',
      table_name: 'users',
      record_id: userId
    });
  }
}
```

#### 3.3 تشفير البيانات الحساسة
```typescript
// تشفير كلمات المرور
const saltRounds = 10;
const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);

// تشفير قاعدة البيانات (SQLCipher)
import SQLite from 'better-sqlite3';
const db = new SQLite('database.db', {
  // يمكن تفعيل التشفير لاحقاً
  // cipher: 'aes256',
  // key: process.env.DB_KEY
});
```

---

### 4. معمارية التطبيق (Application Architecture)

#### 4.1 فصل الطبقات (Separation of Concerns)
```
┌─────────────────────────────────────────┐
│         Presentation Layer              │
│    (React Components + UI Logic)        │
└────────────┬────────────────────────────┘
             │
             │ IPC Communication
             │
┌────────────▼────────────────────────────┐
│      Application Layer (Main)           │
│    (Business Logic + Services)          │
└────────────┬────────────────────────────┘
             │
             │ SQL Queries
             │
┌────────────▼────────────────────────────┐
│         Data Layer (SQLite)             │
│    (Database + Persistence)             │
└─────────────────────────────────────────┘
```

#### 4.2 IPC Communication Pattern
```typescript
// src/preload/index.ts - Context Bridge
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  // Auth
  login: (username: string, password: string) =>
    ipcRenderer.invoke('auth:login', { username, password }),
  logout: () =>
    ipcRenderer.invoke('auth:logout'),

  // Shifts
  openShift: (data: OpenShiftData) =>
    ipcRenderer.invoke('shift:open', data),
  closeShift: (data: CloseShiftData) =>
    ipcRenderer.invoke('shift:close', data),
  getCurrentShift: () =>
    ipcRenderer.invoke('shift:getCurrent'),

  // Orders
  createOrder: (data: CreateOrderData) =>
    ipcRenderer.invoke('order:create', data),
  getOrders: (filters: OrderFilters) =>
    ipcRenderer.invoke('order:list', filters),

  // Reports
  generateReport: (params: ReportParams) =>
    ipcRenderer.invoke('report:generate', params)
});
```

```typescript
// src/main/ipc/shift.handler.ts
import { ipcMain } from 'electron';
import { ShiftService } from '../services/shift.service';

const shiftService = new ShiftService();

export function registerShiftHandlers() {
  ipcMain.handle('shift:open', async (event, data) => {
    try {
      const shift = await shiftService.openShift(data);
      return { success: true, data: shift };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('shift:close', async (event, data) => {
    try {
      const shift = await shiftService.closeShift(data);
      return { success: true, data: shift };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('shift:getCurrent', async () => {
    try {
      const shift = await shiftService.getCurrentShift();
      return { success: true, data: shift };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}
```

#### 4.3 Service Layer Pattern
```typescript
// src/main/services/shift.service.ts
import { Database } from '../database/connection';
import { AuditLogService } from './audit-log.service';

export class ShiftService {
  constructor(
    private db: Database,
    private auditLog: AuditLogService
  ) {}

  async openShift(data: OpenShiftData): Promise<Shift> {
    // التحقق من عدم وجود وردية مفتوحة
    const currentShift = await this.getCurrentShift();
    if (currentShift) {
      throw new Error('هناك وردية مفتوحة بالفعل');
    }

    // فتح الوردية
    const shift = await this.db.shifts.create({
      type: data.type,
      opened_by: data.userId,
      opened_at: new Date(),
      opening_balance: data.openingBalance || 0,
      status: 'open'
    });

    // تسجيل في Audit Log
    await this.auditLog.log({
      user_id: data.userId,
      action: 'OPEN_SHIFT',
      table_name: 'shifts',
      record_id: shift.id,
      new_values: JSON.stringify(shift)
    });

    return shift;
  }

  async closeShift(data: CloseShiftData): Promise<Shift> {
    const shift = await this.getCurrentShift();
    if (!shift) {
      throw new Error('لا توجد وردية مفتوحة');
    }

    // حساب الرصيد المتوقع
    const expectedBalance = await this.calculateExpectedBalance(shift.id);

    // حساب الفرق
    const difference = data.actualBalance - expectedBalance;

    // إذا كان هناك فرق، يجب إدخال السبب
    if (Math.abs(difference) > 0.01 && !data.differenceReason) {
      throw new Error('يجب إدخال سبب الفرق');
    }

    // إغلاق الوردية
    const updatedShift = await this.db.shifts.update(shift.id, {
      closed_by: data.userId,
      closed_at: new Date(),
      expected_balance: expectedBalance,
      actual_balance: data.actualBalance,
      difference: difference,
      difference_reason: data.differenceReason,
      status: 'closed'
    });

    // تسجيل في Audit Log
    await this.auditLog.log({
      user_id: data.userId,
      action: 'CLOSE_SHIFT',
      table_name: 'shifts',
      record_id: shift.id,
      old_values: JSON.stringify(shift),
      new_values: JSON.stringify(updatedShift)
    });

    return updatedShift;
  }

  async getCurrentShift(): Promise<Shift | null> {
    return await this.db.shifts.findOne({ status: 'open' });
  }

  private async calculateExpectedBalance(shiftId: number): Promise<number> {
    const shift = await this.db.shifts.findById(shiftId);
    const orders = await this.db.orders.findMany({ shift_id: shiftId });
    const expenses = await this.db.expenses.findMany({ shift_id: shiftId });

    const totalSales = orders.reduce((sum, order) => sum + order.total_amount, 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    return shift.opening_balance + totalSales - totalExpenses;
  }
}
```

---

### 5. دعم اللغة العربية والاتجاه RTL

#### 5.1 إعداد RTL في React
```typescript
// src/renderer/src/App.tsx
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    // تفعيل RTL
    document.documentElement.dir = 'rtl';
    document.documentElement.lang = 'ar';
  }, []);

  return (
    // ...
  );
}
```

#### 5.2 TailwindCSS RTL Support
```javascript
// tailwind.config.js
module.exports = {
  plugins: [
    require('tailwindcss-rtl')
  ],
  theme: {
    extend: {
      fontFamily: {
        arabic: ['Tajawal', 'Cairo', 'sans-serif']
      }
    }
  }
};
```

#### 5.3 الخطوط العربية
```css
/* src/renderer/src/index.css */
@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap');

* {
  font-family: 'Tajawal', sans-serif;
}

body {
  direction: rtl;
  text-align: right;
}
```

#### 5.4 i18n (اختياري للمستقبل)
```typescript
// src/renderer/src/i18n/ar.ts
export const translations = {
  common: {
    save: 'حفظ',
    cancel: 'إلغاء',
    delete: 'حذف',
    edit: 'تعديل',
    back: 'رجوع',
    confirm: 'تأكيد'
  },
  auth: {
    login: 'تسجيل الدخول',
    logout: 'تسجيل الخروج',
    username: 'اسم المستخدم',
    password: 'كلمة المرور'
  },
  // ...
};
```

---

### 6. إدارة الحالة (State Management)

#### 6.1 Zustand Store
```typescript
// src/renderer/src/stores/auth.store.ts
import create from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (username, password) => {
        const { token, user } = await window.api.login(username, password);
        set({ user, token, isAuthenticated: true });
      },

      logout: async () => {
        await window.api.logout();
        set({ user: null, token: null, isAuthenticated: false });
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token, user: state.user })
    }
  )
);
```

```typescript
// src/renderer/src/stores/shift.store.ts
import create from 'zustand';

interface ShiftState {
  currentShift: Shift | null;
  loadCurrentShift: () => Promise<void>;
  openShift: (data: OpenShiftData) => Promise<void>;
  closeShift: (data: CloseShiftData) => Promise<void>;
}

export const useShiftStore = create<ShiftState>((set) => ({
  currentShift: null,

  loadCurrentShift: async () => {
    const { data } = await window.api.getCurrentShift();
    set({ currentShift: data });
  },

  openShift: async (data) => {
    const { data: shift } = await window.api.openShift(data);
    set({ currentShift: shift });
  },

  closeShift: async (data) => {
    const { data: shift } = await window.api.closeShift(data);
    set({ currentShift: null });
  }
}));
```

---

### 7. معالجة الأخطاء (Error Handling)

#### 7.1 Custom Error Classes
```typescript
// src/shared/errors/app-error.ts
export class AppError extends Error {
  constructor(
    public message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'غير مصرح') {
    super(message, 'AUTH_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} غير موجود`, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}
```

#### 7.2 Error Boundary
```typescript
// src/renderer/src/components/ErrorBoundary.tsx
import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-screen">
          <h1>عذراً، حدث خطأ ما</h1>
          <p>{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}>
            إعادة تحميل التطبيق
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

### 8. النسخ الاحتياطي والاستعادة

#### 8.1 Auto Backup
```typescript
// src/main/services/backup.service.ts
import fs from 'fs';
import path from 'path';
import { app } from 'electron';

export class BackupService {
  private backupDir: string;

  constructor() {
    this.backupDir = path.join(app.getPath('userData'), 'backups');
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  async createBackup(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const backupPath = path.join(this.backupDir, `backup_${timestamp}.db`);

    // نسخ قاعدة البيانات
    const dbPath = path.join(app.getPath('userData'), 'database.db');
    fs.copyFileSync(dbPath, backupPath);

    // حذف النسخ القديمة (الاحتفاظ بآخر 30 نسخة)
    await this.cleanOldBackups(30);

    return backupPath;
  }

  async restoreBackup(backupPath: string): Promise<void> {
    const dbPath = path.join(app.getPath('userData'), 'database.db');
    fs.copyFileSync(backupPath, dbPath);
  }

  private async cleanOldBackups(keep: number): Promise<void> {
    const files = fs.readdirSync(this.backupDir)
      .filter(f => f.endsWith('.db'))
      .map(f => ({
        name: f,
        path: path.join(this.backupDir, f),
        time: fs.statSync(path.join(this.backupDir, f)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time);

    // حذف الملفات الزائدة
    files.slice(keep).forEach(f => fs.unlinkSync(f.path));
  }

  async scheduleAutoBackup(): Promise<void> {
    // نسخة احتياطية كل 6 ساعات
    setInterval(async () => {
      await this.createBackup();
    }, 6 * 60 * 60 * 1000);
  }
}
```

#### 8.2 التعافي من الأخطاء
```typescript
// src/main/services/recovery.service.ts
export class RecoveryService {
  async recoverFromCrash(): Promise<void> {
    // استعادة آخر حالة محفوظة
    const lastState = await this.getLastSavedState();
    if (lastState) {
      await this.restoreState(lastState);
    }
  }

  private async getLastSavedState(): Promise<AppState | null> {
    // قراءة آخر حالة من localStorage أو ملف
    return null;
  }

  private async restoreState(state: AppState): Promise<void> {
    // استعادة الحالة
  }
}
```

---

### 9. الأداء والتحسين

#### 9.1 Database Optimization
```typescript
// استخدام prepared statements
const stmt = db.prepare('SELECT * FROM orders WHERE shift_id = ?');
const orders = stmt.all(shiftId);

// استخدام transactions للعمليات المتعددة
const insertMany = db.transaction((items) => {
  const stmt = db.prepare('INSERT INTO items (name, price) VALUES (?, ?)');
  for (const item of items) {
    stmt.run(item.name, item.price);
  }
});

insertMany(items);
```

#### 9.2 React Performance
```typescript
// استخدام React.memo
export const MenuItem = React.memo(({ item, onClick }) => {
  return (
    <button onClick={() => onClick(item)}>
      {item.name_ar} - {item.price}
    </button>
  );
});

// استخدام useMemo و useCallback
const filteredItems = useMemo(() => {
  return items.filter(item => item.is_active);
}, [items]);

const handleAddItem = useCallback((item) => {
  // ...
}, []);
```

---

### 10. الاختبارات (Testing)

#### 10.1 Unit Tests
```typescript
// tests/unit/services/shift.service.test.ts
import { ShiftService } from '@/main/services/shift.service';

describe('ShiftService', () => {
  let shiftService: ShiftService;

  beforeEach(() => {
    shiftService = new ShiftService(mockDb, mockAuditLog);
  });

  describe('openShift', () => {
    it('should open a new shift', async () => {
      const data = {
        type: 'morning',
        userId: 1,
        openingBalance: 100
      };

      const shift = await shiftService.openShift(data);

      expect(shift).toBeDefined();
      expect(shift.type).toBe('morning');
      expect(shift.status).toBe('open');
    });

    it('should throw error if shift already open', async () => {
      // Mock existing open shift
      mockDb.shifts.findOne.mockResolvedValue({ id: 1, status: 'open' });

      await expect(shiftService.openShift(data))
        .rejects.toThrow('هناك وردية مفتوحة بالفعل');
    });
  });
});
```

---

## ✅ المخرجات النهائية

### 1. التطبيق الأساسي
- [✓] تطبيق Electron يعمل محلياً
- [✓] واجهة تسجيل الدخول وظيفية
- [✓] نظام صلاحيات كامل

### 2. قاعدة البيانات
- [✓] SQLite مُعد بالكامل
- [✓] جميع الجداول منشأة
- [✓] بيانات أولية محملة

### 3. البنية التقنية
- [✓] هيكل مشروع منظم
- [✓] فصل واضح للطبقات
- [✓] IPC communication جاهز
- [✓] Service Layer معد

### 4. الأمان
- [✓] نظام المصادقة يعمل
- [✓] تشفير كلمات المرور
- [✓] Audit Log نشط

### 5. دعم العربية
- [✓] RTL مفعل
- [✓] خطوط عربية
- [✓] واجهة بالعربية

---

## 📊 معايير القبول (Acceptance Criteria)

- [ ] التطبيق يعمل على Windows/Mac/Linux
- [ ] تسجيل الدخول يعمل بنجاح
- [ ] قاعدة البيانات تُنشأ تلقائياً عند أول تشغيل
- [ ] نظام الصلاحيات يعمل بشكل صحيح
- [ ] Offline-First مُطبق بالكامل
- [ ] لا أخطاء في Console
- [ ] الواجهة باللغة العربية واتجاه RTL

---

## 🔗 الانتقال للمرحلة التالية
بعد إكمال هذه المرحلة، ننتقل إلى:
👉 **Phase 3 - Core Operations (Shifts & Sales)**
