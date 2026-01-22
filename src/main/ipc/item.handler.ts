import { ipcMain } from 'electron';
import Database from 'better-sqlite3';
import { ItemService } from '../services/item.service';

export function registerItemHandlers(db: Database.Database) {
  const itemService = new ItemService(db);

  // جلب جميع الأصناف
  ipcMain.handle('items:list', async () => {
    try {
      return await itemService.getItems();
    } catch (error) {
      console.error('IPC items:list error:', error);
      return {
        success: false,
        error: 'فشل في جلب الأصناف'
      };
    }
  });

  // جلب جميع الفئات
  ipcMain.handle('categories:list', async () => {
    try {
      return await itemService.getCategories();
    } catch (error) {
      console.error('IPC categories:list error:', error);
      return {
        success: false,
        error: 'فشل في جلب الفئات'
      };
    }
  });

  // جلب الأصناف حسب الفئة
  ipcMain.handle('items:byCategory', async (event, categoryId: number) => {
    try {
      return await itemService.getItemsByCategory(categoryId);
    } catch (error) {
      console.error('IPC items:byCategory error:', error);
      return {
        success: false,
        error: 'فشل في جلب الأصناف'
      };
    }
  });
}
