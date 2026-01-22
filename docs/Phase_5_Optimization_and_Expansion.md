# Phase 5 – Optimization & Future Expansion

## 🎯 الهدف الرئيسي
تحسين النظام وتهيئته للتوسع المستقبلي (Mobile / Cloud) دون الحاجة لإعادة بناء الأساس، مع ضمان الاستقرار والأداء العالي.

---

## 📋 النطاق التفصيلي

### 1. تحسين الأداء (Performance Optimization)

#### 1.1 تحسين قاعدة البيانات

**إضافة Indexes استراتيجية:**
```sql
-- فهارس للاستعلامات الشائعة
CREATE INDEX IF NOT EXISTS idx_orders_shift_cashier
ON orders(shift_id, cashier_id);

CREATE INDEX IF NOT EXISTS idx_orders_created_at_desc
ON orders(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_order_items_item_id
ON order_items(item_id);

CREATE INDEX IF NOT EXISTS idx_expenses_shift_category
ON expenses(shift_id, category);

CREATE INDEX IF NOT EXISTS idx_audit_log_composite
ON audit_log(user_id, created_at DESC, action);

-- تحليل وتحسين الاستعلامات
ANALYZE;
```

**استخدام Views للاستعلامات المعقدة:**
```sql
-- View لملخص الورديات
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
  COUNT(DISTINCT o.id) as total_orders,
  COALESCE(SUM(o.total_amount), 0) as total_sales,
  COALESCE(SUM(e.amount), 0) as total_expenses
FROM shifts s
LEFT JOIN orders o ON o.shift_id = s.id
LEFT JOIN expenses e ON e.shift_id = s.id
GROUP BY s.id;

-- View لأكثر المنتجات مبيعاً
CREATE VIEW IF NOT EXISTS v_top_selling_items AS
SELECT
  i.id,
  i.name_ar,
  COUNT(oi.id) as times_ordered,
  SUM(oi.quantity) as total_quantity,
  SUM(oi.subtotal) as total_revenue
FROM items i
JOIN order_items oi ON oi.item_id = i.id
GROUP BY i.id
ORDER BY total_quantity DESC;
```

**Vacuum و Optimize:**
```typescript
// src/main/services/database-maintenance.service.ts
export class DatabaseMaintenanceService {
  async optimize(): Promise<void> {
    // VACUUM لتقليل حجم الملف
    await this.db.exec('VACUUM');

    // ANALYZE لتحديث الإحصائيات
    await this.db.exec('ANALYZE');

    console.log('Database optimized successfully');
  }

  async scheduleOptimization(): Promise<void> {
    // تنفيذ Optimization كل أسبوع
    setInterval(async () => {
      await this.optimize();
    }, 7 * 24 * 60 * 60 * 1000); // أسبوع
  }
}
```

#### 1.2 تحسين واجهة المستخدم

**React Performance:**
```typescript
// استخدام React.memo للمكونات الثقيلة
export const MenuItem = React.memo(({ item, onSelect }) => {
  return (
    <button onClick={() => onSelect(item)} className="menu-item">
      <span>{item.name_ar}</span>
      <span className="price">{formatCurrency(item.price)}</span>
    </button>
  );
}, (prevProps, nextProps) => {
  // تحديث فقط إذا تغير الصنف
  return prevProps.item.id === nextProps.item.id &&
         prevProps.item.price === nextProps.item.price;
});

// استخدام useMemo للحسابات الثقيلة
function CartSummary({ items }) {
  const total = useMemo(() => {
    return items.reduce((sum, item) => sum + item.subtotal, 0);
  }, [items]);

  const itemCount = useMemo(() => {
    return items.reduce((count, item) => count + item.quantity, 0);
  }, [items]);

  return (
    <div>
      <p>العدد: {itemCount}</p>
      <p>الإجمالي: {formatCurrency(total)}</p>
    </div>
  );
}

// استخدام useCallback للدوال
function SalesPage() {
  const [cart, setCart] = useState([]);

  const addToCart = useCallback((item) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i =>
          i.id === item.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }, []);

  return <ItemList items={items} onAddToCart={addToCart} />;
}
```

**Virtualization للقوائم الطويلة:**
```typescript
// استخدام react-window للقوائم الطويلة
import { FixedSizeList } from 'react-window';

function OrderHistoryList({ orders }) {
  const Row = ({ index, style }) => (
    <div style={style}>
      <OrderRow order={orders[index]} />
    </div>
  );

  return (
    <FixedSizeList
      height={600}
      itemCount={orders.length}
      itemSize={80}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
}
```

**Lazy Loading للصفحات:**
```typescript
// src/renderer/src/App.tsx
import { lazy, Suspense } from 'react';

const SalesPage = lazy(() => import('./pages/SalesPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/sales" element={<SalesPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </Suspense>
  );
}
```

#### 1.3 تحسين IPC Communication

**Batching الطلبات:**
```typescript
// src/main/ipc/batch.handler.ts
class BatchRequestHandler {
  private queue: Map<string, Promise<any>> = new Map();

  async batchRequest(key: string, fn: () => Promise<any>): Promise<any> {
    // إذا كان هناك طلب مماثل قيد التنفيذ، انتظره
    if (this.queue.has(key)) {
      return this.queue.get(key);
    }

    // تنفيذ الطلب
    const promise = fn().finally(() => {
      this.queue.delete(key);
    });

    this.queue.set(key, promise);
    return promise;
  }
}

// استخدام
ipcMain.handle('items:list', async () => {
  return batchHandler.batchRequest('items:list', async () => {
    return await db.items.findMany({ is_active: true });
  });
});
```

**Caching للبيانات الثابتة:**
```typescript
// src/main/services/cache.service.ts
export class CacheService {
  private cache: Map<string, { data: any; expiry: number }> = new Map();

  set(key: string, data: any, ttl: number = 60000): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);

    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear(): void {
    this.cache.clear();
  }
}

// استخدام
async function getItems(): Promise<Item[]> {
  const cached = cache.get('items');
  if (cached) return cached;

  const items = await db.items.findMany({ is_active: true });
  cache.set('items', items, 5 * 60 * 1000); // 5 دقائق

  return items;
}
```

---

### 2. فصل منطق الأعمال (Business Logic Separation)

#### 2.1 Domain Layer

```typescript
// src/main/domain/shift.domain.ts
export class ShiftDomain {
  validateOpenShift(data: OpenShiftData): void {
    if (!data.type || !['morning', 'evening'].includes(data.type)) {
      throw new ValidationError('نوع الوردية غير صحيح');
    }

    if (data.openingBalance < 0) {
      throw new ValidationError('رصيد البداية لا يمكن أن يكون سالباً');
    }
  }

  validateCloseShift(shift: Shift, actualBalance: number): void {
    if (shift.status !== 'open') {
      throw new ValidationError('الوردية ليست مفتوحة');
    }

    if (actualBalance < 0) {
      throw new ValidationError('الرصيد الفعلي لا يمكن أن يكون سالباً');
    }
  }

  calculateExpectedBalance(
    openingBalance: number,
    totalSales: number,
    totalExpenses: number
  ): number {
    return openingBalance + totalSales - totalExpenses;
  }

  calculateDifference(expectedBalance: number, actualBalance: number): number {
    return actualBalance - expectedBalance;
  }

  requireDifferenceReason(difference: number): boolean {
    return Math.abs(difference) > 0.01;
  }
}

// src/main/domain/order.domain.ts
export class OrderDomain {
  validateOrder(items: OrderItemData[]): void {
    if (!items || items.length === 0) {
      throw new ValidationError('الطلب فارغ');
    }

    for (const item of items) {
      if (item.quantity <= 0) {
        throw new ValidationError('الكمية يجب أن تكون أكبر من صفر');
      }
    }
  }

  calculateTotal(items: OrderItemData[]): number {
    return items.reduce((sum, item) => sum + item.subtotal, 0);
  }

  applyDiscount(total: number, discount: number): number {
    if (discount < 0 || discount > 100) {
      throw new ValidationError('نسبة الخصم يجب أن تكون بين 0 و 100');
    }

    return total - (total * discount / 100);
  }
}
```

#### 2.2 Repository Pattern

```typescript
// src/main/repositories/base.repository.ts
export abstract class BaseRepository<T> {
  constructor(protected db: Database, protected tableName: string) {}

  async findById(id: number): Promise<T | null> {
    return await this.db.query(
      `SELECT * FROM ${this.tableName} WHERE id = ?`,
      [id]
    ).then(rows => rows[0] || null);
  }

  async findMany(where: any): Promise<T[]> {
    const conditions = Object.keys(where).map(key => `${key} = ?`);
    const values = Object.values(where);

    return await this.db.query(
      `SELECT * FROM ${this.tableName} WHERE ${conditions.join(' AND ')}`,
      values
    );
  }

  async create(data: Partial<T>): Promise<T> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map(() => '?').join(', ');

    const result = await this.db.run(
      `INSERT INTO ${this.tableName} (${keys.join(', ')}) VALUES (${placeholders})`,
      values
    );

    return await this.findById(result.lastID);
  }

  async update(id: number, data: Partial<T>): Promise<T> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const sets = keys.map(key => `${key} = ?`).join(', ');

    await this.db.run(
      `UPDATE ${this.tableName} SET ${sets} WHERE id = ?`,
      [...values, id]
    );

    return await this.findById(id);
  }

  async delete(id: number): Promise<void> {
    await this.db.run(
      `DELETE FROM ${this.tableName} WHERE id = ?`,
      [id]
    );
  }
}

// src/main/repositories/shift.repository.ts
export class ShiftRepository extends BaseRepository<Shift> {
  constructor(db: Database) {
    super(db, 'shifts');
  }

  async findActiveShift(): Promise<Shift | null> {
    return await this.db.query(
      'SELECT * FROM shifts WHERE status = ? LIMIT 1',
      ['open']
    ).then(rows => rows[0] || null);
  }

  async findByDateRange(from: Date, to: Date): Promise<Shift[]> {
    return await this.db.query(
      'SELECT * FROM shifts WHERE opened_at >= ? AND opened_at <= ?',
      [from, to]
    );
  }
}
```

---

### 3. Local API Layer

#### 3.1 RESTful API Structure

```typescript
// src/main/api/routes.ts
import express from 'express';

const app = express();
app.use(express.json());

// Middleware للتحقق من الصلاحيات
function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const user = verifyToken(token);
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await authService.login(username, password);
    res.json(result);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

app.get('/api/shifts/current', authenticate, async (req, res) => {
  try {
    const shift = await shiftService.getCurrentShift();
    res.json(shift);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/shifts/open', authenticate, async (req, res) => {
  try {
    const shift = await shiftService.openShift(req.body, req.user.id);
    res.json(shift);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/orders', authenticate, async (req, res) => {
  try {
    const order = await orderService.createOrder(req.body, req.user.id);
    res.json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Start server on localhost only
const PORT = 3456;
app.listen(PORT, '127.0.0.1', () => {
  console.log(`Local API running on http://127.0.0.1:${PORT}`);
});
```

#### 3.2 API Documentation

```typescript
// src/main/api/swagger.ts
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Shawarma Restaurant API',
      version: '1.0.0',
      description: 'Local API for Shawarma Restaurant Management System'
    },
    servers: [
      {
        url: 'http://127.0.0.1:3456',
        description: 'Local server'
      }
    ]
  },
  apis: ['./src/main/api/routes.ts']
};

const specs = swaggerJsdoc(options);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
```

---

### 4. إضافة Features جديدة

#### 4.1 Dark Mode

```typescript
// src/renderer/src/contexts/ThemeContext.tsx
import { createContext, useContext, useState, useEffect } from 'react';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // تحميل الإعداد المحفوظ
    const saved = localStorage.getItem('theme');
    if (saved) setTheme(saved as any);
  }, []);

  useEffect(() => {
    // تطبيق الثيم
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
```

```css
/* src/renderer/src/styles/themes.css */
:root[data-theme='light'] {
  --bg-primary: #ffffff;
  --bg-secondary: #f5f5f5;
  --text-primary: #333333;
  --text-secondary: #666666;
  --accent: #FF8C00;
  --border: #e0e0e0;
}

:root[data-theme='dark'] {
  --bg-primary: #1a1a1a;
  --bg-secondary: #2d2d2d;
  --text-primary: #f5f5f5;
  --text-secondary: #b0b0b0;
  --accent: #FFA500;
  --border: #404040;
}

body {
  background-color: var(--bg-primary);
  color: var(--text-primary);
}
```

#### 4.2 إحصائيات متقدمة

```typescript
// src/main/services/analytics.service.ts
export class AnalyticsService {
  async getTopSellingItems(period: DateRange): Promise<TopItem[]> {
    const result = await this.db.query(`
      SELECT
        i.id,
        i.name_ar,
        COUNT(oi.id) as times_ordered,
        SUM(oi.quantity) as total_quantity,
        SUM(oi.subtotal) as total_revenue,
        AVG(oi.unit_price) as avg_price
      FROM items i
      JOIN order_items oi ON oi.item_id = i.id
      JOIN orders o ON o.id = oi.order_id
      WHERE o.created_at >= ? AND o.created_at <= ?
      GROUP BY i.id
      ORDER BY total_quantity DESC
      LIMIT 10
    `, [period.from, period.to]);

    return result;
  }

  async getSalesChart(period: DateRange): Promise<ChartData> {
    const result = await this.db.query(`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as orders,
        SUM(total_amount) as sales
      FROM orders
      WHERE created_at >= ? AND created_at <= ?
      GROUP BY DATE(created_at)
      ORDER BY date
    `, [period.from, period.to]);

    return {
      labels: result.map(r => r.date),
      datasets: [
        {
          label: 'المبيعات',
          data: result.map(r => r.sales)
        },
        {
          label: 'عدد الطلبات',
          data: result.map(r => r.orders)
        }
      ]
    };
  }

  async getPeakHours(period: DateRange): Promise<PeakHour[]> {
    const result = await this.db.query(`
      SELECT
        strftime('%H', created_at) as hour,
        COUNT(*) as orders,
        SUM(total_amount) as sales
      FROM orders
      WHERE created_at >= ? AND created_at <= ?
      GROUP BY hour
      ORDER BY orders DESC
    `, [period.from, period.to]);

    return result;
  }
}
```

#### 4.3 إشعارات الديسكتوب

```typescript
// src/main/services/notification.service.ts
import { Notification } from 'electron';

export class NotificationService {
  show(options: {
    title: string;
    body: string;
    urgency?: 'normal' | 'critical' | 'low';
  }): void {
    if (!Notification.isSupported()) {
      console.log('Notifications not supported');
      return;
    }

    const notification = new Notification({
      title: options.title,
      body: options.body,
      urgency: options.urgency || 'normal',
      timeoutType: 'default'
    });

    notification.show();
  }

  // أمثلة على الاستخدام
  notifyShiftEnding(shift: Shift): void {
    const duration = this.getShiftDuration(shift);
    if (duration > 7.5) { // أكثر من 7.5 ساعة
      this.show({
        title: 'تنبيه',
        body: 'الوردية مفتوحة منذ أكثر من 7 ساعات',
        urgency: 'normal'
      });
    }
  }

  notifyLowStock(item: Item): void {
    this.show({
      title: 'تنبيه مخزون',
      body: `المخزون منخفض: ${item.name_ar}`,
      urgency: 'critical'
    });
  }
}
```

---

### 5. التوثيق التقني (Technical Documentation)

#### 5.1 API Documentation

```markdown
# API Documentation

## Authentication

### POST /api/auth/login
تسجيل الدخول

**Request:**
```json
{
  "username": "admin",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin",
    "full_name": "المدير"
  }
}
```

## Shifts

### GET /api/shifts/current
الحصول على الوردية الحالية

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "id": 1,
  "type": "morning",
  "opened_at": "2024-01-01T06:00:00Z",
  "opening_balance": 100.00,
  "status": "open"
}
```

### POST /api/shifts/open
فتح وردية جديدة

**Headers:**
```
Authorization: Bearer {token}
```

**Request:**
```json
{
  "type": "morning",
  "openingBalance": 100.00
}
```
```

#### 5.2 Database Schema Documentation

```markdown
# Database Schema

## Tables

### users
يحتوي على معلومات المستخدمين

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY | معرف المستخدم |
| username | TEXT | UNIQUE, NOT NULL | اسم المستخدم |
| password_hash | TEXT | NOT NULL | كلمة المرور المشفرة |
| role | TEXT | NOT NULL | الدور (admin/cashier) |
| full_name | TEXT | NOT NULL | الاسم الكامل |
| is_active | BOOLEAN | DEFAULT 1 | نشط/غير نشط |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | تاريخ الإنشاء |

### shifts
يحتوي على معلومات الورديات

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY | معرف الوردية |
| type | TEXT | NOT NULL | النوع (morning/evening) |
| opened_by | INTEGER | REFERENCES users(id) | من فتح الوردية |
| opened_at | DATETIME | NOT NULL | وقت الفتح |
| opening_balance | REAL | DEFAULT 0 | رصيد البداية |
| closed_by | INTEGER | REFERENCES users(id) | من أغلق الوردية |
| closed_at | DATETIME | NULL | وقت الإغلاق |
| status | TEXT | DEFAULT 'open' | الحالة (open/closed) |
```

---

### 6. Roadmap للتطبيق الموبايل

#### 6.1 المتطلبات التقنية

```typescript
// Mobile App Structure
mobile-app/
├── src/
│   ├── screens/
│   │   ├── SalesScreen.tsx
│   │   ├── ReportsScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── services/
│   │   ├── api.service.ts          // يتصل بـ Local API
│   │   ├── offline.service.ts      // Offline-First
│   │   └── sync.service.ts         // المزامنة
│   ├── storage/
│   │   └── local-db.ts             // SQLite المحلي
│   └── App.tsx
├── package.json
└── app.json
```

#### 6.2 استراتيجية Offline-First للموبايل

```typescript
// src/services/sync.service.ts
export class SyncService {
  private apiUrl = 'http://192.168.1.10:3456'; // عنوان الكمبيوتر المحلي

  async sync(): Promise<void> {
    try {
      // 1. جلب البيانات المحدثة من السيرفر
      const serverData = await this.fetchFromServer();

      // 2. دمج مع البيانات المحلية
      await this.mergeWithLocal(serverData);

      // 3. رفع التغييرات المحلية للسيرفر
      await this.pushLocalChanges();

      console.log('Sync completed successfully');
    } catch (error) {
      console.error('Sync failed:', error);
      // العمل في وضع Offline
    }
  }

  private async fetchFromServer(): Promise<any> {
    const response = await fetch(`${this.apiUrl}/api/sync/data`, {
      headers: {
        'Authorization': `Bearer ${this.getToken()}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch from server');
    }

    return await response.json();
  }

  private async mergeWithLocal(serverData: any): Promise<void> {
    // دمج البيانات باستخدام Last-Write-Wins أو استراتيجية أخرى
    // ...
  }

  private async pushLocalChanges(): Promise<void> {
    const pendingChanges = await this.getPendingChanges();

    if (pendingChanges.length === 0) return;

    await fetch(`${this.apiUrl}/api/sync/push`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.getToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ changes: pendingChanges })
    });

    await this.markChangesAsSynced();
  }
}
```

#### 6.3 ميزات التطبيق الموبايل

**Phase 1 - Mobile MVP:**
- تسجيل الدخول
- عرض الوردية الحالية
- تسجيل الطلبات (نفس وظيفة الكاشير)
- طباعة عبر Bluetooth

**Phase 2 - Mobile Advanced:**
- مراجعة التقارير
- إدارة الورديات (للمدير)
- إشعارات Push
- مزامنة تلقائية

**Phase 3 - Mobile Pro:**
- إدارة متعددة الأجهزة
- مزامنة في الوقت الفعلي
- دعم Tablet
- إدارة المخزون

---

### 7. Cloud Integration (اختياري)

#### 7.1 استراتيجية Cloud Sync

```typescript
// src/main/services/cloud-sync.service.ts
export class CloudSyncService {
  private cloudEndpoint = 'https://api.shawarma-cloud.com';

  async syncToCloud(): Promise<void> {
    if (!this.isCloudEnabled()) {
      return; // Cloud غير مفعل
    }

    try {
      // 1. تشفير البيانات قبل الرفع
      const encryptedData = await this.encryptData();

      // 2. رفع للCloud
      await this.uploadToCloud(encryptedData);

      // 3. تحديث آخر وقت مزامنة
      await this.updateLastSyncTime();

      console.log('Cloud sync completed');
    } catch (error) {
      console.error('Cloud sync failed:', error);
      // الاستمرار في العمل Offline
    }
  }

  private async encryptData(): Promise<string> {
    const data = await this.getDatabaseDump();
    // تشفير البيانات باستخدام AES-256
    return encrypt(data, this.getEncryptionKey());
  }

  private isCloudEnabled(): boolean {
    return this.settings.get('cloud_enabled') === true;
  }
}
```

---

### 8. الاختبارات الشاملة (Comprehensive Testing)

#### 8.1 Unit Tests

```typescript
// tests/unit/services/shift.service.test.ts
describe('ShiftService', () => {
  let shiftService: ShiftService;
  let mockDb: jest.Mocked<Database>;

  beforeEach(() => {
    mockDb = createMockDatabase();
    shiftService = new ShiftService(mockDb);
  });

  describe('openShift', () => {
    it('should open a new shift successfully', async () => {
      mockDb.shifts.findOne.mockResolvedValue(null);
      mockDb.shifts.create.mockResolvedValue({
        id: 1,
        type: 'morning',
        status: 'open'
      });

      const shift = await shiftService.openShift({
        type: 'morning',
        userId: 1
      });

      expect(shift).toBeDefined();
      expect(shift.status).toBe('open');
    });

    it('should throw error if shift already open', async () => {
      mockDb.shifts.findOne.mockResolvedValue({
        id: 1,
        status: 'open'
      });

      await expect(shiftService.openShift({
        type: 'morning',
        userId: 1
      })).rejects.toThrow('هناك وردية مفتوحة بالفعل');
    });
  });
});
```

#### 8.2 Integration Tests

```typescript
// tests/integration/shift-flow.test.ts
describe('Shift Flow Integration', () => {
  it('should complete full shift cycle', async () => {
    // 1. Login as admin
    const { token } = await authService.login('admin', 'password');

    // 2. Open shift
    const shift = await shiftService.openShift({
      type: 'morning',
      userId: 1,
      openingBalance: 100
    });

    expect(shift.status).toBe('open');

    // 3. Create orders
    const order1 = await orderService.createOrder({
      items: [{ item_id: 1, quantity: 2 }]
    }, 2);

    const order2 = await orderService.createOrder({
      items: [{ item_id: 2, quantity: 1 }]
    }, 2);

    // 4. Close shift
    const closedShift = await shiftService.closeShift({
      shiftId: shift.id,
      userId: 1,
      actualBalance: shift.opening_balance + order1.total_amount + order2.total_amount
    });

    expect(closedShift.status).toBe('closed');
    expect(closedShift.difference).toBe(0);
  });
});
```

#### 8.3 E2E Tests

```typescript
// tests/e2e/sales.e2e.test.ts
import { _electron as electron } from 'playwright';

describe('Sales E2E', () => {
  let electronApp;
  let window;

  beforeAll(async () => {
    electronApp = await electron.launch({ args: ['.'] });
    window = await electronApp.firstWindow();
  });

  afterAll(async () => {
    await electronApp.close();
  });

  it('should complete a sale', async () => {
    // 1. Login
    await window.fill('input[name="username"]', 'cashier');
    await window.fill('input[name="password"]', 'password');
    await window.click('button[type="submit"]');

    // 2. Add items to cart
    await window.click('button[data-item-id="1"]');
    await window.click('button[data-item-id="2"]');

    // 3. Confirm order
    await window.click('button[data-action="confirm"]');

    // 4. Verify success message
    const toast = await window.locator('.toast-success');
    expect(await toast.textContent()).toContain('تم تسجيل الطلب');
  });
});
```

---

## ✅ المخرجات النهائية

### 1. نظام محسّن ومستقر
- [✓] أداء محسّن للقاعدة والواجهة
- [✓] Caching فعّال
- [✓] تحميل سريع

### 2. معمارية نظيفة
- [✓] فصل واضح للطبقات
- [✓] Repository Pattern
- [✓] Domain Logic منفصل

### 3. Local API Layer
- [✓] RESTful API جاهز
- [✓] توثيق شامل
- [✓] جاهزية للموبايل

### 4. ميزات إضافية
- [✓] Dark Mode
- [✓] إحصائيات متقدمة
- [✓] إشعارات Desktop

### 5. التوثيق
- [✓] API Documentation
- [✓] Database Schema
- [✓] Developer Guide

### 6. خارطة الطريق
- [✓] خطة تطبيق الموبايل
- [✓] استراتيجية Cloud (اختياري)
- [✓] خطة التوسع

### 7. الاختبارات
- [✓] Unit Tests
- [✓] Integration Tests
- [✓] E2E Tests

---

## 📊 معايير القبول (Acceptance Criteria)

- [ ] التطبيق يعمل بسرعة وسلاسة
- [ ] لا توجد تأخيرات ملحوظة في الواجهة
- [ ] Local API يعمل بنجاح
- [ ] Dark Mode يعمل بشكل صحيح
- [ ] جميع الاختبارات تنجح
- [ ] التوثيق مكتمل وواضح
- [ ] خطة الموبايل واضحة ومفصلة

---

## 🎉 النظام جاهز للإنتاج!

بعد إكمال هذه المرحلة، النظام يكون:
- ✅ جاهز للاستخدام اليومي
- ✅ مستقر وموثوق
- ✅ قابل للتوسع
- ✅ موثق بالكامل
- ✅ مهيأ للمستقبل

---

## 🔮 المراحل المستقبلية (Optional)

### Phase 6 - Mobile App Development
تطوير تطبيق الموبايل بالكامل

### Phase 7 - Multi-Branch Support
دعم عدة فروع للمطعم

### Phase 8 - Advanced Analytics & AI
تحليلات متقدمة وذكاء اصطناعي لتوقع المبيعات

### Phase 9 - Cloud & Web Dashboard
لوحة تحكم ويب سحابية

### Phase 10 - Integration & Ecosystem
التكامل مع أنظمة خارجية (محاسبة، مخزون، إلخ)
