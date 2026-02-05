import { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, ShoppingBag, Clock } from 'lucide-react';
import { useShiftStore } from '../stores/shift.store';
import { useAuthStore } from '../stores/auth.store';

export default function HomePage() {
  const { user } = useAuthStore();
  const { currentShift, summary, loadCurrentShift, loadShiftSummary } = useShiftStore();

  useEffect(() => {
    loadCurrentShift();
  }, [loadCurrentShift]);

  useEffect(() => {
    if (currentShift) {
      loadShiftSummary(currentShift.id);
    }
  }, [currentShift, loadShiftSummary]);

  const stats = [
    {
      title: 'إجمالي المبيعات',
      value: summary ? `${summary.total_sales.toFixed(2)} ريال` : '0.00 ريال',
      icon: DollarSign,
      color: 'bg-green-500'
    },
    {
      title: 'عدد الطلبات',
      value: summary?.total_orders || 0,
      icon: ShoppingBag,
      color: 'bg-blue-500'
    },
    {
      title: 'المصاريف',
      value: summary ? `${summary.total_expenses.toFixed(2)} ريال` : '0.00 ريال',
      icon: TrendingUp,
      color: 'bg-red-500'
    },
    {
      title: 'الوردية',
      value: currentShift ? (currentShift.type === 'morning' ? 'صباحية' : 'مسائية') : 'غير نشطة',
      icon: Clock,
      color: 'bg-purple-500'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          مرحباً، {user?.full_name} 👋
        </h1>
        <p className="text-muted-foreground mt-2">
          هذا ملخص لأداء {currentShift ? 'الوردية الحالية' : 'اليوم'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-card border border-border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              </div>
              <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-xl font-bold text-foreground mb-4">إجراءات سريعة</h2>

        {!currentShift ? (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <p className="text-yellow-600 font-medium">
              ⚠️ لا توجد وردية نشطة. يجب على المدير فتح وردية للبدء في تسجيل المبيعات.
            </p>
          </div>
        ) : (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 font-medium">✅ الوردية نشطة</p>
                <p className="text-sm text-muted-foreground mt-1">
                  رصيد البداية: {currentShift.opening_balance.toFixed(2)} ريال
                </p>
              </div>
              <div className="text-left">
                <p className="text-sm text-muted-foreground">الرصيد المتوقع</p>
                <p className="text-2xl font-bold text-foreground">
                  {summary
                    ? (currentShift.opening_balance + summary.total_sales - summary.total_expenses).toFixed(2)
                    : currentShift.opening_balance.toFixed(2)
                  } ريال
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-xl font-bold text-foreground mb-4">النشاط الأخير</h2>
        <div className="text-center py-8 text-muted-foreground">
          <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>لا توجد نشاطات حديثة</p>
        </div>
      </div>
    </div>
  );
}
