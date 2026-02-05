import { ipcMain } from 'electron';
import Database from 'better-sqlite3';
import { AuthService } from '../services/auth.service';
import { AuditLogService } from '../services/audit-log.service';
import { LoginRequest } from '@shared/types';

export function registerAuthHandlers(db: Database.Database) {
  const auditLog = new AuditLogService(db);
  const authService = new AuthService(db, auditLog);

  // تسجيل الدخول
  ipcMain.handle('auth:login', async (event, req: LoginRequest) => {
    try {
      return await authService.login(req);
    } catch (error) {
      console.error('IPC auth:login error:', error);
      return {
        success: false,
        error: 'حدث خطأ أثناء تسجيل الدخول'
      };
    }
  });

  // تسجيل الخروج
  ipcMain.handle('auth:logout', async (event, userId: number) => {
    try {
      await authService.logout(userId);
      return { success: true };
    } catch (error) {
      console.error('IPC auth:logout error:', error);
      return {
        success: false,
        error: 'حدث خطأ أثناء تسجيل الخروج'
      };
    }
  });
}
