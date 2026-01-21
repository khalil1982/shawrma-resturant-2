const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { initializeFullSchema } = require("../data/fullSchema");
const { registerAuthIpc } = require("./ipc/auth-ipc");
const { registerShiftIpc } = require("./ipc/shift-ipc");
const { registerOrderIpc } = require("./ipc/order-ipc");

let mainWindow = null;

/**
 * إنشاء النافذة الرئيسية
 */
const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    backgroundColor: "#FFFBEB",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: process.env.NODE_ENV === "development",
    },
    show: false, // لا تظهر النافذة حتى تكون جاهزة
  });

  // تحميل الواجهة
  mainWindow.loadFile(path.join(__dirname, "..", "renderer", "index.html"));

  // إظهار النافذة عندما تكون جاهزة
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  // فتح أدوات التطوير في وضع التطوير
  if (process.env.NODE_ENV === "development") {
    mainWindow.webContents.openDevTools();
  }

  // عند إغلاق النافذة
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
};

/**
 * تهيئة التطبيق
 */
app.whenReady().then(async () => {
  try {
    console.log("🚀 بدء تشغيل التطبيق...");

    // تهيئة قاعدة البيانات
    console.log("📦 تهيئة قاعدة البيانات...");
    await initializeFullSchema();

    // تسجيل IPC handlers
    console.log("🔌 تسجيل IPC handlers...");
    registerAuthIpc();
    registerShiftIpc();
    registerOrderIpc();

    // إنشاء النافذة
    console.log("🖥️  إنشاء النافذة الرئيسية...");
    createWindow();

    console.log("✅ تم تشغيل التطبيق بنجاح");
  } catch (error) {
    console.error("❌ خطأ في تشغيل التطبيق:", error);
    app.quit();
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

/**
 * عند إغلاق جميع النوافذ
 */
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

/**
 * قبل الإنهاء
 */
app.on("before-quit", () => {
  console.log("👋 إنهاء التطبيق...");
});

/**
 * معالجة الأخطاء العامة
 */
process.on("uncaughtException", (error) => {
  console.error("❌ خطأ غير متوقع:", error);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ رفض غير معالج:", reason);
});
