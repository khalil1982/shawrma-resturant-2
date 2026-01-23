/**
 * الثوابت المستخدمة في التطبيق
 */

// ==================== حالات الوردية ====================
const SHIFT_STATES = {
  OPEN: "open",
  ACTIVE: "active",
  CLOSED: "closed",
};

const SHIFT_TYPES = {
  MORNING: "morning",
  EVENING: "evening",
};

// ==================== حالات الطلب ====================
const ORDER_STATUS = {
  PENDING: "pending",
  PREPARING: "preparing",
  READY: "ready",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

const ORDER_TYPES = {
  DINE_IN: "dine_in",
  TAKEAWAY: "takeaway",
  DELIVERY: "delivery",
};

// ==================== طرق الدفع ====================
const PAYMENT_METHODS = {
  CASH: "cash",
  CARD: "card",
  SPLIT: "split",
};

// ==================== أنواع الخصم ====================
const DISCOUNT_TYPES = {
  PERCENT: "percent",
  FIXED: "fixed",
};

// ==================== فئات المصاريف ====================
const EXPENSE_CATEGORIES = [
  { value: "meat", label: "لحوم", icon: "🥩" },
  { value: "vegetables", label: "خضروات", icon: "🥬" },
  { value: "electricity", label: "كهرباء", icon: "⚡" },
  { value: "gas", label: "غاز", icon: "🔥" },
  { value: "water", label: "ماء", icon: "💧" },
  { value: "maintenance", label: "صيانة", icon: "🔧" },
  { value: "salaries", label: "رواتب", icon: "💰" },
  { value: "rent", label: "إيجار", icon: "🏠" },
  { value: "other", label: "أخرى", icon: "📦" },
];

// ==================== أنواع حركات النقد ====================
const CASH_MOVEMENT_TYPES = {
  DEPOSIT: "deposit",
  WITHDRAWAL: "withdrawal",
  ADJUSTMENT: "adjustment",
};

// ==================== أنواع الفروقات ====================
const VARIANCE_TYPES = {
  SHORTAGE: "shortage",
  OVERAGE: "overage",
  CORRECTION: "correction",
};

// ==================== أنواع الخيارات ====================
const OPTION_TYPES = {
  ADDON: "addon",
  SIZE: "size",
  MODIFIER: "modifier",
};

// ==================== أنواع النسخ الاحتياطي ====================
const BACKUP_TYPES = {
  MANUAL: "manual",
  AUTOMATIC: "automatic",
  SCHEDULED: "scheduled",
};

// ==================== أنواع القيم في الإعدادات ====================
const SETTING_VALUE_TYPES = {
  STRING: "string",
  NUMBER: "number",
  BOOLEAN: "boolean",
  JSON: "json",
};

// ==================== رسائل الخطأ ====================
const ERROR_MESSAGES = {
  // أخطاء المصادقة
  INVALID_CREDENTIALS: "اسم المستخدم أو كلمة المرور غير صحيحة",
  USER_NOT_FOUND: "المستخدم غير موجود",
  USER_INACTIVE: "الحساب غير نشط",
  USER_LOCKED: "الحساب مقفل مؤقتاً",
  SESSION_EXPIRED: "انتهت صلاحية الجلسة",
  UNAUTHORIZED: "غير مصرح لك بهذا الإجراء",

  // أخطاء الوردية
  NO_ACTIVE_SHIFT: "لا توجد وردية نشطة",
  SHIFT_ALREADY_ACTIVE: "يوجد وردية نشطة بالفعل",
  SHIFT_NOT_FOUND: "الوردية غير موجودة",
  CANNOT_CLOSE_SHIFT: "لا يمكن إغلاق الوردية",

  // أخطاء الطلبات
  ORDER_NOT_FOUND: "الطلب غير موجود",
  ORDER_ALREADY_COMPLETED: "الطلب مكتمل بالفعل",
  ORDER_ALREADY_CANCELLED: "الطلب ملغي بالفعل",
  CANNOT_MODIFY_ORDER: "لا يمكن تعديل الطلب",
  INVALID_ORDER_STATUS: "حالة الطلب غير صحيحة",

  // أخطاء القائمة
  MENU_ITEM_NOT_FOUND: "الصنف غير موجود",
  MENU_ITEM_UNAVAILABLE: "الصنف غير متوفر",
  CATEGORY_NOT_FOUND: "الفئة غير موجودة",

  // أخطاء المصاريف
  EXPENSE_NOT_FOUND: "المصروف غير موجود",
  INVALID_EXPENSE_AMOUNT: "مبلغ المصروف غير صحيح",

  // أخطاء عامة
  DATABASE_ERROR: "خطأ في قاعدة البيانات",
  VALIDATION_ERROR: "بيانات غير صحيحة",
  UNKNOWN_ERROR: "خطأ غير معروف",
  REQUIRED_FIELD: "هذا الحقل إلزامي",
};

// ==================== رسائل النجاح ====================
const SUCCESS_MESSAGES = {
  // نجاح المصادقة
  LOGIN_SUCCESS: "تم تسجيل الدخول بنجاح",
  LOGOUT_SUCCESS: "تم تسجيل الخروج بنجاح",

  // نجاح الوردية
  SHIFT_OPENED: "تم فتح الوردية بنجاح",
  SHIFT_CLOSED: "تم إغلاق الوردية بنجاح",

  // نجاح الطلبات
  ORDER_CREATED: "تم إنشاء الطلب بنجاح",
  ORDER_UPDATED: "تم تحديث الطلب بنجاح",
  ORDER_CANCELLED: "تم إلغاء الطلب بنجاح",
  ORDER_COMPLETED: "تم إتمام الطلب بنجاح",

  // نجاح القائمة
  MENU_ITEM_CREATED: "تم إضافة الصنف بنجاح",
  MENU_ITEM_UPDATED: "تم تحديث الصنف بنجاح",
  MENU_ITEM_DELETED: "تم حذف الصنف بنجاح",

  // نجاح المصاريف
  EXPENSE_CREATED: "تم إضافة المصروف بنجاح",
  EXPENSE_UPDATED: "تم تحديث المصروف بنجاح",
  EXPENSE_DELETED: "تم حذف المصروف بنجاح",

  // نجاح عام
  SAVE_SUCCESS: "تم الحفظ بنجاح",
  DELETE_SUCCESS: "تم الحذف بنجاح",
  UPDATE_SUCCESS: "تم التحديث بنجاح",
};

// ==================== قيم افتراضية ====================
const DEFAULTS = {
  TAX_RATE: 0.15,
  CURRENCY: "ر.س",
  LANGUAGE: "ar",
  DIRECTION: "rtl",
  PAGE_SIZE: 20,
  SESSION_TIMEOUT: 8 * 60 * 60 * 1000, // 8 ساعات
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 دقيقة
};

// ==================== قيود ====================
const LIMITS = {
  MAX_ORDER_ITEMS: 50,
  MAX_CASH_VARIANCE: 200,
  MIN_PASSWORD_LENGTH: 6,
  MAX_USERNAME_LENGTH: 50,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_NOTES_LENGTH: 1000,
};

// ==================== أنماط Regex ====================
const REGEX_PATTERNS = {
  PHONE: /^(05|5)\d{8}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  USERNAME: /^[a-zA-Z0-9_]{3,50}$/,
  PRICE: /^\d+(\.\d{1,2})?$/,
};

// ==================== تنسيقات التاريخ ====================
const DATE_FORMATS = {
  DISPLAY: "YYYY-MM-DD",
  DISPLAY_WITH_TIME: "YYYY-MM-DD HH:mm:ss",
  ARABIC_DATE: "DD/MM/YYYY",
  ARABIC_DATETIME: "DD/MM/YYYY الساعة HH:mm",
};

// ==================== أيقونات ====================
const ICONS = {
  SHIFT: "🕐",
  ORDER: "📋",
  MENU: "🍽️",
  EXPENSE: "💸",
  REPORT: "📊",
  USER: "👤",
  SETTINGS: "⚙️",
  SUCCESS: "✅",
  ERROR: "❌",
  WARNING: "⚠️",
  INFO: "ℹ️",
  CASH: "💵",
  CARD: "💳",
};

module.exports = {
  SHIFT_STATES,
  SHIFT_TYPES,
  ORDER_STATUS,
  ORDER_TYPES,
  PAYMENT_METHODS,
  DISCOUNT_TYPES,
  EXPENSE_CATEGORIES,
  CASH_MOVEMENT_TYPES,
  VARIANCE_TYPES,
  OPTION_TYPES,
  BACKUP_TYPES,
  SETTING_VALUE_TYPES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  DEFAULTS,
  LIMITS,
  REGEX_PATTERNS,
  DATE_FORMATS,
  ICONS,
};
