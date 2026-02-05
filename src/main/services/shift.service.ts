import Database from 'better-sqlite3';
import { Shift, ShiftSummary, OpenShiftRequest, CloseShiftRequest, ApiResponse } from '@shared/types';
import { AuditLogService } from './audit-log.service';

export class ShiftService {
  constructor(
    private db: Database.Database,
    private auditLog: AuditLogService
  ) {}

  async getCurrentShift(): Promise<ApiResponse<Shift>> {
    try {
      const shift = this.db
        .prepare('SELECT * FROM shifts WHERE status = ? LIMIT 1')
        .get('open') as Shift | undefined;

      return {
        success: true,
        data: shift || null
      };
    } catch (error) {
      console.error('Get current shift error:', error);
      return {
        success: false,
        error: 'فشل في جلب الوردية الحالية'
      };
    }
  }

  async getShiftSummary(shiftId: number): Promise<ApiResponse<ShiftSummary>> {
    try {
      const summary = this.db
        .prepare('SELECT * FROM v_shift_summary WHERE id = ?')
        .get(shiftId) as ShiftSummary | undefined;

      if (!summary) {
        return {
          success: false,
          error: 'الوردية غير موجودة'
        };
      }

      return {
        success: true,
        data: summary
      };
    } catch (error) {
      console.error('Get shift summary error:', error);
      return {
        success: false,
        error: 'فشل في جلب ملخص الوردية'
      };
    }
  }

  async openShift(req: OpenShiftRequest, userId: number): Promise<ApiResponse<Shift>> {
    try {
      // التحقق من عدم وجود وردية مفتوحة
      const existingShift = this.db
        .prepare('SELECT * FROM shifts WHERE status = ?')
        .get('open') as Shift | undefined;

      if (existingShift) {
        return {
          success: false,
          error: `هناك وردية ${existingShift.type === 'morning' ? 'صباحية' : 'مسائية'} مفتوحة بالفعل`
        };
      }

      // فتح الوردية
      const stmt = this.db.prepare(`
        INSERT INTO shifts (type, opened_by, opened_at, opening_balance, status)
        VALUES (?, ?, datetime('now'), ?, 'open')
      `);

      const result = stmt.run(
        req.type,
        userId,
        req.opening_balance || 0
      );

      const shift = this.db
        .prepare('SELECT * FROM shifts WHERE id = ?')
        .get(result.lastInsertRowid) as Shift;

      // تسجيل في Audit Log
      await this.auditLog.log({
        user_id: userId,
        action: 'OPEN_SHIFT',
        table_name: 'shifts',
        record_id: shift.id,
        new_values: shift
      });

      return {
        success: true,
        data: shift
      };
    } catch (error) {
      console.error('Open shift error:', error);
      return {
        success: false,
        error: 'فشل في فتح الوردية'
      };
    }
  }

  async closeShift(req: CloseShiftRequest, userId: number): Promise<ApiResponse<Shift>> {
    try {
      // الحصول على الوردية
      const shift = this.db
        .prepare('SELECT * FROM shifts WHERE id = ?')
        .get(req.shift_id) as Shift | undefined;

      if (!shift) {
        return {
          success: false,
          error: 'الوردية غير موجودة'
        };
      }

      if (shift.status !== 'open') {
        return {
          success: false,
          error: 'الوردية مغلقة بالفعل'
        };
      }

      // حساب الرصيد المتوقع
      const summary = this.db
        .prepare('SELECT * FROM v_shift_summary WHERE id = ?')
        .get(shift.id) as ShiftSummary;

      const expectedBalance = shift.opening_balance + summary.total_sales - summary.total_expenses;
      const difference = req.actual_balance - expectedBalance;

      // التحقق من سبب الفرق
      if (Math.abs(difference) > 0.01 && !req.difference_reason) {
        return {
          success: false,
          error: 'يجب إدخال سبب الفرق'
        };
      }

      // إغلاق الوردية
      const updateStmt = this.db.prepare(`
        UPDATE shifts
        SET closed_by = ?,
            closed_at = datetime('now'),
            expected_balance = ?,
            actual_balance = ?,
            difference = ?,
            difference_reason = ?,
            status = 'closed',
            updated_at = datetime('now')
        WHERE id = ?
      `);

      updateStmt.run(
        userId,
        expectedBalance,
        req.actual_balance,
        difference,
        req.difference_reason || null,
        shift.id
      );

      const updatedShift = this.db
        .prepare('SELECT * FROM shifts WHERE id = ?')
        .get(shift.id) as Shift;

      // تسجيل في Audit Log
      await this.auditLog.log({
        user_id: userId,
        action: 'CLOSE_SHIFT',
        table_name: 'shifts',
        record_id: shift.id,
        old_values: shift,
        new_values: updatedShift
      });

      return {
        success: true,
        data: updatedShift
      };
    } catch (error) {
      console.error('Close shift error:', error);
      return {
        success: false,
        error: 'فشل في إغلاق الوردية'
      };
    }
  }
}
