# Phase 3 – Core Operations (Shifts & Sales)

## 🎯 الهدف الرئيسي
تشغيل العمليات اليومية الأساسية للمطعم من خلال نظام ورديات محكم ونظام مبيعات سريع وفعّال، مع ضمان دقة البيانات وموثوقيتها.

---

## 📋 النطاق التفصيلي

### 1. نظام الورديات (Shift Management)

#### 1.1 أنواع الورديات
```typescript
enum ShiftType {
  MORNING = 'morning',    // صباحية (6:00 - 14:00)
  EVENING = 'evening'     // مسائية (14:00 - 22:00)
}

interface Shift {
  id: number;
  type: ShiftType;
  opened_by: number;      // Admin user ID
  opened_at: Date;
  opening_balance: number;
  closed_by?: number;     // Admin user ID
  closed_at?: Date;
  expected_balance?: number;
  actual_balance?: number;
  difference?: number;
  difference_reason?: string;
  status: 'open' | 'closed';
  created_at: Date;
  updated_at: Date;
}
```

#### 1.2 قواعد الورديات

**قاعدة 1: لا مبيعات بدون وردية نشطة**
```typescript
// قبل أي عملية بيع، التحقق من وجود وردية نشطة
async function validateActiveShift(): Promise<Shift> {
  const activeShift = await db.shifts.findOne({ status: 'open' });

  if (!activeShift) {
    throw new ValidationError('لا توجد وردية نشطة. يجب فتح وردية أولاً');
  }

  return activeShift;
}
```

**قاعدة 2: وردية واحدة نشطة فقط**
```typescript
async function openShift(data: OpenShiftData): Promise<Shift> {
  // التحقق من عدم وجود وردية مفتوحة
  const existingShift = await db.shifts.findOne({ status: 'open' });

  if (existingShift) {
    throw new ValidationError(
      `هناك وردية ${existingShift.type === 'morning' ? 'صباحية' : 'مسائية'} ` +
      `مفتوحة بالفعل منذ ${formatTime(existingShift.opened_at)}`
    );
  }

  // فتح الوردية الجديدة
  const shift = await db.shifts.create({
    type: data.type,
    opened_by: data.userId,
    opened_at: new Date(),
    opening_balance: data.openingBalance || 0,
    status: 'open'
  });

  return shift;
}
```

**قاعدة 3: فقط Admin يمكنه فتح/إغلاق الورديات**
```typescript
function requireAdmin(user: User): void {
  if (user.role !== 'admin') {
    throw new AuthorizationError('فقط المدير يمكنه إدارة الورديات');
  }
}
```

#### 1.3 واجهة فتح الوردية

**شاشة فتح الوردية:**
```
+--------------------------------------------------+
|            فتح وردية جديدة                       |
+--------------------------------------------------+
|                                                  |
|  نوع الوردية:                                    |
|    ○ صباحية (6:00 - 14:00)                      |
|    ○ مسائية (14:00 - 22:00)                     |
|                                                  |
|  رصيد البداية: [_________] ريال                  |
|  (اختياري - افتراضي 0)                          |
|                                                  |
|  ملاحظات: [_____________________________]       |
|                                                  |
|  [إلغاء]                    [فتح الوردية]        |
|                                                  |
+--------------------------------------------------+
```

**مثال على الكود:**
```typescript
// src/renderer/src/components/admin/OpenShiftDialog.tsx
import { useState } from 'react';
import { useShiftStore } from '@/stores/shift.store';
import { useAuthStore } from '@/stores/auth.store';

export function OpenShiftDialog({ onClose }) {
  const [type, setType] = useState<ShiftType>('morning');
  const [openingBalance, setOpeningBalance] = useState(0);
  const { openShift } = useShiftStore();
  const { user } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await openShift({
        type,
        userId: user.id,
        openingBalance
      });

      toast.success('تم فتح الوردية بنجاح');
      onClose();
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <Dialog open onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <h2>فتح وردية جديدة</h2>

        <div>
          <label>نوع الوردية:</label>
          <RadioGroup value={type} onChange={setType}>
            <Radio value="morning">صباحية (6:00 - 14:00)</Radio>
            <Radio value="evening">مسائية (14:00 - 22:00)</Radio>
          </RadioGroup>
        </div>

        <div>
          <label>رصيد البداية:</label>
          <Input
            type="number"
            step="0.01"
            value={openingBalance}
            onChange={(e) => setOpeningBalance(parseFloat(e.target.value))}
          />
        </div>

        <div className="actions">
          <Button type="button" onClick={onClose}>إلغاء</Button>
          <Button type="submit">فتح الوردية</Button>
        </div>
      </form>
    </Dialog>
  );
}
```

#### 1.4 واجهة إغلاق الوردية

**شاشة إغلاق الوردية:**
```
+--------------------------------------------------+
|          إغلاق الوردية الصباحية                 |
+--------------------------------------------------+
|                                                  |
|  مفتوحة منذ: 6:30 ص                             |
|  المدة: 7 ساعات و 30 دقيقة                      |
|                                                  |
|  ───────────────────────────────────────────     |
|                                                  |
|  رصيد البداية:        100.00 ريال                |
|  إجمالي المبيعات:   1,250.00 ريال                |
|  إجمالي المصاريف:      50.00 ريال                |
|  ───────────────────────────────────────────     |
|  الرصيد المتوقع:    1,300.00 ريال                |
|                                                  |
|  الرصيد الفعلي:     [_________] ريال             |
|                                                  |
|  الفرق:              +10.00 ريال                 |
|  (زيادة)                                         |
|                                                  |
|  سبب الفرق (إجباري):                            |
|  [________________________________________]      |
|                                                  |
|  [إلغاء]                [اعتماد واغلاق]          |
|                                                  |
+--------------------------------------------------+
```

**مثال على الكود:**
```typescript
// src/renderer/src/components/admin/CloseShiftDialog.tsx
export function CloseShiftDialog({ shift, onClose }) {
  const [actualBalance, setActualBalance] = useState<number>(0);
  const [differenceReason, setDifferenceReason] = useState('');
  const { closeShift } = useShiftStore();
  const { user } = useAuthStore();

  // حساب الرصيد المتوقع
  const expectedBalance = useMemo(() => {
    return shift.opening_balance + shift.total_sales - shift.total_expenses;
  }, [shift]);

  // حساب الفرق
  const difference = useMemo(() => {
    return actualBalance - expectedBalance;
  }, [actualBalance, expectedBalance]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // التحقق من إدخال سبب الفرق إذا كان هناك فرق
    if (Math.abs(difference) > 0.01 && !differenceReason.trim()) {
      toast.error('يجب إدخال سبب الفرق');
      return;
    }

    try {
      await closeShift({
        shiftId: shift.id,
        userId: user.id,
        actualBalance,
        differenceReason: difference !== 0 ? differenceReason : null
      });

      toast.success('تم إغلاق الوردية بنجاح');
      onClose();
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <Dialog open onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <h2>إغلاق الوردية {shift.type === 'morning' ? 'الصباحية' : 'المسائية'}</h2>

        <div className="info">
          <p>مفتوحة منذ: {formatTime(shift.opened_at)}</p>
          <p>المدة: {calculateDuration(shift.opened_at)}</p>
        </div>

        <Separator />

        <div className="summary">
          <Row>
            <span>رصيد البداية:</span>
            <span>{formatCurrency(shift.opening_balance)}</span>
          </Row>
          <Row>
            <span>إجمالي المبيعات:</span>
            <span className="positive">{formatCurrency(shift.total_sales)}</span>
          </Row>
          <Row>
            <span>إجمالي المصاريف:</span>
            <span className="negative">-{formatCurrency(shift.total_expenses)}</span>
          </Row>
          <Separator />
          <Row className="bold">
            <span>الرصيد المتوقع:</span>
            <span>{formatCurrency(expectedBalance)}</span>
          </Row>
        </div>

        <div>
          <label>الرصيد الفعلي: *</label>
          <Input
            type="number"
            step="0.01"
            required
            value={actualBalance}
            onChange={(e) => setActualBalance(parseFloat(e.target.value))}
            placeholder="أدخل الرصيد الفعلي"
          />
        </div>

        {actualBalance > 0 && (
          <div className={`difference ${difference >= 0 ? 'positive' : 'negative'}`}>
            <strong>الفرق:</strong>
            <span>
              {difference >= 0 ? '+' : ''}
              {formatCurrency(difference)}
            </span>
            <span>{difference >= 0 ? '(زيادة)' : '(نقص)'}</span>
          </div>
        )}

        {Math.abs(difference) > 0.01 && (
          <div>
            <label>سبب الفرق: *</label>
            <Textarea
              required
              value={differenceReason}
              onChange={(e) => setDifferenceReason(e.target.value)}
              placeholder="يرجى توضيح سبب الفرق بالتفصيل..."
              rows={3}
            />
          </div>
        )}

        <div className="actions">
          <Button type="button" onClick={onClose}>إلغاء</Button>
          <Button type="submit">اعتماد وإغلاق</Button>
        </div>
      </form>
    </Dialog>
  );
}
```

#### 1.5 Service Layer للورديات

```typescript
// src/main/services/shift.service.ts
export class ShiftService {
  async openShift(data: OpenShiftData): Promise<Shift> {
    // التحقق من الصلاحيات
    const user = await this.db.users.findById(data.userId);
    if (user.role !== 'admin') {
      throw new AuthorizationError('فقط المدير يمكنه فتح وردية');
    }

    // التحقق من عدم وجود وردية مفتوحة
    const existingShift = await this.db.shifts.findOne({ status: 'open' });
    if (existingShift) {
      throw new ValidationError('هناك وردية مفتوحة بالفعل');
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
    // التحقق من الصلاحيات
    const user = await this.db.users.findById(data.userId);
    if (user.role !== 'admin') {
      throw new AuthorizationError('فقط المدير يمكنه إغلاق وردية');
    }

    // الحصول على الوردية الحالية
    const shift = await this.db.shifts.findById(data.shiftId);
    if (!shift || shift.status !== 'open') {
      throw new ValidationError('الوردية غير موجودة أو مغلقة بالفعل');
    }

    // حساب الرصيد المتوقع
    const expectedBalance = await this.calculateExpectedBalance(shift.id);

    // حساب الفرق
    const difference = data.actualBalance - expectedBalance;

    // التحقق من سبب الفرق
    if (Math.abs(difference) > 0.01 && !data.differenceReason) {
      throw new ValidationError('يجب إدخال سبب الفرق');
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

  private async calculateExpectedBalance(shiftId: number): Promise<number> {
    const shift = await this.db.shifts.findById(shiftId);

    // إجمالي المبيعات
    const totalSales = await this.db.orders
      .sum('total_amount', { shift_id: shiftId });

    // إجمالي المصاريف
    const totalExpenses = await this.db.expenses
      .sum('amount', { shift_id: shiftId });

    return shift.opening_balance + totalSales - totalExpenses;
  }

  async getCurrentShift(): Promise<Shift | null> {
    return await this.db.shifts.findOne({ status: 'open' });
  }

  async getShiftSummary(shiftId: number): Promise<ShiftSummary> {
    const shift = await this.db.shifts.findById(shiftId);
    const orders = await this.db.orders.findMany({ shift_id: shiftId });
    const expenses = await this.db.expenses.findMany({ shift_id: shiftId });

    const totalOrders = orders.length;
    const totalSales = orders.reduce((sum, o) => sum + o.total_amount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    return {
      shift,
      totalOrders,
      totalSales,
      totalExpenses,
      expectedBalance: shift.opening_balance + totalSales - totalExpenses
    };
  }
}
```

---

### 2. نظام المبيعات (Sales Management)

#### 2.1 واجهة نقطة البيع (POS Interface)

**الشاشة الرئيسية للمبيعات:**
```
+-------------------------------------------------------------------------+
| 🏠 مطعم الشاورما | الوردية: صباحية | الكاشير: أحمد | 10:30 ص | [خروج]   |
+-------------------------------------------------------------------------+
|                                                                         |
| الأصناف                             |  الطلب الحالي #234                |
| ─────────────────────────            |  ───────────────────────────      |
|                                      |                                   |
| 🍗 الشاورما                          |  x2  شاورما دجاج        10.00    |
| ┌───────────┬───────────┐            |  x1  شاورما لحم          6.00    |
| │ شاورما دجاج│ شاورما لحم│            |  x1  كولا                1.50    |
| │   5.00    │   6.00    │            |  x1  بطاطس مقلية        2.00    |
| └───────────┴───────────┘            |                                   |
|                                      |  [✕] [تعديل الكمية]               |
| 🥤 المشروبات                         |                                   |
| ┌───────────┬───────────┐            |  ─────────────────────────────    |
| │   كولا    │  بيبسي    │            |                                   |
| │   1.50    │   1.50    │            |  الإجمالي:            19.50 ريال |
| └───────────┴───────────┘            |                                   |
|                                      |  ─────────────────────────────    |
| 🍟 الإضافات                          |                                   |
| ┌───────────┬───────────┐            |  [إلغاء الطلب]    [تأكيد وطباعة]  |
| │بطاطس مقلية│ خبز إضافي│            |                                   |
| │   2.00    │   0.50    │            |                                   |
| └───────────┴───────────┘            |                                   |
|                                      |                                   |
+-------------------------------------------------------------------------+
```

#### 2.2 نموذج بيانات الطلب

```typescript
interface Order {
  id: number;
  shift_id: number;
  cashier_id: number;
  total_amount: number;
  payment_method: 'cash' | 'card';
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

interface OrderItem {
  id: number;
  order_id: number;
  item_id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
  created_at: Date;
}

interface CreateOrderData {
  items: {
    item_id: number;
    quantity: number;
  }[];
  payment_method?: 'cash' | 'card';
  notes?: string;
}
```

#### 2.3 مكون نقطة البيع

```typescript
// src/renderer/src/pages/SalesPage.tsx
export function SalesPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const { currentShift } = useShiftStore();
  const { user } = useAuthStore();

  // التحقق من وجود وردية نشطة
  useEffect(() => {
    if (!currentShift) {
      toast.error('لا توجد وردية نشطة. يرجى فتح وردية أولاً');
      // إعادة توجيه للمدير
    }
  }, [currentShift]);

  // تحميل الأصناف
  useEffect(() => {
    loadCategories();
    loadItems();
  }, []);

  const addToCart = (item: Item) => {
    setCart(prev => {
      const existing = prev.find(i => i.item_id === item.id);

      if (existing) {
        // زيادة الكمية
        return prev.map(i =>
          i.item_id === item.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      } else {
        // إضافة صنف جديد
        return [...prev, {
          item_id: item.id,
          name: item.name_ar,
          quantity: 1,
          unit_price: item.price,
          subtotal: item.price
        }];
      }
    });
  };

  const updateQuantity = (itemId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    setCart(prev =>
      prev.map(item =>
        item.item_id === itemId
          ? { ...item, quantity, subtotal: item.unit_price * quantity }
          : item
      )
    );
  };

  const removeFromCart = (itemId: number) => {
    setCart(prev => prev.filter(i => i.item_id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const handleConfirmOrder = async () => {
    if (cart.length === 0) {
      toast.error('السلة فارغة');
      return;
    }

    try {
      const orderData: CreateOrderData = {
        items: cart.map(item => ({
          item_id: item.item_id,
          quantity: item.quantity
        })),
        payment_method: 'cash'
      };

      const order = await window.api.createOrder(orderData);

      toast.success(`تم تسجيل الطلب #${order.id} بنجاح`);

      // طباعة الفاتورة
      await window.api.printReceipt(order.id);

      // تفريغ السلة
      clearCart();
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="sales-page">
      <Header
        shiftType={currentShift?.type}
        cashierName={user?.full_name}
      />

      <div className="content">
        {/* قائمة الأصناف */}
        <div className="items-panel">
          {categories.map(category => (
            <CategorySection key={category.id} category={category}>
              {items
                .filter(item => item.category_id === category.id && item.is_active)
                .map(item => (
                  <ItemButton
                    key={item.id}
                    item={item}
                    onClick={() => addToCart(item)}
                  />
                ))}
            </CategorySection>
          ))}
        </div>

        {/* الطلب الحالي */}
        <div className="cart-panel">
          <h2>الطلب الحالي</h2>

          {cart.length === 0 ? (
            <EmptyCart />
          ) : (
            <>
              <div className="cart-items">
                {cart.map(item => (
                  <CartItem
                    key={item.item_id}
                    item={item}
                    onUpdateQuantity={updateQuantity}
                    onRemove={removeFromCart}
                  />
                ))}
              </div>

              <Separator />

              <div className="total">
                <span>الإجمالي:</span>
                <span className="amount">{formatCurrency(calculateTotal())}</span>
              </div>

              <div className="actions">
                <Button variant="outline" onClick={clearCart}>
                  إلغاء الطلب
                </Button>
                <Button onClick={handleConfirmOrder}>
                  تأكيد وطباعة
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
```

#### 2.4 Service Layer للمبيعات

```typescript
// src/main/services/order.service.ts
export class OrderService {
  async createOrder(data: CreateOrderData, userId: number): Promise<Order> {
    // التحقق من وجود وردية نشطة
    const currentShift = await this.shiftService.getCurrentShift();
    if (!currentShift) {
      throw new ValidationError('لا توجد وردية نشطة');
    }

    // التحقق من الأصناف
    if (!data.items || data.items.length === 0) {
      throw new ValidationError('الطلب فارغ');
    }

    // حساب الإجمالي
    let totalAmount = 0;
    const orderItems: OrderItemData[] = [];

    for (const item of data.items) {
      const menuItem = await this.db.items.findById(item.item_id);

      if (!menuItem || !menuItem.is_active) {
        throw new ValidationError(`الصنف غير موجود أو غير نشط`);
      }

      if (item.quantity <= 0) {
        throw new ValidationError('الكمية يجب أن تكون أكبر من صفر');
      }

      const subtotal = menuItem.price * item.quantity;
      totalAmount += subtotal;

      orderItems.push({
        item_id: item.item_id,
        quantity: item.quantity,
        unit_price: menuItem.price,
        subtotal
      });
    }

    // إنشاء الطلب داخل transaction
    const order = await this.db.transaction(async (tx) => {
      // إنشاء الطلب
      const newOrder = await tx.orders.create({
        shift_id: currentShift.id,
        cashier_id: userId,
        total_amount: totalAmount,
        payment_method: data.payment_method || 'cash',
        notes: data.notes
      });

      // إضافة تفاصيل الطلب
      for (const item of orderItems) {
        await tx.order_items.create({
          order_id: newOrder.id,
          ...item
        });
      }

      return newOrder;
    });

    // تسجيل في Audit Log
    await this.auditLog.log({
      user_id: userId,
      action: 'CREATE_ORDER',
      table_name: 'orders',
      record_id: order.id,
      new_values: JSON.stringify({ order, items: orderItems })
    });

    return order;
  }

  async getOrder(orderId: number): Promise<OrderWithItems> {
    const order = await this.db.orders.findById(orderId);
    if (!order) {
      throw new NotFoundError('الطلب');
    }

    const items = await this.db.order_items
      .findMany({ order_id: orderId })
      .include('item');

    return { ...order, items };
  }

  async getOrdersByShift(shiftId: number): Promise<Order[]> {
    return await this.db.orders.findMany({ shift_id: shiftId });
  }

  async deleteOrder(orderId: number, userId: number): Promise<void> {
    // التحقق من الصلاحيات
    const user = await this.db.users.findById(userId);
    if (user.role !== 'admin') {
      throw new AuthorizationError('فقط المدير يمكنه حذف الطلبات');
    }

    const order = await this.db.orders.findById(orderId);
    if (!order) {
      throw new NotFoundError('الطلب');
    }

    // حذف الطلب
    await this.db.orders.delete(orderId);

    // تسجيل في Audit Log
    await this.auditLog.log({
      user_id: userId,
      action: 'DELETE_ORDER',
      table_name: 'orders',
      record_id: orderId,
      old_values: JSON.stringify(order)
    });
  }
}
```

#### 2.5 طباعة الفواتير

```typescript
// src/main/services/printer.service.ts
import { PosPrinter } from 'electron-pos-printer';

export class PrinterService {
  async printReceipt(orderId: number): Promise<void> {
    const order = await this.orderService.getOrder(orderId);
    const shift = await this.shiftService.getShift(order.shift_id);

    const data = [
      {
        type: 'text',
        value: 'مطعم الشاورما',
        style: { textAlign: 'center', fontSize: '20px', fontWeight: 'bold' }
      },
      {
        type: 'text',
        value: '─────────────────────',
        style: { textAlign: 'center' }
      },
      {
        type: 'text',
        value: `طلب رقم: ${order.id}`,
        style: { textAlign: 'center' }
      },
      {
        type: 'text',
        value: `التاريخ: ${formatDate(order.created_at)}`,
        style: { textAlign: 'center' }
      },
      {
        type: 'text',
        value: `الوقت: ${formatTime(order.created_at)}`,
        style: { textAlign: 'center' }
      },
      {
        type: 'text',
        value: `الوردية: ${shift.type === 'morning' ? 'صباحية' : 'مسائية'}`,
        style: { textAlign: 'center' }
      },
      {
        type: 'text',
        value: '─────────────────────',
        style: { textAlign: 'center' }
      },
      {
        type: 'table',
        style: { border: '0' },
        tableHeader: ['الصنف', 'الكمية', 'السعر', 'المجموع'],
        tableBody: order.items.map(item => [
          item.item.name_ar,
          item.quantity.toString(),
          formatCurrency(item.unit_price),
          formatCurrency(item.subtotal)
        ]),
        tableFooter: ['', '', 'الإجمالي:', formatCurrency(order.total_amount)],
        tableHeaderStyle: { fontWeight: 'bold' },
        tableBodyStyle: { textAlign: 'right' }
      },
      {
        type: 'text',
        value: '─────────────────────',
        style: { textAlign: 'center' }
      },
      {
        type: 'text',
        value: 'شكراً لزيارتكم',
        style: { textAlign: 'center', fontSize: '16px' }
      }
    ];

    try {
      await PosPrinter.print(data, {
        preview: false,
        width: '80mm',
        margin: '0',
        copies: 1,
        printerName: '', // اسم الطابعة الافتراضية
        timeOutPerLine: 400,
        silent: true
      });
    } catch (error) {
      console.error('Print error:', error);
      throw new Error('فشل طباعة الفاتورة');
    }
  }
}
```

---

### 3. قيود وصلاحيات المبيعات

#### 3.1 صلاحيات الكاشير
```typescript
const CASHIER_PERMISSIONS = {
  orders: {
    create: true,    // يمكن تسجيل طلبات جديدة
    read: true,      // يمكن رؤية الطلبات الخاصة به
    update: false,   // لا يمكن تعديل الطلبات
    delete: false    // لا يمكن حذف الطلبات
  },
  shifts: {
    create: false,   // لا يمكن فتح ورديات
    read: true,      // يمكن رؤية الوردية الحالية
    update: false,   // لا يمكن تعديل الورديات
    delete: false    // لا يمكن حذف الورديات
  }
};
```

#### 3.2 صلاحيات المدير
```typescript
const ADMIN_PERMISSIONS = {
  orders: {
    create: true,    // يمكن تسجيل طلبات
    read: true,      // يمكن رؤية جميع الطلبات
    update: true,    // يمكن تعديل الطلبات
    delete: true     // يمكن حذف الطلبات
  },
  shifts: {
    create: true,    // يمكن فتح ورديات
    read: true,      // يمكن رؤية جميع الورديات
    update: true,    // يمكن تعديل الورديات
    delete: false    // لا يمكن حذف الورديات (للتدقيق)
  }
};
```

#### 3.3 منع التعديل/الحذف
```typescript
// Middleware للتحقق من الصلاحيات
async function requirePermission(
  userId: number,
  resource: string,
  action: string
): Promise<void> {
  const user = await db.users.findById(userId);

  const permissions = user.role === 'admin'
    ? ADMIN_PERMISSIONS
    : CASHIER_PERMISSIONS;

  if (!permissions[resource]?.[action]) {
    throw new AuthorizationError(
      `لا تملك صلاحية ${action} على ${resource}`
    );
  }
}

// استخدام في Service
async function deleteOrder(orderId: number, userId: number) {
  await requirePermission(userId, 'orders', 'delete');
  // ... باقي الكود
}
```

---

### 4. التعامل مع الحالات الخاصة

#### 4.1 انقطاع الكهرباء
```typescript
// Auto-save كل 30 ثانية
class AutoSaveService {
  private interval: NodeJS.Timeout;

  start() {
    this.interval = setInterval(() => {
      this.saveCurrentState();
    }, 30000); // 30 ثانية
  }

  private async saveCurrentState() {
    const state = {
      cart: store.getState().cart,
      timestamp: new Date()
    };

    localStorage.setItem('autosave', JSON.stringify(state));
  }

  async restore(): Promise<void> {
    const saved = localStorage.getItem('autosave');
    if (!saved) return;

    const state = JSON.parse(saved);

    // عرض رسالة للمستخدم
    const shouldRestore = await confirm(
      'تم العثور على طلب غير مكتمل. هل تريد استعادته؟'
    );

    if (shouldRestore) {
      store.dispatch(restoreCart(state.cart));
    }

    // مسح الحفظ التلقائي
    localStorage.removeItem('autosave');
  }
}
```

#### 4.2 فشل الطباعة
```typescript
async function handlePrintFailure(order: Order) {
  // حفظ الطلب أولاً (تم بالفعل)
  // ثم محاولة الطباعة

  try {
    await printerService.printReceipt(order.id);
  } catch (error) {
    // إذا فشلت الطباعة، عرض خيارات
    const choice = await showDialog({
      title: 'فشل الطباعة',
      message: 'حدث خطأ أثناء الطباعة. ماذا تريد أن تفعل؟',
      options: [
        'إعادة المحاولة',
        'طباعة لاحقاً',
        'إلغاء'
      ]
    });

    if (choice === 'إعادة المحاولة') {
      await printerService.printReceipt(order.id);
    } else if (choice === 'طباعة لاحقاً') {
      // حفظ في قائمة الطباعة المعلقة
      await queueService.addToPrintQueue(order.id);
    }
  }
}
```

---

### 5. مؤشرات الأداء (Performance Indicators)

#### 5.1 شاشة ملخص الوردية (للمدير)
```
+--------------------------------------------------+
|          ملخص الوردية الحالية (صباحية)           |
+--------------------------------------------------+
|                                                  |
|  مفتوحة منذ: 6:30 ص (منذ 4 ساعات)               |
|  الكاشير: أحمد                                   |
|                                                  |
|  ───────────────────────────────────────────     |
|                                                  |
|  📊 المبيعات:                                    |
|    عدد الطلبات:          45 طلب                 |
|    إجمالي المبيعات:      1,250.00 ريال          |
|    متوسط الطلب:          27.78 ريال             |
|                                                  |
|  💰 المالية:                                     |
|    رصيد البداية:         100.00 ريال             |
|    المبيعات:             1,250.00 ريال           |
|    المصاريف:             50.00 ريال              |
|    الرصيد الحالي:        1,300.00 ريال           |
|                                                  |
|  🔝 الأكثر مبيعاً:                               |
|    1. شاورما دجاج (23 قطعة)                     |
|    2. شاورما لحم (15 قطعة)                      |
|    3. كولا (18 قطعة)                            |
|                                                  |
|  ───────────────────────────────────────────     |
|                                                  |
|  [تفاصيل أكثر]              [إغلاق الوردية]     |
|                                                  |
+--------------------------------------------------+
```

---

## ✅ المخرجات النهائية

### 1. نظام ورديات كامل
- [✓] فتح وإغلاق الورديات يعمل
- [✓] التحقق من الفروقات المالية
- [✓] تسجيل أسباب الفروقات
- [✓] Audit Log للورديات

### 2. نظام مبيعات فعّال
- [✓] واجهة POS سريعة وسهلة
- [✓] إضافة وتعديل الطلبات
- [✓] حساب تلقائي للإجماليات
- [✓] طباعة الفواتير

### 3. الصلاحيات والأمان
- [✓] صلاحيات واضحة لكل دور
- [✓] منع التعديل/الحذف للكاشير
- [✓] Audit Log لجميع العمليات

### 4. البيانات الموثوقة
- [✓] جميع الطلبات مربوطة بورديات
- [✓] لا مبيعات بدون وردية نشطة
- [✓] حفظ تلقائي للبيانات

---

## 📊 معايير القبول (Acceptance Criteria)

- [ ] يمكن فتح وإغلاق الورديات بنجاح
- [ ] لا يمكن تسجيل مبيعات بدون وردية نشطة
- [ ] الكاشير لا يستطيع فتح/إغلاق الورديات
- [ ] يمكن تسجيل الطلبات بسرعة (<5 ثواني)
- [ ] الطباعة تعمل بنجاح
- [ ] حساب الفروقات المالية دقيق
- [ ] جميع العمليات مسجلة في Audit Log
- [ ] البيانات محفوظة بشكل موثوق

---

## 🔗 الانتقال للمرحلة التالية
بعد إكمال هذه المرحلة، ننتقل إلى:
👉 **Phase 4 - Financial Control & Reports**
