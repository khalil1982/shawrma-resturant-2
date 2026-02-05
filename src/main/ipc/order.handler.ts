import { ipcMain } from 'electron';
import Database from 'better-sqlite3';
import { OrderService } from '../services/order.service';
import { AuditLogService } from '../services/audit-log.service';
import { CreateOrderRequest } from '@shared/types';

export function registerOrderHandlers(db: Database.Database) {
  const auditLog = new AuditLogService(db);
  const orderService = new OrderService(db, auditLog);

  // إنشاء طلب جديد
  ipcMain.handle('order:create', async (event, { data, userId }: { data: CreateOrderRequest; userId: number }) => {
    try {
      return await orderService.createOrder(data, userId);
    } catch (error) {
      console.error('IPC order:create error:', error);
      return {
        success: false,
        error: 'فشل في إنشاء الطلب'
      };
    }
  });

  // جلب الطلبات
  ipcMain.handle('order:list', async (event, filters?: any) => {
    try {
      return await orderService.getOrders(filters);
    } catch (error) {
      console.error('IPC order:list error:', error);
      return {
        success: false,
        error: 'فشل في جلب الطلبات'
      };
    }
  });
}
