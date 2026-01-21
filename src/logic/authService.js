const crypto = require("crypto");
const {
  getUserByUsername,
  getUserById,
} = require("../data/repositories/userRepository");
const {
  userHasPermission,
  getPermissionsForUser,
} = require("../data/repositories/permissionRepository");

const SESSION_TTL_MS = 1000 * 60 * 60 * 8;
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
    return { ok: false, error: "Invalid credentials" };
  }
  if (!user.is_active) {
    return { ok: false, error: "User inactive" };
  }
  const isValid = await verifyPassword(
    password,
    user.password_hash,
    user.password_salt
  );
  if (!isValid) {
    return { ok: false, error: "Invalid credentials" };
  }
  const sessionToken = createSession(user.id);
  return {
    ok: true,
    sessionToken,
    user: { id: user.id, username: user.username, role: user.role },
  };
};

const logout = (sessionToken) => {
  const existed = sessions.delete(sessionToken);
  return { ok: existed };
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
    return { ok: false, error: "Invalid session" };
  }
  const user = await getUserById(session.userId);
  if (!user || !user.is_active) {
    sessions.delete(sessionToken);
    return { ok: false, error: "Invalid session" };
  }
  const permissions = await getPermissionsForUser(user.id);
  return {
    ok: true,
    user,
    permissions: permissions.map((row) => row.key),
  };
};

const checkPermission = async (sessionToken, permissionKey) => {
  purgeExpiredSessions();
  const session = sessions.get(sessionToken);
  if (!session) {
    return { ok: false, error: "Invalid session" };
  }
  const allowed = await userHasPermission(session.userId, permissionKey);
  return { ok: true, allowed };
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
