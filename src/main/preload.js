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
  create: (sessionToken, payload) =>
    ipcRenderer.invoke("orders:create", { sessionToken, ...payload }),
  updateStatus: (sessionToken, payload) =>
    ipcRenderer.invoke("orders:status", { sessionToken, ...payload }),
  cancel: (sessionToken, payload) =>
    ipcRenderer.invoke("orders:cancel", { sessionToken, ...payload }),
});