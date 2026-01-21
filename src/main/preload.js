const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("authApi", {
  login: (username, password) =>
    ipcRenderer.invoke("auth:login", { username, password }),
  logout: (sessionToken) =>
    ipcRenderer.invoke("auth:logout", { sessionToken }),
  me: (sessionToken) => ipcRenderer.invoke("auth:me", { sessionToken }),
  checkPermission: (sessionToken, permissionKey) =>
    ipcRenderer.invoke("auth:checkPermission", {
      sessionToken,
      permissionKey,
    }),
});

contextBridge.exposeInMainWorld("shiftApi", {
  active: (sessionToken) => ipcRenderer.invoke("shift:active", { sessionToken }),
  open: (sessionToken, shiftType, openingCash) =>
    ipcRenderer.invoke("shift:open", { sessionToken, shiftType, openingCash }),
  close: (sessionToken, actualCash, reason) =>
    ipcRenderer.invoke("shift:close", { sessionToken, actualCash, reason }),
});

contextBridge.exposeInMainWorld("orderApi", {
  list: (sessionToken) => ipcRenderer.invoke("orders:list", { sessionToken }),
  details: (sessionToken, orderId) =>
    ipcRenderer.invoke("orders:details", { sessionToken, orderId }),
  active: (sessionToken) => ipcRenderer.invoke("orders:active", { sessionToken }),
  stats: (sessionToken) => ipcRenderer.invoke("orders:stats", { sessionToken }),
  create: (sessionToken, payload) =>
    ipcRenderer.invoke("orders:create", { sessionToken, ...payload }),
  updateStatus: (sessionToken, payload) =>
    ipcRenderer.invoke("orders:status", { sessionToken, ...payload }),
  cancel: (sessionToken, payload) =>
    ipcRenderer.invoke("orders:cancel", { sessionToken, ...payload }),
});

contextBridge.exposeInMainWorld("menuApi", {
  categories: (sessionToken) =>
    ipcRenderer.invoke("menu:categories", { sessionToken }),
  items: (sessionToken) => ipcRenderer.invoke("menu:items", { sessionToken }),
  itemsByCategory: (sessionToken, categoryId) =>
    ipcRenderer.invoke("menu:items-by-category", { sessionToken, categoryId }),
  search: (sessionToken, searchTerm) =>
    ipcRenderer.invoke("menu:search", { sessionToken, searchTerm }),
  item: (sessionToken, itemId) =>
    ipcRenderer.invoke("menu:item", { sessionToken, itemId }),
  updateAvailability: (sessionToken, itemId, isAvailable) =>
    ipcRenderer.invoke("menu:update-availability", {
      sessionToken,
      itemId,
      isAvailable,
    }),
});