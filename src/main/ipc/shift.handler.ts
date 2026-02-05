import { ipcMain } from 'electron';
import Database from 'better-sqlite3';
import { ShiftService } from '../services/shift.service';
import { AuditLogService } from '../services/audit-log.service';
import { OpenShiftRequest, CloseShiftRequest } from '@shared/types';

export function registerShiftHandlers(db: Database.Database) {
  const auditLog = new AuditLogService(db);
  const shiftService = new ShiftService(db, auditLog);

  // الحصول على الوردية الحالية
  ipcMain.handle('shift:getCurrent', async () => {
    try {
      return await shiftService.getCurrentShift();
    } catch (error) {
      console.error('IPC shift:getCurrent error:', error);
      return {
        success: false,
        error: 'فشل في جلب الوردية الحالية'
      };
    }
  });

  // فتح وردية جديدة
  ipcMain.handle('shift:open', async (event, { data, userId }: { data: OpenShiftRequest; userId: number }) => {
    try {
      return await shiftService.openShift(data, userId);
    } catch (error) {
      console.error('IPC shift:open error:', error);
      return {
        success: false,
        error: 'فشل في فتح الوردية'
      };
    }
  });

  // إغلاق وردية
  ipcMain.handle('shift:close', async (event, { data, userId }: { data: CloseShiftRequest; userId: number }) => {
    try {
      return await shiftService.closeShift(data, userId);
    } catch (error) {
      console.error('IPC shift:close error:', error);
      return {
        success: false,
        error: 'فشل في إغلاق الوردية'
      };
    }
  });

  // الحصول على ملخص وردية
  ipcMain.handle('shift:getSummary', async (event, shiftId: number) => {
    try {
      return await shiftService.getShiftSummary(shiftId);
    } catch (error) {
      console.error('IPC shift:getSummary error:', error);
      return {
        success: false,
        error: 'فشل في جلب ملخص الوردية'
      };
    }
  });
}
