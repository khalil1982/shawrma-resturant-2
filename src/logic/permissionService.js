const { all } = require("../data/db");
const { ERROR_MESSAGES } = require("../constants");

/**
 * خدمة إدارة الصلاحيات
 * التحقق من صلاحيات المستخدمين
 */

/**
 * الحصول على صلاحيات المستخدم
 * @param {number} userId - معرف المستخدم
 * @returns {Promise<string[]>} قائمة الصلاحيات
 */
const getUserPermissions = async (userId) => {
  try {
    const permissions = await all(
      `SELECT DISTINCT p.key
       FROM permissions p
       INNER JOIN role_permissions rp ON p.id = rp.permission_id
       INNER JOIN users u ON u.role_id = rp.role_id
       WHERE u.id = ? AND u.is_active = 1;`,
      [userId]
    );

    return permissions.map((p) => p.key);
  } catch (error) {
    console.error("خطأ في getUserPermissions:", error);
    throw new Error(ERROR_MESSAGES.DATABASE_ERROR);
  }
};

/**
 * التحقق من صلاحية واحدة
 * @param {number} userId - معرف المستخدم
 * @param {string} permission - الصلاحية المطلوبة
 * @returns {Promise<boolean>} true إذا كان لديه الصلاحية
 */
const hasPermission = async (userId, permission) => {
  try {
    const permissions = await getUserPermissions(userId);
    return permissions.includes(permission);
  } catch (error) {
    console.error("خطأ في hasPermission:", error);
    return false;
  }
};

/**
 * التحقق من أي صلاحية من قائمة (OR)
 * @param {number} userId - معرف المستخدم
 * @param {string[]} permissionList - قائمة الصلاحيات
 * @returns {Promise<boolean>} true إذا كان لديه أي صلاحية من القائمة
 */
const hasAnyPermission = async (userId, permissionList) => {
  try {
    const userPermissions = await getUserPermissions(userId);
    return permissionList.some((p) => userPermissions.includes(p));
  } catch (error) {
    console.error("خطأ في hasAnyPermission:", error);
    return false;
  }
};

/**
 * التحقق من كل الصلاحيات في القائمة (AND)
 * @param {number} userId - معرف المستخدم
 * @param {string[]} permissionList - قائمة الصلاحيات
 * @returns {Promise<boolean>} true إذا كان لديه كل الصلاحيات
 */
const hasAllPermissions = async (userId, permissionList) => {
  try {
    const userPermissions = await getUserPermissions(userId);
    return permissionList.every((p) => userPermissions.includes(p));
  } catch (error) {
    console.error("خطأ في hasAllPermissions:", error);
    return false;
  }
};

/**
 * التحقق من دور المستخدم
 * @param {number} userId - معرف المستخدم
 * @param {string} roleName - اسم الدور (admin, manager, cashier)
 * @returns {Promise<boolean>} true إذا كان لديه الدور
 */
const hasRole = async (userId, roleName) => {
  try {
    const result = await all(
      `SELECT r.name
       FROM roles r
       INNER JOIN users u ON u.role_id = r.id
       WHERE u.id = ? AND u.is_active = 1;`,
      [userId]
    );

    return result.length > 0 && result[0].name === roleName;
  } catch (error) {
    console.error("خطأ في hasRole:", error);
    return false;
  }
};

/**
 * التحقق من أي دور من القائمة
 * @param {number} userId - معرف المستخدم
 * @param {string[]} roleList - قائمة الأدوار
 * @returns {Promise<boolean>} true إذا كان لديه أي دور من القائمة
 */
const hasAnyRole = async (userId, roleList) => {
  try {
    const result = await all(
      `SELECT r.name
       FROM roles r
       INNER JOIN users u ON u.role_id = r.id
       WHERE u.id = ? AND u.is_active = 1;`,
      [userId]
    );

    if (result.length === 0) return false;
    return roleList.includes(result[0].name);
  } catch (error) {
    console.error("خطأ في hasAnyRole:", error);
    return false;
  }
};

/**
 * الحصول على دور المستخدم
 * @param {number} userId - معرف المستخدم
 * @returns {Promise<Object|null>} معلومات الدور أو null
 */
const getUserRole = async (userId) => {
  try {
    const result = await all(
      `SELECT r.id, r.name, r.display_name
       FROM roles r
       INNER JOIN users u ON u.role_id = r.id
       WHERE u.id = ? AND u.is_active = 1;`,
      [userId]
    );

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("خطأ في getUserRole:", error);
    return null;
  }
};

/**
 * middleware للتحقق من الصلاحيات في IPC
 * @param {string|string[]} requiredPermissions - الصلاحية أو الصلاحيات المطلوبة
 * @returns {Function} middleware function
 */
const requirePermission = (requiredPermissions) => {
  return async (event, userId, ...args) => {
    try {
      const permissions = Array.isArray(requiredPermissions)
        ? requiredPermissions
        : [requiredPermissions];

      const hasAccess = await hasAnyPermission(userId, permissions);

      if (!hasAccess) {
        throw new Error(ERROR_MESSAGES.UNAUTHORIZED);
      }

      return { authorized: true };
    } catch (error) {
      console.error("خطأ في requirePermission:", error);
      throw new Error(ERROR_MESSAGES.UNAUTHORIZED);
    }
  };
};

/**
 * middleware للتحقق من الدور في IPC
 * @param {string|string[]} requiredRoles - الدور أو الأدوار المطلوبة
 * @returns {Function} middleware function
 */
const requireRole = (requiredRoles) => {
  return async (event, userId, ...args) => {
    try {
      const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

      const hasAccess = await hasAnyRole(userId, roles);

      if (!hasAccess) {
        throw new Error(ERROR_MESSAGES.UNAUTHORIZED);
      }

      return { authorized: true };
    } catch (error) {
      console.error("خطأ في requireRole:", error);
      throw new Error(ERROR_MESSAGES.UNAUTHORIZED);
    }
  };
};

/**
 * التحقق البسيط من الصلاحية وإرجاع خطأ إذا لم يكن مصرحاً
 * @param {number} userId - معرف المستخدم
 * @param {string|string[]} permissions - الصلاحية أو الصلاحيات
 * @throws {Error} إذا لم يكن لديه الصلاحية
 */
const checkPermission = async (userId, permissions) => {
  const permList = Array.isArray(permissions) ? permissions : [permissions];
  const hasAccess = await hasAnyPermission(userId, permList);

  if (!hasAccess) {
    throw new Error(ERROR_MESSAGES.UNAUTHORIZED);
  }
};

/**
 * التحقق البسيط من الدور وإرجاع خطأ إذا لم يكن مصرحاً
 * @param {number} userId - معرف المستخدم
 * @param {string|string[]} roles - الدور أو الأدوار
 * @throws {Error} إذا لم يكن لديه الدور
 */
const checkRole = async (userId, roles) => {
  const roleList = Array.isArray(roles) ? roles : [roles];
  const hasAccess = await hasAnyRole(userId, roleList);

  if (!hasAccess) {
    throw new Error(ERROR_MESSAGES.UNAUTHORIZED);
  }
};

/**
 * الحصول على قائمة كاملة بصلاحيات المستخدم مع التفاصيل
 * @param {number} userId - معرف المستخدم
 * @returns {Promise<Object>} كائن يحتوي على الدور والصلاحيات
 */
const getUserPermissionsDetails = async (userId) => {
  try {
    const role = await getUserRole(userId);
    const permissions = await getUserPermissions(userId);

    return {
      role,
      permissions,
      isAdmin: role && role.name === "admin",
      isManager: role && role.name === "manager",
      isCashier: role && role.name === "cashier",
    };
  } catch (error) {
    console.error("خطأ في getUserPermissionsDetails:", error);
    throw new Error(ERROR_MESSAGES.DATABASE_ERROR);
  }
};

module.exports = {
  getUserPermissions,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  hasRole,
  hasAnyRole,
  getUserRole,
  requirePermission,
  requireRole,
  checkPermission,
  checkRole,
  getUserPermissionsDetails,
};
