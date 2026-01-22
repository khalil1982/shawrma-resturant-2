import Database from 'better-sqlite3';
import path from 'path';
import { schema } from './schema';
import { seedData } from './seed-data';

export class DatabaseService {
  private db: Database.Database | null = null;
  private dbPath: string;

  constructor(userDataPath: string) {
    this.dbPath = path.join(userDataPath, 'shawarma.db');
  }

  async initialize(): Promise<void> {
    try {
      // Open database connection
      this.db = new Database(this.dbPath);

      // Enable foreign keys
      this.db.pragma('foreign_keys = ON');

      console.log('Database opened at:', this.dbPath);

      // Create tables if they don't exist
      this.createTables();

      // Seed initial data if database is empty
      await this.seedIfEmpty();

      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  private createTables(): void {
    if (!this.db) throw new Error('Database not initialized');

    // Execute schema
    this.db.exec(schema);

    console.log('Database tables created/verified');
  }

  private async seedIfEmpty(): Promise<void> {
    if (!this.db) return;

    // Check if there are any users
    const userCount = this.db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };

    if (userCount.count === 0) {
      console.log('Database is empty, seeding initial data...');

      // Seed users
      const insertUser = this.db.prepare(`
        INSERT INTO users (username, password_hash, role, full_name)
        VALUES (?, ?, ?, ?)
      `);

      for (const user of seedData.users) {
        insertUser.run(user.username, user.password_hash, user.role, user.full_name);
      }

      // Seed categories
      const insertCategory = this.db.prepare(`
        INSERT INTO categories (name, name_ar, icon, sort_order)
        VALUES (?, ?, ?, ?)
      `);

      for (const category of seedData.categories) {
        insertCategory.run(category.name, category.name_ar, category.icon, category.sort_order);
      }

      // Seed items
      const insertItem = this.db.prepare(`
        INSERT INTO items (category_id, name, name_ar, price, icon, sort_order)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      for (const item of seedData.items) {
        insertItem.run(
          item.category_id,
          item.name,
          item.name_ar,
          item.price,
          item.icon || null,
          item.sort_order || 0
        );
      }

      console.log('Initial data seeded successfully');
    }
  }

  getDatabase(): Database.Database {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      console.log('Database connection closed');
    }
  }
}
