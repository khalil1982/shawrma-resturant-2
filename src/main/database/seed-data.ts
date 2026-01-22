import bcrypt from 'bcrypt';

// Note: في الإنتاج الفعلي، يجب تشفير كلمات المرور بشكل آمن
// هنا نستخدم كلمة مرور بسيطة للتطوير: "admin123" و "cashier123"
const adminPasswordHash = bcrypt.hashSync('admin123', 10);
const cashierPasswordHash = bcrypt.hashSync('cashier123', 10);

export const seedData = {
  users: [
    {
      username: 'admin',
      password_hash: adminPasswordHash,
      role: 'admin',
      full_name: 'المدير'
    },
    {
      username: 'cashier',
      password_hash: cashierPasswordHash,
      role: 'cashier',
      full_name: 'الكاشير'
    }
  ],

  categories: [
    {
      name: 'Shawarma',
      name_ar: 'شاورما',
      icon: '🍗',
      sort_order: 1
    },
    {
      name: 'Drinks',
      name_ar: 'مشروبات',
      icon: '🥤',
      sort_order: 2
    },
    {
      name: 'Extras',
      name_ar: 'إضافات',
      icon: '🍟',
      sort_order: 3
    }
  ],

  items: [
    // شاورما (category_id: 1)
    {
      category_id: 1,
      name: 'Chicken Shawarma',
      name_ar: 'شاورما دجاج',
      price: 15.00,
      icon: '🍗',
      sort_order: 1
    },
    {
      category_id: 1,
      name: 'Meat Shawarma',
      name_ar: 'شاورما لحم',
      price: 18.00,
      icon: '🥩',
      sort_order: 2
    },
    {
      category_id: 1,
      name: 'Mixed Shawarma',
      name_ar: 'شاورما مشكل',
      price: 20.00,
      icon: '🌯',
      sort_order: 3
    },

    // مشروبات (category_id: 2)
    {
      category_id: 2,
      name: 'Cola',
      name_ar: 'كولا',
      price: 3.00,
      icon: '🥤',
      sort_order: 1
    },
    {
      category_id: 2,
      name: 'Pepsi',
      name_ar: 'بيبسي',
      price: 3.00,
      icon: '🥤',
      sort_order: 2
    },
    {
      category_id: 2,
      name: 'Water',
      name_ar: 'ماء',
      price: 1.50,
      icon: '💧',
      sort_order: 3
    },
    {
      category_id: 2,
      name: 'Orange Juice',
      name_ar: 'عصير برتقال',
      price: 5.00,
      icon: '🍊',
      sort_order: 4
    },

    // إضافات (category_id: 3)
    {
      category_id: 3,
      name: 'French Fries',
      name_ar: 'بطاطس مقلية',
      price: 5.00,
      icon: '🍟',
      sort_order: 1
    },
    {
      category_id: 3,
      name: 'Extra Bread',
      name_ar: 'خبز إضافي',
      price: 1.00,
      icon: '🥖',
      sort_order: 2
    },
    {
      category_id: 3,
      name: 'Garlic Sauce',
      name_ar: 'صوص ثوم',
      price: 2.00,
      icon: '🧄',
      sort_order: 3
    },
    {
      category_id: 3,
      name: 'Pickles',
      name_ar: 'مخلل',
      price: 2.00,
      icon: '🥒',
      sort_order: 4
    }
  ]
};
