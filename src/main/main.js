const { app, BrowserWindow, Menu } = require("electron");
const path = require("path");
const { initializeSchema } = require("../data/schema");
const { initializePhase2Schema } = require("../data/phase2Schema");
const { registerAuthIpc } = require("./ipc/auth-ipc");
const { registerShiftIpc } = require("./ipc/shift-ipc");
const { registerOrderIpc } = require("./ipc/order-ipc");

let mainWindow = null;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 700,
    fullscreen: true,
    kiosk: true,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  Menu.setApplicationMenu(null);
  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadFile(path.join(__dirname, "..", "renderer", "index.html"));
};

app.whenReady().then(async () => {
  await initializeSchema();
  await initializePhase2Schema();
  registerAuthIpc();
  registerShiftIpc();
  registerOrderIpc();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
