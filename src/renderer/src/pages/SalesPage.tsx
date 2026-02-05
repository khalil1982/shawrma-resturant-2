import { useEffect, useState } from 'react';
import { ShoppingCart, AlertCircle } from 'lucide-react';
import { useShiftStore } from '../stores/shift.store';
import { useAuthStore } from '../stores/auth.store';
import toast from 'react-hot-toast';
import type { Item, Category } from '@shared/types';

export default function SalesPage() {
  const { user } = useAuthStore();
  const { currentShift } = useShiftStore();

  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [cart, setCart] = useState<Array<{ item: Item; quantity: number }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    setIsLoading(true);
    try {
      const [categoriesRes, itemsRes] = await Promise.all([
        window.api.getCategories(),
        window.api.getItems()
      ]);

      if (categoriesRes.success && categoriesRes.data) {
        setCategories(categoriesRes.data);
      }

      if (itemsRes.success && itemsRes.data) {
        setItems(itemsRes.data);
      }
    } catch (error) {
      toast.error('فشل في تحميل الأصناف');
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = (item: Item) => {
    if (!currentShift) {
      toast.error('يجب فتح وردية أولاً');
      return;
    }

    setCart(prev => {
      const existing = prev.find(c => c.item.id === item.id);
      if (existing) {
        return prev.map(c =>
          c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const updateQuantity = (itemId: number, quantity: number) => {
    if (quantity <= 0) {
      setCart(prev => prev.filter(c => c.item.id !== itemId));
    } else {
      setCart(prev =>
        prev.map(c => (c.item.id === itemId ? { ...c, quantity } : c))
      );
    }
  };

  const calculateTotal = () => {
    return cart.reduce((sum, c) => sum + c.item.price * c.quantity, 0);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('السلة فارغة');
      return;
    }

    if (!currentShift || !user) {
      toast.error('يجب فتح وردية أولاً');
      return;
    }

    setIsLoading(true);
    try {
      const response = await window.api.createOrder({
        data: {
          items: cart.map(c => ({
            item_id: c.item.id,
            quantity: c.quantity
          }))
        },
        userId: user.id
      });

      if (response.success) {
        toast.success(`تم إنشاء الطلب #${response.data?.id} بنجاح`);
        setCart([]);
      } else {
        toast.error(response.error || 'فشل في إنشاء الطلب');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء إنشاء الطلب');
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentShift) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
          <h2 className="text-2xl font-bold text-foreground mb-2">
            لا توجد وردية نشطة
          </h2>
          <p className="text-muted-foreground">
            يجب على المدير فتح وردية قبل البدء في تسجيل المبيعات
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-6 h-full">
      {/* Items Panel */}
      <div className="flex-1 overflow-y-auto">
        <h2 className="text-2xl font-bold text-foreground mb-4">الأصناف</h2>

        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">جاري التحميل...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {categories.map(category => (
              <div key={category.id}>
                <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                  <span>{category.icon}</span>
                  <span>{category.name_ar}</span>
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {items
                    .filter(item => item.category_id === category.id)
                    .map(item => (
                      <button
                        key={item.id}
                        onClick={() => addToCart(item)}
                        className="bg-card border border-border rounded-lg p-4 hover:border-primary transition-colors text-right"
                      >
                        <div className="text-2xl mb-2">{item.icon}</div>
                        <div className="font-medium text-foreground mb-1">
                          {item.name_ar}
                        </div>
                        <div className="text-primary font-bold">
                          {item.price.toFixed(2)} ريال
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cart Panel */}
      <div className="w-96 bg-card border border-border rounded-lg p-6 flex flex-col">
        <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
          <ShoppingCart className="w-5 h-5" />
          <span>الطلب الحالي</span>
        </h2>

        {cart.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>السلة فارغة</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto space-y-3 mb-4">
              {cart.map(({ item, quantity }) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between border-b border-border pb-3"
                >
                  <div className="flex-1">
                    <div className="font-medium text-foreground">{item.name_ar}</div>
                    <div className="text-sm text-muted-foreground">
                      {item.price.toFixed(2)} ريال
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.id, quantity - 1)}
                      className="w-8 h-8 rounded border border-border hover:bg-muted"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-medium">{quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, quantity + 1)}
                      className="w-8 h-8 rounded border border-border hover:bg-muted"
                    >
                      +
                    </button>
                  </div>

                  <div className="w-20 text-left font-bold text-foreground">
                    {(item.price * quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-4 space-y-4">
              <div className="flex items-center justify-between text-xl font-bold">
                <span className="text-foreground">الإجمالي:</span>
                <span className="text-primary">{calculateTotal().toFixed(2)} ريال</span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setCart([])}
                  className="flex-1 bg-destructive/10 text-destructive hover:bg-destructive/20 py-3 rounded-lg font-medium transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleCheckout}
                  disabled={isLoading}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'جاري الحفظ...' : 'تأكيد'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
