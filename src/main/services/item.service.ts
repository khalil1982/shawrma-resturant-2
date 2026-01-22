import Database from 'better-sqlite3';
import { Item, Category, ApiResponse } from '@shared/types';

export class ItemService {
  constructor(private db: Database.Database) {}

  async getItems(): Promise<ApiResponse<Item[]>> {
    try {
      const items = this.db
        .prepare('SELECT * FROM items WHERE is_active = 1 ORDER BY sort_order, name_ar')
        .all() as Item[];

      return {
        success: true,
        data: items
      };
    } catch (error) {
      console.error('Get items error:', error);
      return {
        success: false,
        error: 'فشل في جلب الأصناف'
      };
    }
  }

  async getCategories(): Promise<ApiResponse<Category[]>> {
    try {
      const categories = this.db
        .prepare('SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order, name_ar')
        .all() as Category[];

      return {
        success: true,
        data: categories
      };
    } catch (error) {
      console.error('Get categories error:', error);
      return {
        success: false,
        error: 'فشل في جلب الفئات'
      };
    }
  }

  async getItemsByCategory(categoryId: number): Promise<ApiResponse<Item[]>> {
    try {
      const items = this.db
        .prepare('SELECT * FROM items WHERE category_id = ? AND is_active = 1 ORDER BY sort_order, name_ar')
        .all(categoryId) as Item[];

      return {
        success: true,
        data: items
      };
    } catch (error) {
      console.error('Get items by category error:', error);
      return {
        success: false,
        error: 'فشل في جلب الأصناف'
      };
    }
  }
}
