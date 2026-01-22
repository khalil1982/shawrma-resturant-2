import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User, LoginRequest, LoginResponse } from '@shared/types';
import { AuditLogService } from './audit-log.service';

const JWT_SECRET = process.env.JWT_SECRET || 'shawarma-secret-key-change-in-production';

export class AuthService {
  constructor(
    private db: Database.Database,
    private auditLog: AuditLogService
  ) {}

  async login(req: LoginRequest): Promise<LoginResponse> {
    try {
      // البحث عن المستخدم
      const user = this.db
        .prepare('SELECT * FROM users WHERE username = ? AND is_active = 1')
        .get(req.username) as User | undefined;

      if (!user) {
        return {
          success: false,
          error: 'اسم المستخدم أو كلمة المرور غير صحيحة'
        };
      }

      // التحقق من كلمة المرور
      const isValidPassword = await bcrypt.compare(req.password, user.password_hash);

      if (!isValidPassword) {
        // تسجيل محاولة فاشلة
        await this.auditLog.log({
          user_id: user.id,
          action: 'LOGIN_FAILED',
          table_name: 'users',
          record_id: user.id
        });

        return {
          success: false,
          error: 'اسم المستخدم أو كلمة المرور غير صحيحة'
        };
      }

      // إنشاء JWT Token
      const token = jwt.sign(
        {
          id: user.id,
          username: user.username,
          role: user.role
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      // تسجيل تسجيل دخول ناجح
      await this.auditLog.log({
        user_id: user.id,
        action: 'LOGIN',
        table_name: 'users',
        record_id: user.id
      });

      // حذف password_hash من النتيجة
      const { password_hash, ...userWithoutPassword } = user;

      return {
        success: true,
        token,
        user: userWithoutPassword as User
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'حدث خطأ أثناء تسجيل الدخول'
      };
    }
  }

  async logout(userId: number): Promise<void> {
    await this.auditLog.log({
      user_id: userId,
      action: 'LOGOUT',
      table_name: 'users',
      record_id: userId
    });
  }

  verifyToken(token: string): any {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
}
