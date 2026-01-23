const crypto = require("crypto");
const {
  getUserByUsername,
  getUserById,
} = require("../data/repositories/userRepository");
const {
  getUserPermissionsDetails,
  hasPermission,
} = require("./permissionService");
const { ERROR_MESSAGES, SUCCESS_MESSAGES } = require("../constants");

const SESSION_TTL_MS = 1000 * 60 * 60 * 8; // 8 ساعات
const sessions = new Map();

const createSession = (userId) => {
  const token = crypto.randomUUID();
  sessions.set(token, { userId, createdAt: Date.now() });
  return token;
};

const purgeExpiredSessions = () => {
  const now = Date.now();
  for (const [token, session] of sessions.entries()) {
    if (now - session.createdAt > SESSION_TTL_MS) {
      sessions.delete(token);
    }
  }
};

const hashPassword = async (password) => {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = await pbkdf2(password, salt);
  return { hash, salt };
};

const verifyPassword = async (password, hash, salt) => {
  const candidate = await pbkdf2(password, salt);
  return timingSafeEquals(candidate, hash);
};

const login = async (username, password) => {
  purgeExpiredSessions();

  const user = await getUserByUsername(username);
  if (!user) {
    return { ok: false, error: ERROR_MESSAGES.INVALID_CREDENTIALS };
  }

  if (!user.is_active) {
    return { ok: false, error: ERROR_MESSAGES.USER_INACTIVE };
  }

  const isValid = await verifyPassword(
    password,
    user.password_hash,
    user.password_salt
  );

  if (!isValid) {
    return { ok: false, error: ERROR_MESSAGES.INVALID_CREDENTIALS };
  }

  // الحصول على الصلاحيات والدور
  const permissionsDetails = await getUserPermissionsDetails(user.id);

  const sessionToken = createSession(user.id);

  return {
    ok: true,
    message: SUCCESS_MESSAGES.LOGIN_SUCCESS,
    sessionToken,
    user: {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      role: permissionsDetails.role,
      permissions: permissionsDetails.permissions,
      isAdmin: permissionsDetails.isAdmin,
      isManager: permissionsDetails.isManager,
      isCashier: permissionsDetails.isCashier,
    },
  };
};

const logout = (sessionToken) => {
  const existed = sessions.delete(sessionToken);
  return {
    ok: existed,
    message: existed ? SUCCESS_MESSAGES.LOGOUT_SUCCESS : "جلسة غير موجودة",
  };
};

const getUserBySession = (sessionToken) => {
  purgeExpiredSessions();
  const session = sessions.get(sessionToken);
  if (!session) return null;
  return { id: session.userId };
};

const getSessionInfo = async (sessionToken) => {
  purgeExpiredSessions();
  const session = sessions.get(sessionToken);

  if (!session) {
    return { ok: false, error: ERROR_MESSAGES.SESSION_EXPIRED };
  }

  const user = await getUserById(session.userId);
  if (!user || !user.is_active) {
    sessions.delete(sessionToken);
    return { ok: false, error: ERROR_MESSAGES.SESSION_EXPIRED };
  }

  // الحصول على الصلاحيات الكاملة
  const permissionsDetails = await getUserPermissionsDetails(user.id);

  return {
    ok: true,
    user: {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      role: permissionsDetails.role,
      permissions: permissionsDetails.permissions,
      isAdmin: permissionsDetails.isAdmin,
      isManager: permissionsDetails.isManager,
      isCashier: permissionsDetails.isCashier,
    },
  };
};

const checkPermission = async (sessionToken, permissionKey) => {
  purgeExpiredSessions();
  const session = sessions.get(sessionToken);

  if (!session) {
    return { ok: false, error: ERROR_MESSAGES.SESSION_EXPIRED };
  }

  const allowed = await hasPermission(session.userId, permissionKey);

  return {
    ok: true,
    allowed,
    message: allowed ? "مصرح" : ERROR_MESSAGES.UNAUTHORIZED,
  };
};

const pbkdf2 = (password, salt) =>
  new Promise((resolve, reject) => {
    crypto.pbkdf2(
      password,
      salt,
      120000,
      64,
      "sha512",
      (err, derivedKey) => {
        if (err) return reject(err);
        resolve(derivedKey.toString("hex"));
      }
    );
  });

const timingSafeEquals = (a, b) => {
  const aBuf = Buffer.from(a, "hex");
  const bBuf = Buffer.from(b, "hex");
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
};

module.exports = {
  login,
  logout,
  getSessionInfo,
  getUserBySession,
  checkPermission,
  hashPassword,
  verifyPassword,
};
