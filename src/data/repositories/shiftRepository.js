const { get, run } = require("../db");

const getActiveShift = async () => {
  return get(
    `
    SELECT *
    FROM shifts
    WHERE state IN ('open', 'active')
    ORDER BY opened_at DESC
    LIMIT 1;
  `
  );
};

const getShiftById = async (id) => {
  return get("SELECT * FROM shifts WHERE id = ?;", [id]);
};

const createShift = async ({
  shiftDate,
  shiftType,
  openedBy,
  openedAt,
  openingCash,
}) => {
  return run(
    `
    INSERT INTO shifts (
      shift_date,
      shift_type,
      state,
      opened_by,
      opened_at,
      opening_cash
    )
    VALUES (?, ?, 'active', ?, ?, ?);
  `,
    [shiftDate, shiftType, openedBy, openedAt, openingCash]
  );
};

const closeShiftAndRecordVariance = async ({
  shiftId,
  closingCash,
  closedBy,
  closedAt,
  closeReason,
  expectedCash,
  actualCash,
  variance,
}) => {
  await run("BEGIN TRANSACTION;");
  try {
    const updateResult = await run(
      `
      UPDATE shifts
      SET state = 'closed',
          closing_cash = ?,
          closed_by = ?,
          closed_at = ?,
          close_reason = ?
      WHERE id = ? AND state IN ('open', 'active');
    `,
      [closingCash, closedBy, closedAt, closeReason, shiftId]
    );

    if (updateResult.changes === 0) {
      await run("ROLLBACK;");
      return { ok: false, error: "Shift already closed or missing" };
    }

    await run(
      `
      INSERT INTO cash_variance (
        shift_id,
        expected_cash,
        actual_cash,
        variance,
        reason
      )
      VALUES (?, ?, ?, ?, ?);
    `,
      [shiftId, expectedCash, actualCash, variance, closeReason]
    );

    await run("COMMIT;");
    return { ok: true };
  } catch (error) {
    await run("ROLLBACK;");
    throw error;
  }
};

module.exports = {
  getActiveShift,
  getShiftById,
  createShift,
  closeShiftAndRecordVariance,
};
