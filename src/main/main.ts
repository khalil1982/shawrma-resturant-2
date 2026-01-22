import { app, BrowserWindow } from 'electron';
import path from 'path';
import { DatabaseService } from './database/database.service';
import { registerIpcHandlers } from './ipc/index';

let mainWindow: BrowserWindow | null = null;
let dbService: DatabaseService | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    title: 'نظام إدارة مطعم الشاورما',
    show: false
  });

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

async function initializeApp() {
  try {
    // Initialize database
    dbService = new DatabaseService(app.getPath('userData'));
    await dbService.initialize();

    console.log('Database initialized successfully');

    // Register IPC handlers
    registerIpcHandlers(dbService);

    console.log('IPC handlers registered');
  } catch (error) {
    console.error('Failed to initialize app:', error);
    app.quit();
  }
}

app.on('ready', async () => {
  await initializeApp();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('will-quit', () => {
  // Cleanup
  if (dbService) {
    dbService.close();
  }
});
