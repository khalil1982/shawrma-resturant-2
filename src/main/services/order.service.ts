import Database from 'better-sqlite3';
import { Order, OrderWithItems, CreateOrderRequest, ApiResponse } from '@shared/types';
import { AuditLogService } from './audit-log.service';

export class OrderService {
  constructor(
    private db: Database.Database,
    private auditLog: AuditLogService
  ) {}

  async createOrder(req: CreateOrderRequest, userId: number): Promise<ApiResponse<Order>> {
    try {
      // التحقق من وجود وردية نشطة
      const activeShift = this.db
        .prepare('SELECT * FROM shifts WHERE status = ?')
        .get('open');

      if (!activeShift) {
        return {
          success: false,
          error: 'لا توجد وردية نشطة. يجب فتح وردية أولاً'
        };
      }

      // التحقق من الطلب
      if (!req.items || req.items.length === 0) {
        return {
          success: false,
          error: 'الطلب فارغ'
        };
      }

      // حساب الإجمالي
      let totalAmount = 0;
      const orderItems: any[] = [];

      for (const item of req.items) {
        const menuItem = this.db
          .prepare('SELECT * FROM items WHERE id = ? AND is_active = 1')
          .get(item.item_id);

        if (!menuItem) {
          return {
            success: false,
            error: `الصنف غير موجود أو غير نشط`
          };
        }

        if (item.quantity <= 0) {
          return {
            success: false,
            error: 'الكمية يجب أن تكون أكبر من صفر'
          };
        }

        const subtotal = menuItem.price * item.quantity;
        totalAmount += subtotal;

        orderItems.push({
          item_id: item.item_id,
          quantity: item.quantity,
          unit_price: menuItem.price,
          subtotal
        });
      }

      // إنشاء الطلب في transaction
      const createOrderStmt = this.db.prepare(`
        INSERT INTO orders (shift_id, cashier_id, total_amount, payment_method, notes)
        VALUES (?, ?, ?, ?, ?)
      `);

      const createOrderItemStmt = this.db.prepare(`
        INSERT INTO order_items (order_id, item_id, quantity, unit_price, subtotal)
        VALUES (?, ?, ?, ?, ?)
      `);

      const result = this.db.transaction(() => {
        const orderResult = createOrderStmt.run(
          activeShift.id,
          userId,
          totalAmount,
          req.payment_method || 'cash',
          req.notes || null
        );

        const orderId = orderResult.lastInsertRowid;

        for (const item of orderItems) {
          createOrderItemStmt.run(
            orderId,
            item.item_id,
            item.quantity,
            item.unit_price,
            item.subtotal
          );
        }

        return orderId;
      })();

      const order = this.db
        .prepare('SELECT * FROM orders WHERE id = ?')
        .get(result) as Order;

      // تسجيل في Audit Log
      await this.auditLog.log({
        user_id: userId,
        action: 'CREATE_ORDER',
        table_name: 'orders',
        record_id: order.id,
        new_values: { order, items: orderItems }
      });

      return {
        success: true,
        data: order
      };
    } catch (error) {
      console.error('Create order error:', error);
      return {
        success: false,
        error: 'فشل في إنشاء الطلب'
      };
    }
  }

  async getOrders(filters?: { shift_id?: number; limit?: number }): Promise<ApiResponse<Order[]>> {
    try {
      let query = 'SELECT * FROM orders WHERE 1=1';
      const params: any[] = [];

      if (filters?.shift_id) {
        query += ' AND shift_id = ?';
        params.push(filters.shift_id);
      }

      query += ' ORDER BY created_at DESC';

      if (filters?.limit) {
        query += ' LIMIT ?';
        params.push(filters.limit);
      }

      const orders = this.db.prepare(query).all(...params) as Order[];

      return {
        success: true,
        data: orders
      };
    } catch (error) {
      console.error('Get orders error:', error);
      return {
        success: false,
        error: 'فشل في جلب الطلبات'
      };
    }
  }
}
