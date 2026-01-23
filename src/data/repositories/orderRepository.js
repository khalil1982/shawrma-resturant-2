const { all, get, run } = require("../db");
const { v4: uuidv4 } = require("uuid");

/**
 * Repository لإدارة الطلبات
 */

const getOrderById = async (id) => {
  return get("SELECT * FROM orders WHERE id = ?;", [id]);
};

/**
 * الحصول على طلب مع أصنافه
 */
const getOrderWithItems = async (orderId) => {
  try {
    const order = await get(
      "SELECT * FROM orders WHERE id = ?;",
      [orderId]
    );

    if (!order) return null;

    const items = await all(
      `SELECT oi.*,
              (SELECT GROUP_CONCAT(option_name, ', ')
               FROM order_item_options
               WHERE order_item_id = oi.id) as options
       FROM order_items oi
       WHERE oi.order_id = ?
       ORDER BY oi.id`,
      [orderId]
    );

    return { ...order, items };
  } catch (error) {
    console.error("خطأ في getOrderWithItems:", error);
    throw error;
  }
};

const listOrdersForShift = async (shiftId) => {
  return all(
    `
    SELECT *
    FROM orders
    WHERE shift_id = ?
    ORDER BY created_at DESC;
  `,
    [shiftId]
  );
};

const getShiftSalesTotal = async (shiftId) => {
  const row = await get(
    `
    SELECT COALESCE(SUM(total_amount), 0) AS total
    FROM orders
    WHERE shift_id = ? AND status != 'cancelled';
  `,
    [shiftId]
  );
  return row ? Number(row.total) : 0;
};

const createOrderWithItems = async ({
  shiftId,
  status,
  orderType,
  customerCount,
  subtotal,
  discountPercent,
  discountAmount,
  totalAmount,
  createdBy,
  createdAt,
  items,
}) => {
  await run("BEGIN TRANSACTION;");
  try {
    const orderResult = await run(
      `
      INSERT INTO orders (
        shift_id,
        status,
        order_type,
        customer_count,
        subtotal,
        discount_percent,
        discount_amount,
        total_amount,
        created_by,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `,
      [
        shiftId,
        status,
        orderType,
        customerCount,
        subtotal,
        discountPercent,
        discountAmount,
        totalAmount,
        createdBy,
        createdAt,
        createdAt,
      ]
    );

    const orderId = orderResult.lastID;

    for (const item of items) {
      await run(
        `
        INSERT INTO order_items (
          order_id,
          menu_item_id,
          item_name,
          unit_price,
          quantity,
          line_total
        )
        VALUES (?, ?, ?, ?, ?, ?);
      `,
        [
          orderId,
          item.menuItemId,
          item.itemName,
          item.unitPrice,
          item.quantity,
          item.lineTotal,
        ]
      );
    }

    await run(
      `
      INSERT INTO order_status_history (
        order_id,
        from_status,
        to_status,
        changed_by,
        changed_at
      )
      VALUES (?, ?, ?, ?, ?);
    `,
      [orderId, null, status, createdBy, createdAt]
    );

    await run("COMMIT;");
    return { ok: true, orderId };
  } catch (error) {
    await run("ROLLBACK;");
    throw error;
  }
};

const updateOrderStatus = async ({
  orderId,
  fromStatus,
  toStatus,
  changedBy,
  changedAt,
  reason,
}) => {
  await run("BEGIN TRANSACTION;");
  try {
    const updateResult = await run(
      `
      UPDATE orders
      SET status = ?,
          updated_at = ?
      WHERE id = ? AND status = ?;
    `,
      [toStatus, changedAt, orderId, fromStatus]
    );

    if (updateResult.changes === 0) {
      await run("ROLLBACK;");
      return { ok: false, error: "Order status mismatch" };
    }

    await run(
      `
      INSERT INTO order_status_history (
        order_id,
        from_status,
        to_status,
        changed_by,
        changed_at,
        reason
      )
      VALUES (?, ?, ?, ?, ?, ?);
    `,
      [orderId, fromStatus, toStatus, changedBy, changedAt, reason || null]
    );

    await run("COMMIT;");
    return { ok: true };
  } catch (error) {
    await run("ROLLBACK;");
    throw error;
  }
};

const cancelOrder = async ({
  orderId,
  fromStatus,
  cancelledBy,
  cancelledAt,
  cancelReason,
  refundedAmount,
}) => {
  await run("BEGIN TRANSACTION;");
  try {
    const updateResult = await run(
      `
      UPDATE orders
      SET status = 'cancelled',
          refunded_amount = ?,
          cancelled_by = ?,
          cancelled_at = ?,
          cancel_reason = ?,
          updated_at = ?
      WHERE id = ? AND status = ?;
    `,
      [
        refundedAmount,
        cancelledBy,
        cancelledAt,
        cancelReason,
        cancelledAt,
        orderId,
        fromStatus,
      ]
    );

    if (updateResult.changes === 0) {
      await run("ROLLBACK;");
      return { ok: false, error: "Order status mismatch" };
    }

    await run(
      `
      INSERT INTO order_status_history (
        order_id,
        from_status,
        to_status,
        changed_by,
        changed_at,
        reason
      )
      VALUES (?, ?, 'cancelled', ?, ?, ?);
    `,
      [orderId, fromStatus, cancelledBy, cancelledAt, cancelReason]
    );

    await run("COMMIT;");
    return { ok: true };
  } catch (error) {
    await run("ROLLBACK;");
    throw error;
  }
};

/**
 * توليد رقم طلب فريد
 */
const generateOrderNumber = () => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const random = Math.floor(Math.random() * 9999)
    .toString()
    .padStart(4, "0");
  return `ORD${year}${month}${day}-${random}`;
};

/**
 * الحصول على الطلبات النشطة (غير الملغاة وغير المكتملة)
 */
const getActiveOrders = async (shiftId) => {
  return all(
    `SELECT *
     FROM orders
     WHERE shift_id = ? AND status NOT IN ('completed', 'cancelled')
     ORDER BY created_at ASC;`,
    [shiftId]
  );
};

/**
 * الحصول على طلبات بتاريخ معين
 */
const getOrdersByDateRange = async (startDate, endDate) => {
  return all(
    `SELECT o.*, u.full_name as created_by_name
     FROM orders o
     LEFT JOIN users u ON o.created_by = u.id
     WHERE DATE(o.created_at) BETWEEN DATE(?) AND DATE(?)
     ORDER BY o.created_at DESC;`,
    [startDate, endDate]
  );
};

/**
 * إحصائيات الطلبات لوردية معينة
 */
const getOrderStatsForShift = async (shiftId) => {
  const stats = await get(
    `SELECT
       COUNT(*) as total_orders,
       COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
       COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders,
       COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
       COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total_amount ELSE 0 END), 0) as total_sales,
       COALESCE(AVG(CASE WHEN status != 'cancelled' THEN total_amount END), 0) as avg_order_value
     FROM orders
     WHERE shift_id = ?;`,
    [shiftId]
  );
  return stats || {
    total_orders: 0,
    completed_orders: 0,
    cancelled_orders: 0,
    pending_orders: 0,
    total_sales: 0,
    avg_order_value: 0,
  };
};

module.exports = {
  getOrderById,
  getOrderWithItems,
  listOrdersForShift,
  getShiftSalesTotal,
  createOrderWithItems,
  updateOrderStatus,
  cancelOrder,
  generateOrderNumber,
  getActiveOrders,
  getOrdersByDateRange,
  getOrderStatsForShift,
};
