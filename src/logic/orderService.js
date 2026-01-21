const {
  getOrderById,
  getOrderWithItems,
  listOrdersForShift,
  createOrderWithItems,
  updateOrderStatus,
  cancelOrder,
  generateOrderNumber,
  getActiveOrders,
  getOrderStatsForShift,
} = require("../data/repositories/orderRepository");
const { getActiveShift } = require("./shiftService");
const { ERROR_MESSAGES } = require("../constants");

const VALID_STATUSES = [
  "created",
  "preparing",
  "ready",
  "delivered",
  "cancelled",
];
const VALID_ORDER_TYPES = ["dine_in", "takeaway"];
const STATUS_FLOW = {
  created: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

const ensureActiveShift = async () => {
  const shift = await getActiveShift();
  if (!shift || shift.state !== "active") {
    return { ok: false, error: ERROR_MESSAGES.NO_ACTIVE_SHIFT };
  }
  return { ok: true, shift };
};

const normalizeItem = (item) => {
  const itemName = String(item.itemName || "").trim();
  const quantity = Number(item.quantity);
  const unitPrice = Number(item.unitPrice);
  if (!itemName || !Number.isFinite(quantity) || quantity <= 0) return null;
  if (!Number.isFinite(unitPrice) || unitPrice < 0) return null;
  const lineTotal = Number((quantity * unitPrice).toFixed(2));
  return {
    menuItemId: item.menuItemId ?? null,
    itemName,
    quantity,
    unitPrice,
    lineTotal,
  };
};

const createOrder = async ({
  orderType,
  customerCount,
  items = [],
  userId,
}) => {
  const shiftResult = await ensureActiveShift();
  if (!shiftResult.ok) return shiftResult;

  if (!VALID_ORDER_TYPES.includes(orderType)) {
    return { ok: false, error: "Invalid order type" };
  }

  const customers = Number(customerCount);
  if (!Number.isInteger(customers) || customers <= 0) {
    return { ok: false, error: "Invalid customer count" };
  }

  const normalizedItems = [];
  for (const item of items) {
    const normalized = normalizeItem(item);
    if (!normalized) {
      return { ok: false, error: "Invalid order item" };
    }
    normalizedItems.push(normalized);
  }

  const subtotal = normalizedItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const discountPercent = 0;
  const discountAmount = 0;
  const totalAmount = Number((subtotal - discountAmount).toFixed(2));
  const createdAt = new Date().toISOString();

  const result = await createOrderWithItems({
    shiftId: shiftResult.shift.id,
    status: "created",
    orderType,
    customerCount: customers,
    subtotal,
    discountPercent,
    discountAmount,
    totalAmount,
    createdBy: userId,
    createdAt,
    items: normalizedItems,
  });

  if (!result.ok) return result;
  const order = await getOrderById(result.orderId);
  return { ok: true, order };
};

const transitionOrderStatus = async ({
  orderId,
  toStatus,
  userId,
  reason,
}) => {
  const shiftResult = await ensureActiveShift();
  if (!shiftResult.ok) return shiftResult;

  if (!VALID_STATUSES.includes(toStatus) || toStatus === "cancelled") {
    return { ok: false, error: "Invalid status" };
  }

  const order = await getOrderById(orderId);
  if (!order) return { ok: false, error: "Order not found" };
  if (order.shift_id !== shiftResult.shift.id) {
    return { ok: false, error: "Order does not belong to active shift" };
  }

  const allowedNext = STATUS_FLOW[order.status] || [];
  if (!allowedNext.includes(toStatus)) {
    return { ok: false, error: "Invalid status transition" };
  }

  const changedAt = new Date().toISOString();
  const updateResult = await updateOrderStatus({
    orderId: order.id,
    fromStatus: order.status,
    toStatus,
    changedBy: userId,
    changedAt,
    reason,
  });

  if (!updateResult.ok) return updateResult;
  const updated = await getOrderById(order.id);
  return { ok: true, order: updated };
};

const cancelOrderWithRefund = async ({
  orderId,
  reason,
  userId,
}) => {
  const shiftResult = await ensureActiveShift();
  if (!shiftResult.ok) return shiftResult;

  const order = await getOrderById(orderId);
  if (!order) return { ok: false, error: "Order not found" };
  if (order.shift_id !== shiftResult.shift.id) {
    return { ok: false, error: "Order does not belong to active shift" };
  }

  if (order.status === "cancelled") {
    return { ok: false, error: "Order already cancelled" };
  }
  if (order.status === "delivered") {
    return { ok: false, error: "Delivered orders cannot be cancelled" };
  }

  const cancelReason = String(reason || "").trim();
  if (!cancelReason) {
    return { ok: false, error: "Cancel reason required" };
  }

  const refundedAmount = Number(order.total_amount) || 0;
  const cancelledAt = new Date().toISOString();
  const result = await cancelOrder({
    orderId: order.id,
    fromStatus: order.status,
    cancelledBy: userId,
    cancelledAt,
    cancelReason,
    refundedAmount,
  });

  if (!result.ok) return result;
  const updated = await getOrderById(order.id);
  return {
    ok: true,
    order: updated,
    refund: { amount: refundedAmount },
  };
};

const listOrders = async () => {
  const shiftResult = await ensureActiveShift();
  if (!shiftResult.ok) return shiftResult;
  const orders = await listOrdersForShift(shiftResult.shift.id);
  return { ok: true, orders };
};

/**
 * الحصول على تفاصيل طلب مع الأصناف والإضافات
 */
const getOrderDetails = async (orderId) => {
  const order = await getOrderWithItems(orderId);
  if (!order) {
    return { ok: false, error: "Order not found" };
  }
  return { ok: true, order };
};

/**
 * الحصول على الطلبات النشطة للوردية الحالية
 */
const getActiveOrdersList = async () => {
  const shiftResult = await ensureActiveShift();
  if (!shiftResult.ok) return shiftResult;

  const activeOrders = await getActiveOrders(shiftResult.shift.id);
  return { ok: true, orders: activeOrders };
};

/**
 * الحصول على إحصائيات طلبات الوردية الحالية
 */
const getShiftOrderStats = async () => {
  const shiftResult = await ensureActiveShift();
  if (!shiftResult.ok) return shiftResult;

  const stats = await getOrderStatsForShift(shiftResult.shift.id);
  return { ok: true, stats };
};

/**
 * تطبيق خصم على طلب (يجب أن يكون الطلب قيد الإنشاء)
 */
const applyDiscount = (subtotal, discountPercent) => {
  const percent = Number(discountPercent) || 0;
  if (percent < 0 || percent > 100) {
    return { ok: false, error: "Invalid discount percentage" };
  }

  const discountAmount = Number(((subtotal * percent) / 100).toFixed(2));
  const totalAmount = Number((subtotal - discountAmount).toFixed(2));

  return {
    ok: true,
    discountPercent: percent,
    discountAmount,
    totalAmount,
  };
};

/**
 * حساب المجموع لطلب جديد
 */
const calculateOrderTotal = (items, discountPercent = 0) => {
  const subtotal = items.reduce((sum, item) => {
    const lineTotal = Number((item.quantity * item.unitPrice).toFixed(2));
    return sum + lineTotal;
  }, 0);

  const discount = applyDiscount(subtotal, discountPercent);
  if (!discount.ok) {
    return { ok: false, error: discount.error };
  }

  return {
    ok: true,
    subtotal: Number(subtotal.toFixed(2)),
    discountPercent: discount.discountPercent,
    discountAmount: discount.discountAmount,
    totalAmount: discount.totalAmount,
  };
};

module.exports = {
  createOrder,
  transitionOrderStatus,
  cancelOrderWithRefund,
  listOrders,
  getOrderDetails,
  getActiveOrdersList,
  getShiftOrderStats,
  applyDiscount,
  calculateOrderTotal,
};
