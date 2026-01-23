# Phase 1: قرارات UI/UX النهائية
## Shawarma Restaurant Management System - Design System

---

## 🎨 1. نظام الألوان (Color System)

### الألوان الأساسية (Primary Colors)

| اللون | الكود | الاستخدام |
|-------|-------|-----------|
| 🟠 **برتقالي دافئ** | `#D97706` | الأزرار الأساسية، العناوين الرئيسية |
| 🟤 **بني غامق** | `#78350F` | النصوص الثانوية، الحدود |
| ✅ **أخضر النجاح** | `#10B981` | رسائل النجاح، الحالات الإيجابية |
| ❌ **أحمر التحذير** | `#EF4444` | رسائل الخطأ، التحذيرات، الحذف |
| 🔵 **أزرق المعلومات** | `#3B82F6` | المعلومات، الإشعارات |
| 🟡 **أصفر التنبيه** | `#F59E0B` | التنبيهات، الفروقات المالية |

### ألوان الخلفية (Background Colors)

| اللون | الكود | الاستخدام |
|-------|-------|-----------|
| 🤍 **خلفية رئيسية** | `#FFFBEB` | خلفية التطبيق الأساسية (كريمي دافئ) |
| ⬜ **خلفية الكروت** | `#FFFFFF` | الكروت والبطاقات |
| 🔳 **خلفية ثانوية** | `#FEF3C7` | الأقسام المميزة |
| 🔲 **خلفية معطلة** | `#F3F4F6` | العناصر المعطلة |

### ألوان النصوص (Text Colors)

| اللون | الكود | الاستخدام |
|-------|-------|-----------|
| ⬛ **نص أساسي** | `#1F2937` | النصوص الرئيسية |
| 🔳 **نص ثانوي** | `#6B7280` | النصوص الثانوية، الوصف |
| ⬜ **نص على خلفية داكنة** | `#FFFFFF` | النصوص على الأزرار الملونة |
| 🟠 **نص مميز** | `#D97706` | الأرقام المهمة، الإجماليات |

---

## 🔤 2. الخطوط (Typography)

### عائلة الخطوط

**الأولوية:**
1. **Cairo** - الخيار الأول (حديث ونظيف)
2. **Tajawal** - الخيار البديل
3. **Segoe UI** - احتياطي
4. **Tahoma** - احتياطي نهائي

### أحجام الخطوط

| العنصر | الحجم | الوزن | الاستخدام |
|--------|-------|-------|-----------|
| **H1** | `32px` | Bold (700) | عناوين الصفحات الرئيسية |
| **H2** | `24px` | SemiBold (600) | عناوين الأقسام |
| **H3** | `20px` | SemiBold (600) | عناوين فرعية |
| **Body** | `16px` | Regular (400) | النصوص العادية |
| **Body Large** | `18px` | Regular (400) | النصوص المميزة |
| **Button** | `18px` | SemiBold (600) | نصوص الأزرار |
| **Small** | `14px` | Regular (400) | النصوص الصغيرة، التلميحات |
| **Price** | `24px` | Bold (700) | الأسعار والإجماليات |

### التباعد بين الأسطر (Line Height)

- **العناوين**: `1.2`
- **النصوص**: `1.6`
- **الأزرار**: `1.4`

---

## 📐 3. المسافات والتباعد (Spacing)

### نظام المسافات (8-Point Grid)

```
4px   - xs  (تباعد صغير جداً)
8px   - sm  (تباعد صغير)
16px  - md  (تباعد متوسط) - الأساسي
24px  - lg  (تباعد كبير)
32px  - xl  (تباعد كبير جداً)
48px  - 2xl (تباعد ضخم)
64px  - 3xl (تباعد ضخم جداً)
```

### تطبيق المسافات

| العنصر | Padding | Margin |
|--------|---------|--------|
| **الكروت (Cards)** | `24px` | `16px` |
| **الأزرار (Buttons)** | `12px 24px` | `8px` |
| **حقول الإدخال (Inputs)** | `12px 16px` | `8px 0` |
| **الأقسام (Sections)** | `32px` | `24px` |

---

## 🔲 4. الحدود والظلال (Borders & Shadows)

### الحدود (Borders)

| النوع | القيمة | الاستخدام |
|-------|--------|-----------|
| **رفيع** | `1px solid #E5E7EB` | الحدود العادية |
| **متوسط** | `2px solid #D97706` | الحدود المميزة |
| **سميك** | `3px solid #D97706` | العناصر النشطة |

### استدارة الزوايا (Border Radius)

| العنصر | القيمة |
|--------|--------|
| **الكروت** | `12px` |
| **الأزرار** | `8px` |
| **حقول الإدخال** | `6px` |
| **العناصر الصغيرة** | `4px` |
| **دائري كامل** | `50%` |

### الظلال (Box Shadows)

```css
/* ظل خفيف */
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

/* ظل متوسط */
box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

/* ظل بارز */
box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);

/* ظل عند التحويم (Hover) */
box-shadow: 0 4px 12px rgba(217, 119, 6, 0.2);
```

---

## 🎯 5. الأزرار (Buttons)

### أنواع الأزرار

#### **Primary Button** (الزر الأساسي)
```css
background: #D97706
color: #FFFFFF
padding: 12px 24px
border-radius: 8px
font-size: 18px
font-weight: 600
```

**الاستخدام**: الإجراءات الأساسية (تأكيد، حفظ، إنشاء)

#### **Secondary Button** (الزر الثانوي)
```css
background: transparent
color: #D97706
border: 2px solid #D97706
padding: 12px 24px
```

**الاستخدام**: الإجراءات الثانوية (إلغاء، رجوع)

#### **Danger Button** (زر الخطر)
```css
background: #EF4444
color: #FFFFFF
padding: 12px 24px
```

**الاستخدام**: الإجراءات الخطرة (حذف، إغلاق نهائي)

#### **Success Button** (زر النجاح)
```css
background: #10B981
color: #FFFFFF
padding: 12px 24px
```

**الاستخدام**: إتمام عمليات ناجحة

#### **Ghost Button** (زر شفاف)
```css
background: transparent
color: #6B7280
border: none
padding: 8px 16px
```

**الاستخدام**: إجراءات خفيفة (تحديث، معاينة)

### حالات الأزرار (Button States)

| الحالة | التأثير |
|--------|---------|
| **Default** | اللون الأساسي |
| **Hover** | تفتيح 10% + ظل خفيف |
| **Active** | تغميق 10% |
| **Disabled** | شفافية 50% + cursor: not-allowed |
| **Loading** | دوران أيقونة + نص "جاري..." |

---

## 📝 6. حقول الإدخال (Input Fields)

### التصميم الأساسي

```css
background: #FFFFFF
border: 1px solid #D1D5DB
border-radius: 6px
padding: 12px 16px
font-size: 16px
color: #1F2937
```

### الحالات (States)

| الحالة | التأثير |
|--------|---------|
| **Focus** | `border: 2px solid #D97706` + outline none |
| **Error** | `border: 2px solid #EF4444` + رسالة خطأ حمراء |
| **Success** | `border: 2px solid #10B981` + علامة صح |
| **Disabled** | `background: #F3F4F6` + `opacity: 0.6` |

### الأنواع

- **Text Input**: نص عادي
- **Number Input**: أرقام فقط مع أزرار ± (لليسار في RTL)
- **Select Dropdown**: قائمة منسدلة مع سهم للأسفل (يسار في RTL)
- **Textarea**: نص متعدد الأسطر
- **Date Picker**: تقويم منبثق

---

## 📦 7. الكروت (Cards)

### التصميم الأساسي

```css
background: #FFFFFF
border-radius: 12px
padding: 24px
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1)
border: 1px solid #E5E7EB
```

### أنواع الكروت

#### **كارت عادي**
- بدون تمييز خاص

#### **كارت مميز**
```css
border-left: 4px solid #D97706  /* في RTL: border-right */
```

#### **كارت نشط**
```css
border: 2px solid #D97706
box-shadow: 0 4px 12px rgba(217, 119, 6, 0.15)
```

#### **كارت تحذير**
```css
background: #FEF3C7
border-left: 4px solid #F59E0B
```

---

## 🎭 8. التفاعلات والحركة (Interactions & Animations)

### التحويلات (Transitions)

```css
/* سريع - للأزرار والروابط */
transition: all 0.15s ease

/* متوسط - للكروت والعناصر */
transition: all 0.2s ease

/* بطيء - للقوائم والانزلاق */
transition: all 0.3s ease
```

### الحركات (Animations)

#### **Fade In** (ظهور تدريجي)
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
animation: fadeIn 0.3s ease;
```

#### **Slide In** (انزلاق من اليمين في RTL)
```css
@keyframes slideIn {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}
```

#### **Pulse** (نبض للإشعارات)
```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

---

## 🌐 9. دعم RTL (Right-to-Left Support)

### القواعد الأساسية

```css
html[dir="rtl"] {
  direction: rtl;
  text-align: right;
}

/* عكس الهوامش */
html[dir="rtl"] .margin-left-16 {
  margin-right: 16px;
  margin-left: 0;
}

/* عكس الحدود */
html[dir="rtl"] .border-left {
  border-right: 4px solid;
  border-left: none;
}
```

### الأيقونات والرموز

- السهم الأيسر ← يصبح سهم أيمن →
- علامات الترتيب تنعكس
- القوائم المنسدلة تفتح من اليمين

---

## 📱 10. الاستجابة (Responsive Design)

### نقاط القطع (Breakpoints)

```css
/* Extra Small */
@media (max-width: 640px) { }

/* Small */
@media (min-width: 641px) and (max-width: 768px) { }

/* Medium */
@media (min-width: 769px) and (max-width: 1024px) { }

/* Large */
@media (min-width: 1025px) { }
```

### التكيف

| الشاشة | التخطيط |
|--------|---------|
| **موبايل** | عمود واحد، قوائم كاملة العرض |
| **تابلت** | عمودين، قوائم جانبية |
| **ديسكتوب** | ثلاثة أعمدة (أصناف / طلب / ملخص) |

---

## 🎨 11. الأيقونات (Icons)

### المواصفات

- **الحجم الأساسي**: 24px × 24px
- **الحجم الصغير**: 16px × 16px
- **الحجم الكبير**: 32px × 32px
- **السُمك**: 2px stroke
- **اللون**: يتبع لون النص أو اللون الأساسي

### المصادر المقترحة

- **Heroicons** (مفضل)
- **Feather Icons**
- **Material Icons**

### الاستخدام

```html
<!-- داخل زر -->
<button>
  <svg>...</svg>
  <span>إضافة طلب</span>
</button>

<!-- مستقل -->
<svg class="icon icon-warning">...</svg>
```

---

## 📊 12. الجداول (Tables)

### التصميم الأساسي

```css
table {
  width: 100%;
  border-collapse: collapse;
}

th {
  background: #F3F4F6;
  padding: 12px 16px;
  text-align: right;  /* RTL */
  font-weight: 600;
  border-bottom: 2px solid #D97706;
}

td {
  padding: 12px 16px;
  border-bottom: 1px solid #E5E7EB;
}

tr:hover {
  background: #FFFBEB;
}
```

---

## 🔔 13. الإشعارات والتنبيهات (Notifications & Alerts)

### أنواع الإشعارات

#### **Success** (نجاح)
```css
background: #D1FAE5
border-left: 4px solid #10B981  /* RTL: border-right */
color: #065F46
```

#### **Error** (خطأ)
```css
background: #FEE2E2
border-left: 4px solid #EF4444
color: #991B1B
```

#### **Warning** (تحذير)
```css
background: #FEF3C7
border-left: 4px solid #F59E0B
color: #92400E
```

#### **Info** (معلومات)
```css
background: #DBEAFE
border-left: 4px solid #3B82F6
color: #1E40AF
```

### الموضع

- **أعلى الشاشة**: للإشعارات العامة
- **داخل النموذج**: لأخطاء الحقول
- **منبثقة (Toast)**: في الزاوية العلوية اليمنى (RTL)

---

## ⚙️ 14. القوائم المنسدلة (Dropdowns & Modals)

### القائمة المنسدلة

```css
.dropdown {
  background: #FFFFFF;
  border: 1px solid #D1D5DB;
  border-radius: 8px;
  box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
  min-width: 200px;
}

.dropdown-item {
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.15s;
}

.dropdown-item:hover {
  background: #FFFBEB;
}
```

### النوافذ المنبثقة (Modals)

```css
.modal-overlay {
  background: rgba(0, 0, 0, 0.5);
  position: fixed;
  inset: 0;
}

.modal {
  background: #FFFFFF;
  border-radius: 12px;
  max-width: 600px;
  padding: 32px;
  box-shadow: 0 20px 25px rgba(0, 0, 0, 0.15);
}
```

---

## ✅ 15. حالات التحميل (Loading States)

### Spinner (دوّار)

```css
.spinner {
  border: 3px solid #F3F4F6;
  border-top: 3px solid #D97706;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

### Skeleton (هيكل تحميل)

```css
.skeleton {
  background: linear-gradient(
    90deg,
    #F3F4F6 25%,
    #E5E7EB 50%,
    #F3F4F6 75%
  );
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

@keyframes loading {
  to { background-position: -200% 0; }
}
```

---

## 📋 16. النماذج (Forms)

### تخطيط النموذج

```
┌─────────────────────────────────┐
│  عنوان النموذج                 │
├─────────────────────────────────┤
│                                 │
│  التسمية                        │
│  ┌───────────────────────────┐  │
│  │ حقل الإدخال               │  │
│  └───────────────────────────┘  │
│  تلميح أو رسالة خطأ            │
│                                 │
│  التسمية الثانية               │
│  ┌───────────────────────────┐  │
│  │ حقل الإدخال               │  │
│  └───────────────────────────┘  │
│                                 │
│  [إلغاء]        [حفظ]  ✓       │
│                                 │
└─────────────────────────────────┘
```

### القواعد

- **التسميات**: فوق الحقل، بخط 14px
- **الحقول**: عرض كامل أو 50% حسب الحاجة
- **رسائل الخطأ**: أسفل الحقل، بالأحمر، 14px
- **الأزرار**: في الأسفل، يمين (حفظ) يسار (إلغاء) في RTL

---

## 🎯 17. معايير إمكانية الوصول (Accessibility)

### التباين (Contrast)

- نسبة التباين: **4.5:1** كحد أدنى للنصوص العادية
- نسبة التباين: **3:1** للنصوص الكبيرة

### لوحة المفاتيح (Keyboard Navigation)

- **Tab**: الانتقال بين العناصر
- **Enter**: تأكيد/اختيار
- **Esc**: إغلاق القوائم المنبثقة
- **Space**: تحديد Checkbox

### قارئات الشاشة (Screen Readers)

```html
<button aria-label="إضافة طلب جديد">
  <svg>...</svg>
</button>

<input aria-describedby="error-msg" />
<span id="error-msg">حقل إلزامي</span>
```

---

## 🔒 18. حالات الخطأ والنجاح

### رسالة خطأ في الحقل

```html
<div class="form-group">
  <label>اسم المستخدم</label>
  <input class="error" />
  <span class="error-message">
    ⚠️ اسم المستخدم مطلوب
  </span>
</div>
```

### رسالة نجاح

```html
<div class="alert alert-success">
  ✅ تم حفظ البيانات بنجاح
</div>
```

---

## 📖 19. ملخص القرارات النهائية

✅ **الألوان**: برتقالي دافئ كلون أساسي، خلفية كريمي فاتح
✅ **الخطوط**: Cairo كخط رئيسي، أحجام من 14px إلى 32px
✅ **المسافات**: نظام 8px grid
✅ **الحدود**: استدارة 6px-12px حسب العنصر
✅ **RTL**: دعم كامل من اليمين لليسار
✅ **التفاعل**: transitions سلسة 0.15s-0.3s
✅ **الاستجابة**: تصميم متجاوب كامل
✅ **إمكانية الوصول**: تباين عالي، دعم لوحة المفاتيح

---

## 🚀 جاهز للتنفيذ

هذه الوثيقة تمثل **الدليل المرجعي الكامل** لجميع قرارات UI/UX.
يجب على جميع المطورين الالتزام بهذه المعايير عند التطوير.

**Phase 1 مكتمل ✅**
**جاهز للانتقال إلى Phase 2: Foundation & Architecture**
