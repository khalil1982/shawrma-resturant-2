const { ipcMain } = require("electron");
const authService = require("../../logic/authService");
const auditService = require("../../logic/auditService");
const {
  getAllCategories,
  getAllMenuItems,
  getAvailableMenuItems,
  getMenuItemsByCategory,
  searchMenuItems,
  getMenuItemById,
  updateMenuItemAvailability,
} = require("../../data/repositories/menuRepository");
const { checkPermission } = require("../../logic/permissionService");
const { ERROR_MESSAGES } = require("../../constants");

const registerMenuIpc = () => {
  // الحصول على جميع التصنيفات
  ipcMain.handle("menu:categories", async (_event, { sessionToken }) => {
    const session = await authService.getSessionInfo(sessionToken);
    if (!session.ok) return session;

    try {
      await checkPermission(session.user.id, "menu.read");
    } catch (error) {
      return { ok: false, error: ERROR_MESSAGES.UNAUTHORIZED };
    }

    try {
      const categories = await getAllCategories();
      return { ok: true, categories };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  });

  // الحصول على جميع الأصناف المتاحة
  ipcMain.handle("menu:items", async (_event, { sessionToken }) => {
    const session = await authService.getSessionInfo(sessionToken);
    if (!session.ok) return session;

    try {
      await checkPermission(session.user.id, "menu.read");
    } catch (error) {
      return { ok: false, error: ERROR_MESSAGES.UNAUTHORIZED };
    }

    try {
      const items = await getAvailableMenuItems();
      return { ok: true, items };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  });

  // الحصول على أصناف تصنيف معين
  ipcMain.handle(
    "menu:items-by-category",
    async (_event, { sessionToken, categoryId }) => {
      const session = await authService.getSessionInfo(sessionToken);
      if (!session.ok) return session;

      try {
        await checkPermission(session.user.id, "menu.read");
      } catch (error) {
        return { ok: false, error: ERROR_MESSAGES.UNAUTHORIZED };
      }

      try {
        const items = await getMenuItemsByCategory(categoryId);
        return { ok: true, items };
      } catch (error) {
        return { ok: false, error: error.message };
      }
    }
  );

  // البحث عن الأصناف
  ipcMain.handle(
    "menu:search",
    async (_event, { sessionToken, searchTerm }) => {
      const session = await authService.getSessionInfo(sessionToken);
      if (!session.ok) return session;

      try {
        await checkPermission(session.user.id, "menu.read");
      } catch (error) {
        return { ok: false, error: ERROR_MESSAGES.UNAUTHORIZED };
      }

      try {
        const items = await searchMenuItems(searchTerm);
        return { ok: true, items };
      } catch (error) {
        return { ok: false, error: error.message };
      }
    }
  );

  // الحصول على صنف معين
  ipcMain.handle("menu:item", async (_event, { sessionToken, itemId }) => {
    const session = await authService.getSessionInfo(sessionToken);
    if (!session.ok) return session;

    try {
      await checkPermission(session.user.id, "menu.read");
    } catch (error) {
      return { ok: false, error: ERROR_MESSAGES.UNAUTHORIZED };
    }

    try {
      const item = await getMenuItemById(itemId);
      if (!item) {
        return { ok: false, error: "الصنف غير موجود" };
      }
      return { ok: true, item };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  });

  // تحديث توفر صنف
  ipcMain.handle(
    "menu:update-availability",
    async (_event, { sessionToken, itemId, isAvailable }) => {
      const session = await authService.getSessionInfo(sessionToken);
      if (!session.ok) {
        await auditService.logEvent(null, "menu.update_failed", {
          reason: session.error,
        });
        return session;
      }

      try {
        await checkPermission(session.user.id, "menu.update");
      } catch (error) {
        await auditService.logEvent(session.user.id, "menu.update_denied", {
          reason: "missing_permission",
        });
        return { ok: false, error: ERROR_MESSAGES.UNAUTHORIZED };
      }

      try {
        const result = await updateMenuItemAvailability(itemId, isAvailable);

        await auditService.logEvent(session.user.id, "menu.update_availability", {
          itemId,
          isAvailable,
        });

        return { ok: true, result };
      } catch (error) {
        await auditService.logEvent(session.user.id, "menu.update_failed", {
          reason: error.message,
          itemId,
        });
        return { ok: false, error: error.message };
      }
    }
  );
};

module.exports = { registerMenuIpc };
