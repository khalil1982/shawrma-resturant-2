const { getOrderById } = require("../data/repositories/orderRepository");
const { getActiveShift } = require("./shiftService");

const ALLOWED_STATUSES = ["created", "preparing"];
const ALLOWED_ROLES = ["employee", "manager"];
const MAX_PERCENT_DISCOUNT = 5;

const validateDiscountEligibility = async ({
  orderId,
  discountType,
  discountValue,
  userRole,
}) => {
  const shift = await getActiveShift();
  if (!shift || shift.state !== "active") {
    return { ok: false, error: "Active shift required" };
  }

  if (!ALLOWED_ROLES.includes(userRole)) {
    return { ok: false, error: "Role not allowed" };
  }

  const order = await getOrderById(orderId);
  if (!order) return { ok: false, error: "Order not found" };
  if (order.shift_id !== shift.id) {
    return { ok: false, error: "Order does not belong to active shift" };
  }

  if (!ALLOWED_STATUSES.includes(order.status)) {
    return { ok: false, error: "Discount not allowed for status" };
  }

  const value = Number(discountValue);
  if (!Number.isFinite(value) || value < 0) {
    return { ok: false, error: "Invalid discount value" };
  }

  const type = String(discountType || "").toLowerCase();
  if (type !== "percent" && type !== "amount") {
    return { ok: false, error: "Invalid discount type" };
  }

  if (type === "percent" && value > MAX_PERCENT_DISCOUNT) {
    return { ok: false, error: "Discount percent exceeds limit" };
  }

  return { ok: true, order, discountType: type, discountValue: value };
};

module.exports = { validateDiscountEligibility };
