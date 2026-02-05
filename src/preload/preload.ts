import { contextBridge, ipcRenderer } from 'electron';

// API types
export interface ElectronAPI {
  // Auth
  login: (username: string, password: string) => Promise<any>;
  logout: () => Promise<void>;

  // Shifts
  getCurrentShift: () => Promise<any>;
  getShiftSummary?: (shiftId: number) => Promise<any>;
  openShift: (data: any) => Promise<any>;
  closeShift: (data: any) => Promise<any>;

  // Orders
  createOrder: (data: any) => Promise<any>;
  getOrders: (filters?: any) => Promise<any>;

  // Items
  getItems: () => Promise<any>;
  getCategories: () => Promise<any>;

  // Expenses
  createExpense: (data: any) => Promise<any>;
  getExpenses: (filters?: any) => Promise<any>;

  // Reports
  generateReport: (params: any) => Promise<any>;

  // Settings
  getSettings: () => Promise<any>;
  updateSettings: (settings: any) => Promise<any>;
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
const api: ElectronAPI = {
  // Auth
  login: (username: string, password: string) =>
    ipcRenderer.invoke('auth:login', { username, password }),
  logout: () =>
    ipcRenderer.invoke('auth:logout'),

  // Shifts
  getCurrentShift: () =>
    ipcRenderer.invoke('shift:getCurrent'),
  getShiftSummary: (shiftId: number) =>
    ipcRenderer.invoke('shift:getSummary', shiftId),
  openShift: (data) =>
    ipcRenderer.invoke('shift:open', data),
  closeShift: (data) =>
    ipcRenderer.invoke('shift:close', data),

  // Orders
  createOrder: (data) =>
    ipcRenderer.invoke('order:create', data),
  getOrders: (filters) =>
    ipcRenderer.invoke('order:list', filters),

  // Items
  getItems: () =>
    ipcRenderer.invoke('items:list'),
  getCategories: () =>
    ipcRenderer.invoke('categories:list'),

  // Expenses
  createExpense: (data) =>
    ipcRenderer.invoke('expense:create', data),
  getExpenses: (filters) =>
    ipcRenderer.invoke('expense:list', filters),

  // Reports
  generateReport: (params) =>
    ipcRenderer.invoke('report:generate', params),

  // Settings
  getSettings: () =>
    ipcRenderer.invoke('settings:get'),
  updateSettings: (settings) =>
    ipcRenderer.invoke('settings:update', settings)
};

contextBridge.exposeInMainWorld('api', api);
