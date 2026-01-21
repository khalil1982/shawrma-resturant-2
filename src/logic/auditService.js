const { insertAuditLog } = require("../data/repositories/auditRepository");

const logEvent = async (userId, action, meta = {}) => {
  try {
    const payload = JSON.stringify(meta || {});
    await insertAuditLog({ userId, action, meta: payload });
  } catch (err) {
    console.error("Audit log failed:", err);
  }
};

module.exports = { logEvent };
