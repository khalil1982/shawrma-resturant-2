const { ipcMain } = require("electron");
const authService = require("../../logic/authService");
const auditService = require("../../logic/auditService");
const orderService = require("../../logic/orderService");
const { checkPermission } = require("../../logic/permissionService");
const { ERROR_MESSAGES } = require("../../constants");

const registerOrderIpc = () => {
  ipcMain.handle("orders:list", async (_event, { sessionToken }) => {
    const session = await authService.getSessionInfo(sessionToken);
    if (!session.ok) return session;

    try {
      await checkPermission(session.user.id, "order.read");
    } catch (error) {
      await auditService.logEvent(session.user.id, "order.read_denied", {
        reason: "missing_permission",
      });
      return { ok: false, error: ERROR_MESSAGES.UNAUTHORIZED };
    }

    return orderService.listOrders();
  });

  ipcMain.handle(
    "orders:create",
    async (_event, { sessionToken, orderType, customerCount, items }) => {
      const session = await authService.getSessionInfo(sessionToken);
      if (!session.ok) {
        await auditService.logEvent(null, "order.create_failed", {
          reason: session.error,
        });
        return session;
      }

      try {
        await checkPermission(session.user.id, "order.create");
      } catch (error) {
        await auditService.logEvent(session.user.id, "order.create_denied", {
          reason: "missing_permission",
        });
        return { ok: false, error: ERROR_MESSAGES.UNAUTHORIZED };
      }

      const result = await orderService.createOrder({
        orderType,
        customerCount,
        items,
        userId: session.user.id,
      });

      if (!result.ok) {
        await auditService.logEvent(session.user.id, "order.create_failed", {
          reason: result.error,
        });
        return result;
      }

      await auditService.logEvent(session.user.id, "order.create", {
        orderId: result.order.id,
        shiftId: result.order.shift_id,
        totalAmount: result.order.total_amount,
        orderType: result.order.order_type,
        customerCount: result.order.customer_count,
      });

      return result;
    }
  );

  ipcMain.handle(
    "orders:status",
    async (_event, { sessionToken, orderId, toStatus }) => {
      const session = await authService.getSessionInfo(sessionToken);
      if (!session.ok) {
        await auditService.logEvent(null, "order.status_failed", {
          reason: session.error,
        });
        return session;
      }

      try {
        await checkPermission(session.user.id, "order.update");
      } catch (error) {
        await auditService.logEvent(session.user.id, "order.status_denied", {
          reason: "missing_permission",
        });
        return { ok: false, error: ERROR_MESSAGES.UNAUTHORIZED };
      }

      const result = await orderService.transitionOrderStatus({
        orderId,
        toStatus,
        userId: session.user.id,
      });

      if (!result.ok) {
        await auditService.logEvent(session.user.id, "order.status_failed", {
          reason: result.error,
          orderId,
          toStatus,
        });
        return result;
      }

      await auditService.logEvent(session.user.id, "order.status_update", {
        orderId: result.order.id,
        fromStatus: result.order.status,
        toStatus,
      });

      return result;
    }
  );

  ipcMain.handle(
    "orders:cancel",
    async (_event, { sessionToken, orderId, reason }) => {
      const session = await authService.getSessionInfo(sessionToken);
      if (!session.ok) {
        await auditService.logEvent(null, "order.cancel_failed", {
          reason: session.error,
        });
        return session;
      }

      try {
        await checkPermission(session.user.id, "order.cancel");
      } catch (error) {
        await auditService.logEvent(session.user.id, "order.cancel_denied", {
          reason: "missing_permission",
        });
        return { ok: false, error: ERROR_MESSAGES.UNAUTHORIZED };
      }

      const result = await orderService.cancelOrderWithRefund({
        orderId,
        reason,
        userId: session.user.id,
      });

      if (!result.ok) {
        await auditService.logEvent(session.user.id, "order.cancel_failed", {
          reason: result.error,
          orderId,
        });
        return result;
      }

      await auditService.logEvent(session.user.id, "order.cancel", {
        orderId: result.order.id,
        shiftId: result.order.shift_id,
        refund: result.refund,
      });

      return result;
    }
  );

  // الحصول على تفاصيل طلب
  ipcMain.handle("orders:details", async (_event, { sessionToken, orderId }) => {
    const session = await authService.getSessionInfo(sessionToken);
    if (!session.ok) return session;

    try {
      await checkPermission(session.user.id, "order.read");
    } catch (error) {
      await auditService.logEvent(session.user.id, "order.read_denied", {
        reason: "missing_permission",
      });
      return { ok: false, error: ERROR_MESSAGES.UNAUTHORIZED };
    }

    return orderService.getOrderDetails(orderId);
  });

  // الحصول على الطلبات النشطة
  ipcMain.handle("orders:active", async (_event, { sessionToken }) => {
    const session = await authService.getSessionInfo(sessionToken);
    if (!session.ok) return session;

    try {
      await checkPermission(session.user.id, "order.read");
    } catch (error) {
      await auditService.logEvent(session.user.id, "order.read_denied", {
        reason: "missing_permission",
      });
      return { ok: false, error: ERROR_MESSAGES.UNAUTHORIZED };
    }

    return orderService.getActiveOrdersList();
  });

  // الحصول على إحصائيات الطلبات
  ipcMain.handle("orders:stats", async (_event, { sessionToken }) => {
    const session = await authService.getSessionInfo(sessionToken);
    if (!session.ok) return session;

    try {
      await checkPermission(session.user.id, ["order.read", "report.view"]);
    } catch (error) {
      await auditService.logEvent(session.user.id, "order.stats_denied", {
        reason: "missing_permission",
      });
      return { ok: false, error: ERROR_MESSAGES.UNAUTHORIZED };
    }

    return orderService.getShiftOrderStats();
  });
};

module.exports = { registerOrderIpc };
