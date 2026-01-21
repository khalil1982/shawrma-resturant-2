const { all, get, run } = require("../db");

/**
 * Repository لإدارة الفئات والأصناف
 */

// ==================== الفئات (Categories) ====================

/**
 * الحصول على جميع الفئات النشطة
 */
const getAllCategories = async () => {
  try {
    return await all(
      `SELECT * FROM categories
       WHERE is_active = 1
       ORDER BY display_order ASC, name ASC`
    );
  } catch (error) {
    console.error("خطأ في getAllCategories:", error);
    throw error;
  }
};

/**
 * الحصول على فئة بالمعرف
 */
const getCategoryById = async (categoryId) => {
  try {
    return await get(
      `SELECT * FROM categories WHERE id = ?`,
      [categoryId]
    );
  } catch (error) {
    console.error("خطأ في getCategoryById:", error);
    throw error;
  }
};

// ==================== الأصناف (Menu Items) ====================

/**
 * الحصول على جميع الأصناف النشطة
 */
const getAllMenuItems = async () => {
  try {
    return await all(
      `SELECT
        mi.*,
        c.name as category_name,
        c.icon as category_icon
       FROM menu_items mi
       INNER JOIN categories c ON mi.category_id = c.id
       WHERE mi.is_active = 1 AND c.is_active = 1
       ORDER BY c.display_order ASC, mi.display_order ASC, mi.name ASC`
    );
  } catch (error) {
    console.error("خطأ في getAllMenuItems:", error);
    throw error;
  }
};

/**
 * الحصول على أصناف فئة معينة
 */
const getMenuItemsByCategory = async (categoryId) => {
  try {
    return await all(
      `SELECT * FROM menu_items
       WHERE category_id = ? AND is_active = 1 AND is_available = 1
       ORDER BY display_order ASC, name ASC`,
      [categoryId]
    );
  } catch (error) {
    console.error("خطأ في getMenuItemsByCategory:", error);
    throw error;
  }
};

/**
 * الحصول على صنف بالمعرف
 */
const getMenuItemById = async (itemId) => {
  try {
    return await get(
      `SELECT
        mi.*,
        c.name as category_name,
        c.icon as category_icon
       FROM menu_items mi
       INNER JOIN categories c ON mi.category_id = c.id
       WHERE mi.id = ?`,
      [itemId]
    );
  } catch (error) {
    console.error("خطأ في getMenuItemById:", error);
    throw error;
  }
};

/**
 * الحصول على الأصناف المتاحة فقط
 */
const getAvailableMenuItems = async () => {
  try {
    return await all(
      `SELECT
        mi.*,
        c.name as category_name,
        c.icon as category_icon
       FROM menu_items mi
       INNER JOIN categories c ON mi.category_id = c.id
       WHERE mi.is_active = 1
         AND mi.is_available = 1
         AND c.is_active = 1
       ORDER BY c.display_order ASC, mi.display_order ASC`
    );
  } catch (error) {
    console.error("خطأ في getAvailableMenuItems:", error);
    throw error;
  }
};

/**
 * البحث في الأصناف
 */
const searchMenuItems = async (searchTerm) => {
  try {
    const term = `%${searchTerm}%`;
    return await all(
      `SELECT
        mi.*,
        c.name as category_name
       FROM menu_items mi
       INNER JOIN categories c ON mi.category_id = c.id
       WHERE (mi.name LIKE ? OR mi.name_en LIKE ? OR mi.sku LIKE ?)
         AND mi.is_active = 1
         AND c.is_active = 1
       ORDER BY mi.name ASC
       LIMIT 20`,
      [term, term, term]
    );
  } catch (error) {
    console.error("خطأ في searchMenuItems:", error);
    throw error;
  }
};

/**
 * تحديث توفر صنف
 */
const updateMenuItemAvailability = async (itemId, isAvailable) => {
  try {
    await run(
      `UPDATE menu_items
       SET is_available = ?, updated_at = datetime('now')
       WHERE id = ?`,
      [isAvailable ? 1 : 0, itemId]
    );
    return true;
  } catch (error) {
    console.error("خطأ في updateMenuItemAvailability:", error);
    throw error;
  }
};

// ==================== خيارات الأصناف ====================

/**
 * الحصول على خيارات صنف معين
 */
const getMenuItemOptions = async (menuItemId) => {
  try {
    return await all(
      `SELECT * FROM menu_item_options
       WHERE menu_item_id = ? AND is_available = 1
       ORDER BY option_type, option_name`,
      [menuItemId]
    );
  } catch (error) {
    console.error("خطأ في getMenuItemOptions:", error);
    throw error;
  }
};

/**
 * إنشاء صنف جديد (للAdmin)
 */
const createMenuItem = async (itemData) => {
  try {
    const result = await run(
      `INSERT INTO menu_items (
        category_id, name, name_en, description,
        price, cost, sku, display_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        itemData.category_id,
        itemData.name,
        itemData.name_en || null,
        itemData.description || null,
        itemData.price,
        itemData.cost || null,
        itemData.sku || null,
        itemData.display_order || 0,
      ]
    );
    return result.lastID;
  } catch (error) {
    console.error("خطأ في createMenuItem:", error);
    throw error;
  }
};

/**
 * تحديث صنف (للAdmin)
 */
const updateMenuItem = async (itemId, itemData) => {
  try {
    await run(
      `UPDATE menu_items
       SET name = ?,
           name_en = ?,
           description = ?,
           price = ?,
           cost = ?,
           category_id = ?,
           display_order = ?,
           updated_at = datetime('now')
       WHERE id = ?`,
      [
        itemData.name,
        itemData.name_en || null,
        itemData.description || null,
        itemData.price,
        itemData.cost || null,
        itemData.category_id,
        itemData.display_order || 0,
        itemId,
      ]
    );
    return true;
  } catch (error) {
    console.error("خطأ في updateMenuItem:", error);
    throw error;
  }
};

/**
 * حذف صنف (soft delete للAdmin)
 */
const deleteMenuItem = async (itemId) => {
  try {
    await run(
      `UPDATE menu_items
       SET is_active = 0, updated_at = datetime('now')
       WHERE id = ?`,
      [itemId]
    );
    return true;
  } catch (error) {
    console.error("خطأ في deleteMenuItem:", error);
    throw error;
  }
};

/**
 * الحصول على الأصناف مع عدد مبيعاتها (للتقارير)
 */
const getMenuItemsWithSalesCount = async (startDate, endDate) => {
  try {
    return await all(
      `SELECT
        mi.id,
        mi.name,
        mi.price,
        COUNT(oi.id) as sales_count,
        SUM(oi.quantity) as total_quantity,
        SUM(oi.line_total) as total_sales
       FROM menu_items mi
       LEFT JOIN order_items oi ON mi.id = oi.menu_item_id
       LEFT JOIN orders o ON oi.order_id = o.id
       WHERE o.status = 'completed'
         AND o.created_at >= ?
         AND o.created_at <= ?
       GROUP BY mi.id
       ORDER BY total_sales DESC`,
      [startDate, endDate]
    );
  } catch (error) {
    console.error("خطأ في getMenuItemsWithSalesCount:", error);
    throw error;
  }
};

module.exports = {
  // Categories
  getAllCategories,
  getCategoryById,

  // Menu Items
  getAllMenuItems,
  getMenuItemsByCategory,
  getMenuItemById,
  getAvailableMenuItems,
  searchMenuItems,
  updateMenuItemAvailability,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getMenuItemsWithSalesCount,

  // Options
  getMenuItemOptions,
};
