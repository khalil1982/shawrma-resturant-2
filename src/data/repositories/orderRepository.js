const { all, get, run } = require("../db");

const getOrderById = async (id) => {
  return get("SELECT * FROM orders WHERE id = ?;", [id]);
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

module.exports = {
  getOrderById,
  listOrdersForShift,
  getShiftSalesTotal,
  createOrderWithItems,
  updateOrderStatus,
  cancelOrder,
};
