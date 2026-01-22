import Database from 'better-sqlite3';
import { AuditLogEntry } from '@shared/types';

interface CreateAuditLogEntry {
  user_id: number;
  action: string;
  table_name: string;
  record_id?: number;
  old_values?: any;
  new_values?: any;
  ip_address?: string;
}

export class AuditLogService {
  constructor(private db: Database.Database) {}

  async log(entry: CreateAuditLogEntry): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO audit_log (user_id, action, table_name, record_id, old_values, new_values, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      entry.user_id,
      entry.action,
      entry.table_name,
      entry.record_id || null,
      entry.old_values ? JSON.stringify(entry.old_values) : null,
      entry.new_values ? JSON.stringify(entry.new_values) : null,
      entry.ip_address || null
    );
  }

  getLog(filters?: {
    user_id?: number;
    action?: string;
    from_date?: string;
    to_date?: string;
    limit?: number;
  }): AuditLogEntry[] {
    let query = 'SELECT * FROM audit_log WHERE 1=1';
    const params: any[] = [];

    if (filters?.user_id) {
      query += ' AND user_id = ?';
      params.push(filters.user_id);
    }

    if (filters?.action) {
      query += ' AND action = ?';
      params.push(filters.action);
    }

    if (filters?.from_date) {
      query += ' AND created_at >= ?';
      params.push(filters.from_date);
    }

    if (filters?.to_date) {
      query += ' AND created_at <= ?';
      params.push(filters.to_date);
    }

    query += ' ORDER BY created_at DESC';

    if (filters?.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    } else {
      query += ' LIMIT 100';
    }

    return this.db.prepare(query).all(...params) as AuditLogEntry[];
  }
}
