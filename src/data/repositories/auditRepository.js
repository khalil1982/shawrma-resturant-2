const { run } = require("../db");

const insertAuditLog = async ({ userId, action, meta }) => {
  return run(
    "INSERT INTO audit_logs (user_id, action, meta) VALUES (?, ?, ?);",
    [userId, action, meta]
  );
};

module.exports = { insertAuditLog };
