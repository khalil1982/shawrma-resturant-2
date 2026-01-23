const path = require("path");
const { app } = require("electron");

/**
 * التكوينات الأساسية للتطبيق
 */
const config = {
  // معلومات التطبيق
  app: {
    name: "Shawrma POS",
    version: "1.0.0",
    author: "Shawarma Restaurant",
  },

  // مسارات التطبيق
  paths: {
    // مسار قاعدة البيانات
    database: path.join(
      app ? app.getPath("userData") : "./",
      "shawrma-pos.db"
    ),
    // مسار السجلات
    logs: path.join(app ? app.getPath("userData") : "./", "logs"),
    // مسار البيانات
    data: path.join(app ? app.getPath("userData") : "./", "data"),
  },

  // إعدادات قاعدة البيانات
  database: {
    // حجم الكاش
    cacheSize: 10000,
    // تفعيل WAL mode للأداء الأفضل
    walMode: true,
    // مدة الانتظار للقفل (milliseconds)
    busyTimeout: 5000,
  },

  // إعدادات الأمان
  security: {
    // طول ملح كلمة المرور
    saltRounds: 10,
    // مدة صلاحية الجلسة (milliseconds)
    sessionTimeout: 8 * 60 * 60 * 1000, // 8 ساعات
    // عدد محاولات تسجيل الدخول الفاشلة
    maxLoginAttempts: 5,
    // مدة حظر الحساب بعد المحاولات الفاشلة (milliseconds)
    lockoutDuration: 15 * 60 * 1000, // 15 دقيقة
  },

  // إعدادات الوردية
  shift: {
    // أنواع الورديات المسموحة
    types: ["morning", "evening"],
    // الحد الأدنى للرصيد الافتتاحي
    minOpeningCash: 0,
    // الحد الأقصى للفرق المسموح (تحذير)
    maxCashDifferenceWarning: 50,
    // الحد الأقصى للفرق المسموح (خطأ)
    maxCashDifferenceError: 200,
  },

  // إعدادات الطلبات
  order: {
    // أنواع الطلبات المسموحة
    types: ["dine_in", "takeaway", "delivery"],
    // الحد الأدنى للمبلغ
    minAmount: 0,
    // معدل الضريبة (15%)
    taxRate: 0.15,
    // الحد الأقصى لعدد الأصناف في الطلب
    maxItemsPerOrder: 50,
  },

  // إعدادات المصاريف
  expense: {
    // أنواع المصاريف
    categories: [
      "لحوم",
      "خضروات",
      "كهرباء",
      "غاز",
      "ماء",
      "صيانة",
      "رواتب",
      "إيجار",
      "أخرى",
    ],
    // الحد الأقصى للمصروف بدون موافقة إضافية
    maxWithoutApproval: 1000,
  },

  // إعدادات التقارير
  reports: {
    // التنسيقات المدعومة
    formats: ["pdf", "excel", "csv"],
    // الحد الأقصى للصفوف في التقرير
    maxRows: 10000,
  },

  // إعدادات واجهة المستخدم
  ui: {
    // اللغة الافتراضية
    defaultLanguage: "ar",
    // الاتجاه الافتراضي
    direction: "rtl",
    // المظهر الافتراضي
    theme: "light",
    // تفعيل الوضع المظلم
    darkModeEnabled: false,
  },

  // إعدادات الأداء
  performance: {
    // تفعيل التخزين المؤقت
    enableCaching: true,
    // مدة التخزين المؤقت (milliseconds)
    cacheDuration: 5 * 60 * 1000, // 5 دقائق
    // تحميل كسول للصور
    lazyLoadImages: true,
  },

  // إعدادات التطوير
  development: {
    // تفعيل أدوات التطوير
    enableDevTools: process.env.NODE_ENV === "development",
    // تفعيل السجلات المفصلة
    verboseLogs: process.env.NODE_ENV === "development",
    // تفعيل التحديث التلقائي
    autoReload: process.env.NODE_ENV === "development",
  },

  // رسائل الخطأ
  errors: {
    // رسائل باللغة العربية
    messages: {
      database: "خطأ في قاعدة البيانات",
      authentication: "فشل تسجيل الدخول",
      authorization: "غير مصرح لك بهذا الإجراء",
      validation: "بيانات غير صحيحة",
      notFound: "العنصر غير موجود",
      alreadyExists: "العنصر موجود مسبقاً",
      network: "خطأ في الاتصال",
      unknown: "خطأ غير معروف",
    },
  },

  // إعدادات الحفظ الاحتياطي
  backup: {
    // تفعيل الحفظ الاحتياطي التلقائي
    autoBackup: true,
    // فترة الحفظ الاحتياطي (milliseconds)
    interval: 24 * 60 * 60 * 1000, // يومياً
    // عدد النسخ الاحتياطية المحفوظة
    keepCount: 7,
    // مسار النسخ الاحتياطية
    path: path.join(app ? app.getPath("userData") : "./", "backups"),
  },
};

module.exports = config;
