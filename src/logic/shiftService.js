const {
  getActiveShift,
  getShiftById,
  createShift,
  closeShiftAndRecordVariance,
} = require("../data/repositories/shiftRepository");
const {
  getShiftSalesTotal,
  getOrderStatsForShift,
  listOrdersForShift,
} = require("../data/repositories/orderRepository");
const { ERROR_MESSAGES } = require("../constants");

const VALID_SHIFT_TYPES = ["morning", "evening"];

const getLocalDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const normalizeCash = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) return null;
  return amount;
};

const openShift = async ({ shiftType, openingCash, userId }) => {
  const activeShift = await getActiveShift();
  if (activeShift) {
    return {
      ok: false,
      error: ERROR_MESSAGES.SHIFT_ALREADY_ACTIVE,
      activeShiftId: activeShift.id,
    };
  }

  if (!VALID_SHIFT_TYPES.includes(shiftType)) {
    return { ok: false, error: "نوع الوردية غير صحيح" };
  }

  const normalizedCash = normalizeCash(openingCash);
  if (normalizedCash === null) {
    return { ok: false, error: "المبلغ الافتتاحي غير صحيح" };
  }

  const openedAt = new Date().toISOString();
  const shiftDate = getLocalDateString();

  const result = await createShift({
    shiftDate,
    shiftType,
    openedBy: userId,
    openedAt,
    openingCash: normalizedCash,
  });

  const shift = await getShiftById(result.lastID);
  return { ok: true, shift };
};

const closeShift = async ({ shiftId, actualCash, reason, userId }) => {
  const activeShift = await getActiveShift();
  if (!activeShift) {
    return { ok: false, error: "No active shift to close" };
  }

  if (shiftId && Number(shiftId) !== activeShift.id) {
    return { ok: false, error: "Shift mismatch" };
  }

  const normalizedCash = normalizeCash(actualCash);
  if (normalizedCash === null) {
    return { ok: false, error: "Invalid closing cash" };
  }

  const closeReason = String(reason || "").trim();
  if (!closeReason) {
    return { ok: false, error: "Close reason is required" };
  }

  // Business rule: expected cash = opening cash + non-cancelled order totals.
  const salesTotal = await getShiftSalesTotal(activeShift.id);
  const expectedCash = (Number(activeShift.opening_cash) || 0) + salesTotal;
  const variance = normalizedCash - expectedCash;
  const closedAt = new Date().toISOString();

  const result = await closeShiftAndRecordVariance({
    shiftId: activeShift.id,
    closingCash: normalizedCash,
    closedBy: userId,
    closedAt,
    closeReason,
    expectedCash,
    actualCash: normalizedCash,
    variance,
  });

  if (!result.ok) {
    return result;
  }

  const shift = await getShiftById(activeShift.id);
  return {
    ok: true,
    shift,
    variance: { expectedCash, actualCash: normalizedCash, variance },
  };
};

/**
 * الحصول على تفاصيل وردية مع الإحصائيات
 */
const getShiftDetails = async (shiftId) => {
  const shift = await getShiftById(shiftId);
  if (!shift) {
    return { ok: false, error: "الوردية غير موجودة" };
  }

  const orders = await listOrdersForShift(shiftId);
  const stats = await getOrderStatsForShift(shiftId);
  const salesTotal = await getShiftSalesTotal(shiftId);

  return {
    ok: true,
    shift: {
      ...shift,
      orders,
      stats,
      salesTotal,
    },
  };
};

/**
 * الحصول على ملخص الوردية النشطة
 */
const getActiveShiftSummary = async () => {
  const activeShift = await getActiveShift();
  if (!activeShift) {
    return { ok: false, error: ERROR_MESSAGES.NO_ACTIVE_SHIFT };
  }

  const stats = await getOrderStatsForShift(activeShift.id);
  const salesTotal = await getShiftSalesTotal(activeShift.id);

  return {
    ok: true,
    shift: activeShift,
    stats,
    salesTotal,
  };
};

/**
 * التحقق من وجود وردية نشطة
 */
const checkActiveShift = async () => {
  const activeShift = await getActiveShift();
  return {
    ok: true,
    hasActiveShift: !!activeShift,
    shift: activeShift || null,
  };
};

module.exports = {
  openShift,
  closeShift,
  getActiveShift,
  getShiftById,
  getShiftDetails,
  getActiveShiftSummary,
  checkActiveShift,
};
