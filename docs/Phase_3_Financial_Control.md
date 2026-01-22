# Phase 4 – Financial Control & Reports

## 🎯 الهدف الرئيسي
ضبط العمليات المالية اليومية بدقة، وتوفير رؤية مالية شاملة من خلال التقارير التفصيلية، مع ضمان الشفافية الكاملة والمساءلة.

---

## 📋 النطاق التفصيلي

### 1. الرقابة المالية على الورديات

#### 1.1 آلية حساب الرصيد المتوقع

```typescript
interface ShiftFinancials {
  opening_balance: number;      // رصيد البداية
  total_sales: number;          // إجمالي المبيعات
  total_expenses: number;       // إجمالي المصاريف
  expected_balance: number;     // الرصيد المتوقع
  actual_balance: number;       // الرصيد الفعلي
  difference: number;           // الفرق
  difference_reason?: string;   // سبب الفرق
}

function calculateExpectedBalance(shift: Shift): number {
  // الرصيد المتوقع = رصيد البداية + المبيعات - المصاريف
  return shift.opening_balance + shift.total_sales - shift.total_expenses;
}
```

#### 1.2 واجهة مراجعة الفروقات المالية

**شاشة مراجعة الفروقات:**
```
+--------------------------------------------------------------------+
|                   مراجعة الفروقات المالية                         |
+--------------------------------------------------------------------+
|                                                                    |
|  الفترة: من 2024-01-01 إلى 2024-01-31                             |
|  ───────────────────────────────────────────────────────────       |
|                                                                    |
|  التاريخ  | الوردية  | المتوقع   | الفعلي   | الفرق   | الحالة     |
|  ───────────────────────────────────────────────────────────       |
|  01/01   | صباحية   | 1,200.00 | 1,210.00 | +10.00 | ✓ معتمد    |
|  01/01   | مسائية   | 1,500.00 | 1,480.00 | -20.00 | ✓ معتمد    |
|  02/01   | صباحية   | 1,100.00 | 1,100.00 | 0.00   | ✓ متطابق   |
|  02/01   | مسائية   | 1,300.00 | 1,250.00 | -50.00 | ⚠ يراجع    |
|  ───────────────────────────────────────────────────────────       |
|                                                                    |
|  إجمالي الفروقات:    -60.00 ريال                                  |
|                                                                    |
|  [عرض التفاصيل]  [تصدير]  [طباعة]                                 |
|                                                                    |
+--------------------------------------------------------------------+
```

#### 1.3 شاشة تفاصيل الفرق

```
+--------------------------------------------------+
|      تفاصيل الفرق - الوردية المسائية 02/01       |
+--------------------------------------------------+
|                                                  |
|  الوردية: مسائية                                 |
|  التاريخ: 2024-01-02                             |
|  المدة: 14:00 - 22:30 (8.5 ساعة)                |
|                                                  |
|  ───────────────────────────────────────────     |
|                                                  |
|  المالية:                                        |
|    رصيد البداية:      100.00 ريال                |
|    إجمالي المبيعات:   1,250.00 ريال              |
|    إجمالي المصاريف:   50.00 ريال                 |
|  ───────────────────────────────────────────     |
|    الرصيد المتوقع:    1,300.00 ريال              |
|    الرصيد الفعلي:     1,250.00 ريال              |
|  ───────────────────────────────────────────     |
|    الفرق:            -50.00 ريال (نقص)          |
|                                                  |
|  سبب الفرق:                                      |
|  "خطأ في الحساب - تم إعطاء فكة زائدة لأحد       |
|   الزبائن بقيمة 50 ريال"                         |
|                                                  |
|  المسؤول: المدير محمد                            |
|  التوقيت: 2024-01-02 22:35                       |
|                                                  |
|  ───────────────────────────────────────────     |
|                                                  |
|  الإجراء: ✓ تم الاعتماد                          |
|                                                  |
|  [رجوع]                          [طباعة]         |
|                                                  |
+--------------------------------------------------+
```

---

### 2. سجل التدقيق (Audit Log)

#### 2.1 نموذج سجل التدقيق

```typescript
interface AuditLogEntry {
  id: number;
  user_id: number;
  user_name: string;
  action: AuditAction;
  table_name: string;
  record_id: number;
  old_values?: any;
  new_values?: any;
  ip_address?: string;
  created_at: Date;
}

enum AuditAction {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  OPEN_SHIFT = 'OPEN_SHIFT',
  CLOSE_SHIFT = 'CLOSE_SHIFT',
  CREATE_ORDER = 'CREATE_ORDER',
  UPDATE_ORDER = 'UPDATE_ORDER',
  DELETE_ORDER = 'DELETE_ORDER',
  CREATE_EXPENSE = 'CREATE_EXPENSE',
  UPDATE_EXPENSE = 'UPDATE_EXPENSE',
  DELETE_EXPENSE = 'DELETE_EXPENSE',
  ADJUST_BALANCE = 'ADJUST_BALANCE',
  CHANGE_SETTINGS = 'CHANGE_SETTINGS'
}
```

#### 2.2 Audit Log Service

```typescript
// src/main/services/audit-log.service.ts
export class AuditLogService {
  async log(entry: CreateAuditLogEntry): Promise<void> {
    const user = await this.db.users.findById(entry.user_id);

    await this.db.audit_log.create({
      user_id: entry.user_id,
      user_name: user.full_name,
      action: entry.action,
      table_name: entry.table_name,
      record_id: entry.record_id,
      old_values: entry.old_values ? JSON.stringify(entry.old_values) : null,
      new_values: entry.new_values ? JSON.stringify(entry.new_values) : null,
      ip_address: entry.ip_address,
      created_at: new Date()
    });
  }

  async getLog(filters: AuditLogFilters): Promise<AuditLogEntry[]> {
    const query: any = {};

    if (filters.user_id) {
      query.user_id = filters.user_id;
    }

    if (filters.action) {
      query.action = filters.action;
    }

    if (filters.from_date) {
      query.created_at = { $gte: filters.from_date };
    }

    if (filters.to_date) {
      query.created_at = { ...query.created_at, $lte: filters.to_date };
    }

    return await this.db.audit_log
      .findMany(query)
      .orderBy('created_at', 'desc')
      .limit(filters.limit || 100);
  }

  async getRecordHistory(tableName: string, recordId: number): Promise<AuditLogEntry[]> {
    return await this.db.audit_log
      .findMany({ table_name: tableName, record_id: recordId })
      .orderBy('created_at', 'desc');
  }
}
```

#### 2.3 واجهة سجل التدقيق

```
+--------------------------------------------------------------------+
|                        سجل التدقيق                                 |
+--------------------------------------------------------------------+
|                                                                    |
|  المستخدم: [الكل ▼]  الإجراء: [الكل ▼]  من: [____]  إلى: [____]   |
|                                                                    |
|  ───────────────────────────────────────────────────────────       |
|  الوقت         | المستخدم | الإجراء          | التفاصيل            |
|  ───────────────────────────────────────────────────────────       |
|  10:30:15     | أحمد     | تسجيل طلب        | طلب #234           |
|  10:25:42     | محمد     | إغلاق وردية      | وردية صباحية       |
|  10:20:11     | أحمد     | تسجيل طلب        | طلب #233           |
|  10:15:33     | محمد     | تعديل مصروف      | مصروف #45          |
|  10:10:22     | أحمد     | تسجيل طلب        | طلب #232           |
|  ───────────────────────────────────────────────────────────       |
|                                                                    |
|  [تحديث]  [تصدير]  [طباعة]                                        |
|                                                                    |
+--------------------------------------------------------------------+
```

---

### 3. التعديلات المالية (Adjustments)

#### 3.1 نموذج التعديلات

```typescript
interface FinancialAdjustment {
  id: number;
  shift_id: number;
  type: 'addition' | 'deduction';
  amount: number;
  reason: string;
  category: string;
  approved_by: number;
  created_at: Date;
}
```

#### 3.2 واجهة إضافة تعديل مالي

```
+--------------------------------------------------+
|              إضافة تعديل مالي                     |
+--------------------------------------------------+
|                                                  |
|  الوردية: الصباحية - 2024-01-02                 |
|                                                  |
|  نوع التعديل:                                    |
|    ○ إضافة                                       |
|    ● خصم                                         |
|                                                  |
|  الفئة: [خطأ في الحساب ▼]                        |
|                                                  |
|  المبلغ: [_________] ريال                        |
|                                                  |
|  السبب (إجباري):                                |
|  [________________________________________]      |
|  [________________________________________]      |
|  [________________________________________]      |
|                                                  |
|  تأكيد كلمة المرور: [__________]                |
|  (للتحقق من هوية المدير)                        |
|                                                  |
|  [إلغاء]                    [تأكيد التعديل]      |
|                                                  |
+--------------------------------------------------+
```

#### 3.3 Service للتعديلات

```typescript
// src/main/services/adjustment.service.ts
export class AdjustmentService {
  async createAdjustment(
    data: CreateAdjustmentData,
    userId: number
  ): Promise<FinancialAdjustment> {
    // التحقق من الصلاحيات
    const user = await this.db.users.findById(userId);
    if (user.role !== 'admin') {
      throw new AuthorizationError('فقط المدير يمكنه إجراء التعديلات المالية');
    }

    // التحقق من الوردية
    const shift = await this.db.shifts.findById(data.shift_id);
    if (!shift) {
      throw new NotFoundError('الوردية');
    }

    // التحقق من البيانات
    if (data.amount <= 0) {
      throw new ValidationError('المبلغ يجب أن يكون أكبر من صفر');
    }

    if (!data.reason || data.reason.trim().length < 10) {
      throw new ValidationError('يجب إدخال سبب تفصيلي (10 أحرف على الأقل)');
    }

    // التحقق من كلمة المرور
    const isPasswordValid = await bcrypt.compare(
      data.password,
      user.password_hash
    );

    if (!isPasswordValid) {
      throw new AuthenticationError('كلمة المرور غير صحيحة');
    }

    // إنشاء التعديل
    const adjustment = await this.db.adjustments.create({
      shift_id: data.shift_id,
      type: data.type,
      amount: data.amount,
      reason: data.reason,
      category: data.category,
      approved_by: userId,
      created_at: new Date()
    });

    // تسجيل في Audit Log
    await this.auditLog.log({
      user_id: userId,
      action: 'ADJUST_BALANCE',
      table_name: 'adjustments',
      record_id: adjustment.id,
      new_values: JSON.stringify(adjustment)
    });

    return adjustment;
  }

  async getAdjustmentsByShift(shiftId: number): Promise<FinancialAdjustment[]> {
    return await this.db.adjustments.findMany({ shift_id: shiftId });
  }
}
```

---

### 4. سياسة التعامل مع انقطاع الكهرباء

#### 4.1 آلية الحفظ التلقائي

```typescript
// src/main/services/recovery.service.ts
export class RecoveryService {
  private autoSaveInterval: NodeJS.Timeout;

  startAutoSave() {
    // حفظ كل 30 ثانية
    this.autoSaveInterval = setInterval(() => {
      this.saveCurrentState();
    }, 30000);
  }

  async saveCurrentState(): Promise<void> {
    const state = {
      currentShift: await this.shiftService.getCurrentShift(),
      pendingOrders: this.getPendingOrders(),
      timestamp: new Date()
    };

    // حفظ في ملف محلي
    await fs.writeFile(
      this.getStatePath(),
      JSON.stringify(state),
      'utf-8'
    );
  }

  async recoverFromCrash(): Promise<RecoveryResult> {
    const statePath = this.getStatePath();

    if (!fs.existsSync(statePath)) {
      return { hasRecovery: false };
    }

    const savedState = JSON.parse(
      await fs.readFile(statePath, 'utf-8')
    );

    // التحقق من عمر الحالة المحفوظة
    const stateAge = Date.now() - new Date(savedState.timestamp).getTime();
    const maxAge = 5 * 60 * 1000; // 5 دقائق

    if (stateAge > maxAge) {
      // الحالة قديمة جداً، تجاهلها
      await fs.unlink(statePath);
      return { hasRecovery: false };
    }

    return {
      hasRecovery: true,
      state: savedState
    };
  }

  async applyRecovery(state: SavedState): Promise<void> {
    // استعادة الوردية إذا كانت لا تزال مفتوحة
    if (state.currentShift && state.currentShift.status === 'open') {
      // الوردية موجودة في قاعدة البيانات، لا حاجة لفعل شيء
    }

    // استعادة الطلبات المعلقة
    if (state.pendingOrders && state.pendingOrders.length > 0) {
      for (const order of state.pendingOrders) {
        // محاولة إكمال الطلب
        await this.orderService.createOrder(order);
      }
    }

    // حذف ملف الحالة
    await fs.unlink(this.getStatePath());
  }

  private getStatePath(): string {
    return path.join(app.getPath('userData'), 'recovery-state.json');
  }
}
```

#### 4.2 رسالة الاسترجاع

```typescript
// عند بدء التطبيق
export async function onAppStart() {
  const recoveryService = new RecoveryService();
  const recoveryResult = await recoveryService.recoverFromCrash();

  if (recoveryResult.hasRecovery) {
    // عرض رسالة للمستخدم
    const shouldRecover = await dialog.showMessageBox({
      type: 'question',
      title: 'استعادة البيانات',
      message: 'تم العثور على بيانات غير محفوظة من جلسة سابقة. هل تريد استعادتها؟',
      buttons: ['نعم، استعادة', 'لا، تجاهل'],
      defaultId: 0,
      cancelId: 1
    });

    if (shouldRecover.response === 0) {
      await recoveryService.applyRecovery(recoveryResult.state);

      dialog.showMessageBox({
        type: 'info',
        title: 'تمت الاستعادة',
        message: 'تم استعادة البيانات بنجاح'
      });
    }
  }
}
```

---

### 5. تسجيل المصاريف (Expenses)

#### 5.1 نموذج المصاريف

```typescript
interface Expense {
  id: number;
  shift_id?: number;           // اختياري - يمكن أن يكون مصروف عام
  category: ExpenseCategory;
  amount: number;
  description: string;
  receipt_number?: string;
  recorded_by: number;
  created_at: Date;
}

enum ExpenseCategory {
  INGREDIENTS = 'ingredients',        // مواد خام
  UTILITIES = 'utilities',           // خدمات (كهرباء، ماء)
  SALARIES = 'salaries',            // رواتب
  MAINTENANCE = 'maintenance',      // صيانة
  RENT = 'rent',                    // إيجار
  OTHER = 'other'                   // أخرى
}
```

#### 5.2 واجهة تسجيل المصاريف

```
+--------------------------------------------------+
|              تسجيل مصروف جديد                     |
+--------------------------------------------------+
|                                                  |
|  الوردية: [الحالية ▼]                            |
|  (اختياري - يمكن تسجيل مصروف عام)                |
|                                                  |
|  الفئة: [مواد خام ▼]                             |
|    - مواد خام                                    |
|    - خدمات (كهرباء، ماء)                         |
|    - رواتب                                       |
|    - صيانة                                       |
|    - إيجار                                       |
|    - أخرى                                        |
|                                                  |
|  المبلغ: [_________] ريال *                      |
|                                                  |
|  الوصف: [____________________________] *         |
|                                                  |
|  رقم الفاتورة: [__________]                      |
|  (اختياري)                                       |
|                                                  |
|  [إلغاء]                    [حفظ المصروف]        |
|                                                  |
+--------------------------------------------------+
```

#### 5.3 Service للمصاريف

```typescript
// src/main/services/expense.service.ts
export class ExpenseService {
  async createExpense(
    data: CreateExpenseData,
    userId: number
  ): Promise<Expense> {
    // التحقق من الصلاحيات
    const user = await this.db.users.findById(userId);
    if (user.role !== 'admin') {
      throw new AuthorizationError('فقط المدير يمكنه تسجيل المصاريف');
    }

    // التحقق من البيانات
    if (data.amount <= 0) {
      throw new ValidationError('المبلغ يجب أن يكون أكبر من صفر');
    }

    if (!data.description || data.description.trim().length < 3) {
      throw new ValidationError('يجب إدخال وصف للمصروف');
    }

    // إنشاء المصروف
    const expense = await this.db.expenses.create({
      shift_id: data.shift_id,
      category: data.category,
      amount: data.amount,
      description: data.description,
      receipt_number: data.receipt_number,
      recorded_by: userId,
      created_at: new Date()
    });

    // تسجيل في Audit Log
    await this.auditLog.log({
      user_id: userId,
      action: 'CREATE_EXPENSE',
      table_name: 'expenses',
      record_id: expense.id,
      new_values: JSON.stringify(expense)
    });

    return expense;
  }

  async getExpensesByShift(shiftId: number): Promise<Expense[]> {
    return await this.db.expenses.findMany({ shift_id: shiftId });
  }

  async getExpensesByDateRange(from: Date, to: Date): Promise<Expense[]> {
    return await this.db.expenses.query(`
      SELECT * FROM expenses
      WHERE created_at >= ? AND created_at <= ?
      ORDER BY created_at DESC
    `, [from, to]);
  }

  async updateExpense(
    id: number,
    data: UpdateExpenseData,
    userId: number
  ): Promise<Expense> {
    // التحقق من الصلاحيات
    const user = await this.db.users.findById(userId);
    if (user.role !== 'admin') {
      throw new AuthorizationError('فقط المدير يمكنه تعديل المصاريف');
    }

    const expense = await this.db.expenses.findById(id);
    if (!expense) {
      throw new NotFoundError('المصروف');
    }

    const updatedExpense = await this.db.expenses.update(id, data);

    // تسجيل في Audit Log
    await this.auditLog.log({
      user_id: userId,
      action: 'UPDATE_EXPENSE',
      table_name: 'expenses',
      record_id: id,
      old_values: JSON.stringify(expense),
      new_values: JSON.stringify(updatedExpense)
    });

    return updatedExpense;
  }

  async deleteExpense(id: number, userId: number): Promise<void> {
    // التحقق من الصلاحيات
    const user = await this.db.users.findById(userId);
    if (user.role !== 'admin') {
      throw new AuthorizationError('فقط المدير يمكنه حذف المصاريف');
    }

    const expense = await this.db.expenses.findById(id);
    if (!expense) {
      throw new NotFoundError('المصروف');
    }

    await this.db.expenses.delete(id);

    // تسجيل في Audit Log
    await this.auditLog.log({
      user_id: userId,
      action: 'DELETE_EXPENSE',
      table_name: 'expenses',
      record_id: id,
      old_values: JSON.stringify(expense)
    });
  }
}
```

---

### 6. تسجيل المشتريات (Purchases)

#### 6.1 نموذج المشتريات

```typescript
interface Purchase {
  id: number;
  supplier_name: string;
  total_amount: number;
  payment_status: 'paid' | 'pending';
  invoice_number?: string;
  notes?: string;
  recorded_by: number;
  created_at: Date;
}

interface PurchaseItem {
  id: number;
  purchase_id: number;
  item_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}
```

#### 6.2 واجهة تسجيل المشتريات

```
+--------------------------------------------------+
|            تسجيل مشتريات جديدة                    |
+--------------------------------------------------+
|                                                  |
|  اسم المورّد: [__________________] *             |
|                                                  |
|  رقم الفاتورة: [__________]                      |
|                                                  |
|  ───────────────────────────────────────────     |
|  الأصناف:                                        |
|                                                  |
|  | الصنف         | الكمية | السعر | المجموع    |  |
|  | دجاج          | 20 كجم | 15    | 300.00   |  |
|  | لحم           | 10 كجم | 25    | 250.00   |  |
|  | خبز           | 100    | 0.5   | 50.00    |  |
|                                                  |
|  [+ إضافة صنف]                                   |
|                                                  |
|  ───────────────────────────────────────────     |
|                                                  |
|  الإجمالي:                          600.00 ريال |
|                                                  |
|  حالة الدفع:                                     |
|    ● مدفوع                                       |
|    ○ معلق                                        |
|                                                  |
|  ملاحظات: [____________________________]        |
|                                                  |
|  [إلغاء]                         [حفظ]           |
|                                                  |
+--------------------------------------------------+
```

---

### 7. التقارير (Reports)

#### 7.1 أنواع التقارير

```typescript
enum ReportType {
  DAILY = 'daily',              // تقرير يومي
  SHIFT = 'shift',              // تقرير وردية
  PERIOD = 'period',            // تقرير فترة
  FINANCIAL = 'financial',      // تقرير مالي
  SALES = 'sales',              // تقرير مبيعات
  EXPENSES = 'expenses',        // تقرير مصاريف
  AUDIT = 'audit'               // تقرير تدقيق
}

interface ReportParams {
  type: ReportType;
  from_date?: Date;
  to_date?: Date;
  shift_id?: number;
  format?: 'pdf' | 'excel' | 'json';
}
```

#### 7.2 واجهة التقارير

```
+--------------------------------------------------------------------+
|                           التقارير                                 |
+--------------------------------------------------------------------+
|                                                                    |
|  نوع التقرير: [يومي ▼]     الفترة: من [____] إلى [____]           |
|                                                                    |
|  [عرض التقرير]  [تصدير PDF]  [تصدير Excel]                        |
|                                                                    |
|  ───────────────────────────────────────────────────────────       |
|                                                                    |
|  📊 ملخص الفترة: 2024-01-01 إلى 2024-01-31                        |
|                                                                    |
|  المبيعات:                                                         |
|    عدد الطلبات:           1,250 طلب                               |
|    إجمالي المبيعات:       38,500.00 ريال                          |
|    متوسط الطلب:           30.80 ريال                              |
|                                                                    |
|  المصاريف:                                                         |
|    إجمالي المصاريف:       12,300.00 ريال                          |
|    - مواد خام:            8,500.00 ريال                           |
|    - خدمات:               1,200.00 ريال                           |
|    - رواتب:               2,000.00 ريال                           |
|    - صيانة:               400.00 ريال                             |
|    - أخرى:                200.00 ريال                             |
|                                                                    |
|  الصافي:                  26,200.00 ريال                          |
|                                                                    |
|  ───────────────────────────────────────────────────────────       |
|                                                                    |
|  التفاصيل اليومية:                                                |
|                                                                    |
|  التاريخ     | المبيعات  | المصاريف | الصافي   | الفروقات          |
|  ─────────────────────────────────────────────────────────────    |
|  01/01      | 1,250.00 | 450.00  | 800.00  | +5.00             |
|  02/01      | 1,100.00 | 380.00  | 720.00  | -10.00            |
|  03/01      | 1,350.00 | 420.00  | 930.00  | 0.00              |
|  ...                                                              |
|                                                                    |
+--------------------------------------------------------------------+
```

#### 7.3 Report Service

```typescript
// src/main/services/report.service.ts
export class ReportService {
  async generateReport(params: ReportParams): Promise<Report> {
    switch (params.type) {
      case 'daily':
        return await this.generateDailyReport(params.from_date);

      case 'shift':
        return await this.generateShiftReport(params.shift_id);

      case 'period':
        return await this.generatePeriodReport(params.from_date, params.to_date);

      case 'financial':
        return await this.generateFinancialReport(params.from_date, params.to_date);

      case 'sales':
        return await this.generateSalesReport(params.from_date, params.to_date);

      case 'expenses':
        return await this.generateExpensesReport(params.from_date, params.to_date);

      default:
        throw new ValidationError('نوع تقرير غير صحيح');
    }
  }

  private async generateDailyReport(date: Date): Promise<DailyReport> {
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    // الورديات
    const shifts = await this.db.shifts.query(`
      SELECT * FROM shifts
      WHERE opened_at >= ? AND opened_at <= ?
    `, [startOfDay, endOfDay]);

    let totalSales = 0;
    let totalExpenses = 0;
    let totalOrders = 0;

    for (const shift of shifts) {
      const orders = await this.db.orders.findMany({ shift_id: shift.id });
      const expenses = await this.db.expenses.findMany({ shift_id: shift.id });

      totalSales += orders.reduce((sum, o) => sum + o.total_amount, 0);
      totalExpenses += expenses.reduce((sum, e) => sum + e.amount, 0);
      totalOrders += orders.length;
    }

    return {
      date,
      shifts,
      totalOrders,
      totalSales,
      totalExpenses,
      net: totalSales - totalExpenses
    };
  }

  private async generatePeriodReport(
    fromDate: Date,
    toDate: Date
  ): Promise<PeriodReport> {
    const shifts = await this.db.shifts.query(`
      SELECT * FROM shifts
      WHERE opened_at >= ? AND opened_at <= ?
      ORDER BY opened_at
    `, [fromDate, toDate]);

    const dailyData = [];
    let totalSales = 0;
    let totalExpenses = 0;
    let totalOrders = 0;

    // تجميع البيانات حسب اليوم
    const dayMap = new Map<string, DailyData>();

    for (const shift of shifts) {
      const dayKey = format(shift.opened_at, 'yyyy-MM-dd');

      if (!dayMap.has(dayKey)) {
        dayMap.set(dayKey, {
          date: dayKey,
          sales: 0,
          expenses: 0,
          orders: 0,
          net: 0
        });
      }

      const dayData = dayMap.get(dayKey);
      const orders = await this.db.orders.findMany({ shift_id: shift.id });
      const expenses = await this.db.expenses.findMany({ shift_id: shift.id });

      const shiftSales = orders.reduce((sum, o) => sum + o.total_amount, 0);
      const shiftExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

      dayData.sales += shiftSales;
      dayData.expenses += shiftExpenses;
      dayData.orders += orders.length;
      dayData.net = dayData.sales - dayData.expenses;

      totalSales += shiftSales;
      totalExpenses += shiftExpenses;
      totalOrders += orders.length;
    }

    return {
      from_date: fromDate,
      to_date: toDate,
      daily_data: Array.from(dayMap.values()),
      total_sales: totalSales,
      total_expenses: totalExpenses,
      total_orders: totalOrders,
      net: totalSales - totalExpenses
    };
  }
}
```

#### 7.4 تصدير PDF

```typescript
// src/main/services/pdf-export.service.ts
import PDFDocument from 'pdfkit';
import fs from 'fs';

export class PDFExportService {
  async exportReport(report: Report, filename: string): Promise<string> {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const outputPath = path.join(app.getPath('downloads'), filename);

    doc.pipe(fs.createWriteStream(outputPath));

    // Header
    doc
      .font('path/to/arabic/font.ttf')
      .fontSize(20)
      .text('مطعم الشاورما', { align: 'center' });

    doc
      .fontSize(16)
      .text(`تقرير ${report.type}`, { align: 'center' })
      .moveDown();

    // المحتوى حسب نوع التقرير
    if (report.type === 'period') {
      this.renderPeriodReport(doc, report);
    }

    doc.end();

    return outputPath;
  }

  private renderPeriodReport(doc: PDFKit.PDFDocument, report: PeriodReport) {
    // العنوان
    doc
      .fontSize(12)
      .text(`الفترة: من ${formatDate(report.from_date)} إلى ${formatDate(report.to_date)}`)
      .moveDown();

    // الملخص
    doc
      .fontSize(14)
      .text('الملخص:', { underline: true })
      .moveDown(0.5);

    doc
      .fontSize(12)
      .text(`إجمالي المبيعات: ${formatCurrency(report.total_sales)}`)
      .text(`إجمالي المصاريف: ${formatCurrency(report.total_expenses)}`)
      .text(`الصافي: ${formatCurrency(report.net)}`)
      .moveDown();

    // الجدول
    // ... رسم الجدول
  }
}
```

#### 7.5 تصدير Excel

```typescript
// src/main/services/excel-export.service.ts
import ExcelJS from 'exceljs';

export class ExcelExportService {
  async exportReport(report: Report, filename: string): Promise<string> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('التقرير');

    // العنوان
    worksheet.addRow(['مطعم الشاورما']);
    worksheet.addRow([`تقرير ${report.type}`]);
    worksheet.addRow([]);

    // المحتوى
    if (report.type === 'period') {
      this.renderPeriodReport(worksheet, report);
    }

    // حفظ الملف
    const outputPath = path.join(app.getPath('downloads'), filename);
    await workbook.xlsx.writeFile(outputPath);

    return outputPath;
  }

  private renderPeriodReport(worksheet: ExcelJS.Worksheet, report: PeriodReport) {
    // Headers
    worksheet.addRow(['التاريخ', 'المبيعات', 'المصاريف', 'الصافي']);

    // البيانات
    for (const day of report.daily_data) {
      worksheet.addRow([
        day.date,
        day.sales,
        day.expenses,
        day.net
      ]);
    }

    // الإجمالي
    worksheet.addRow([]);
    worksheet.addRow([
      'الإجمالي',
      report.total_sales,
      report.total_expenses,
      report.net
    ]);

    // تنسيق
    worksheet.getRow(4).font = { bold: true };
  }
}
```

---

## ✅ المخرجات النهائية

### 1. رقابة مالية كاملة
- [✓] حساب الرصيد المتوقع تلقائياً
- [✓] تسجيل الفروقات المالية
- [✓] إلزام بتوضيح سبب الفرق
- [✓] موافقة المدير على الإغلاق

### 2. سجل تدقيق شامل
- [✓] تسجيل جميع العمليات
- [✓] تتبع التغييرات
- [✓] تحديد المسؤول عن كل عملية

### 3. إدارة المصاريف
- [✓] تسجيل المصاريف
- [✓] تصنيف المصاريف
- [✓] ربط المصاريف بالورديات

### 4. تقارير شاملة
- [✓] تقارير يومية وفترية
- [✓] تصدير PDF و Excel
- [✓] تقارير قابلة للتصفية

### 5. التعافي من الأخطاء
- [✓] حفظ تلقائي
- [✓] استرجاع البيانات
- [✓] نسخ احتياطي

---

## 📊 معايير القبول (Acceptance Criteria)

- [ ] يتم حساب الرصيد المتوقع بدقة
- [ ] لا يمكن إغلاق وردية بفرق بدون سبب
- [ ] جميع العمليات مسجلة في Audit Log
- [ ] يمكن إنشاء وتصدير التقارير بنجاح
- [ ] المصاريف مربوطة بالورديات
- [ ] التعافي من انقطاع الكهرباء يعمل

---

## 🔗 الانتقال للمرحلة التالية
بعد إكمال هذه المرحلة، ننتقل إلى:
👉 **Phase 5 - Optimization & Expansion**
