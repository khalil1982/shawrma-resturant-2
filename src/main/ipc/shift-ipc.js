const { ipcMain } = require("electron");
const authService = require("../../logic/authService");
const auditService = require("../../logic/auditService");
const shiftService = require("../../logic/shiftService");
const { checkPermission } = require("../../logic/permissionService");
const { ERROR_MESSAGES } = require("../../constants");

const registerShiftIpc = () => {
  ipcMain.handle("shift:active", async (_event, { sessionToken }) => {
    const session = await authService.getSessionInfo(sessionToken);
    if (!session.ok) return session;
    const shift = await shiftService.getActiveShift();
    return { ok: true, shift };
  });

  ipcMain.handle(
    "shift:open",
    async (_event, { sessionToken, shiftType, openingCash }) => {
      const session = await authService.getSessionInfo(sessionToken);
      if (!session.ok) {
        await auditService.logEvent(null, "shift.open_failed", {
          reason: session.error,
        });
        return session;
      }

      // فحص الصلاحية
      try {
        await checkPermission(session.user.id, "shift.open");
      } catch (error) {
        await auditService.logEvent(session.user.id, "shift.open_denied", {
          reason: "missing_permission",
        });
        return { ok: false, error: ERROR_MESSAGES.UNAUTHORIZED };
      }

      const result = await shiftService.openShift({
        shiftType,
        openingCash,
        userId: session.user.id,
      });

      if (!result.ok) {
        await auditService.logEvent(session.user.id, "shift.open_failed", {
          reason: result.error,
          shiftType,
        });
        return result;
      }

      await auditService.logEvent(session.user.id, "shift.open", {
        shiftId: result.shift.id,
        shiftType: result.shift.shift_type,
        openingCash: result.shift.opening_cash,
      });

      return result;
    }
  );

  ipcMain.handle(
    "shift:close",
    async (_event, { sessionToken, actualCash, reason }) => {
      const session = await authService.getSessionInfo(sessionToken);
      if (!session.ok) {
        await auditService.logEvent(null, "shift.close_failed", {
          reason: session.error,
        });
        return session;
      }

      // فحص الصلاحية
      try {
        await checkPermission(session.user.id, "shift.close");
      } catch (error) {
        await auditService.logEvent(session.user.id, "shift.close_denied", {
          reason: "missing_permission",
        });
        return { ok: false, error: ERROR_MESSAGES.UNAUTHORIZED };
      }

      const result = await shiftService.closeShift({
        actualCash,
        reason,
        userId: session.user.id,
      });

      if (!result.ok) {
        await auditService.logEvent(session.user.id, "shift.close_failed", {
          reason: result.error,
        });
        return result;
      }

      await auditService.logEvent(session.user.id, "shift.close", {
        shiftId: result.shift.id,
        shiftType: result.shift.shift_type,
        openingCash: result.shift.opening_cash,
        closingCash: result.shift.closing_cash,
        variance: result.variance,
      });

      return result;
    }
  );
};

module.exports = { registerShiftIpc };
