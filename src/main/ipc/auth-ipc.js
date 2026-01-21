const { ipcMain } = require("electron");
const authService = require("../../logic/authService");
const auditService = require("../../logic/auditService");

const registerAuthIpc = () => {
  ipcMain.handle("auth:login", async (_event, { username, password }) => {
    const result = await authService.login(username, password);
    if (!result.ok) {
      await auditService.logEvent(null, "auth.login_failed", {
        username,
        reason: result.error,
      });
      return result;
    }
    await auditService.logEvent(result.user.id, "auth.login_success", {
      role: result.user.role,
    });
    return result;
  });

  ipcMain.handle("auth:logout", async (_event, { sessionToken }) => {
    const user = authService.getUserBySession(sessionToken);
    const result = authService.logout(sessionToken);
    if (user) {
      await auditService.logEvent(user.id, "auth.logout", {});
    }
    return result;
  });

  ipcMain.handle("auth:me", async (_event, { sessionToken }) => {
    return authService.getSessionInfo(sessionToken);
  });

  ipcMain.handle(
    "auth:checkPermission",
    async (_event, { sessionToken, permissionKey }) => {
      const result = await authService.checkPermission(
        sessionToken,
        permissionKey
      );
      return result;
    }
  );
};

module.exports = { registerAuthIpc };
