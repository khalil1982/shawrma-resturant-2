import { useState, useEffect } from 'react';
import { Clock, DollarSign } from 'lucide-react';
import { useShiftStore } from '../stores/shift.store';
import { useAuthStore } from '../stores/auth.store';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function ShiftsPage() {
  const { user } = useAuthStore();
  const { currentShift, summary, loadCurrentShift, loadShiftSummary, openShift, closeShift } = useShiftStore();

  const [shiftType, setShiftType] = useState<'morning' | 'evening'>('morning');
  const [openingBalance, setOpeningBalance] = useState('0');
  const [actualBalance, setActualBalance] = useState('');
  const [differenceReason, setDifferenceReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadCurrentShift();
  }, [loadCurrentShift]);

  useEffect(() => {
    if (currentShift) {
      loadShiftSummary(currentShift.id);
    }
  }, [currentShift, loadShiftSummary]);

  const handleOpenShift = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    setIsLoading(true);
    const success = await openShift(shiftType, parseFloat(openingBalance), user.id);
    setIsLoading(false);

    if (success) {
      toast.success('تم فتح الوردية بنجاح');
      setOpeningBalance('0');
    } else {
      toast.error('فشل في فتح الوردية');
    }
  };

  const handleCloseShift = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !currentShift) return;

    const actualBalanceNum = parseFloat(actualBalance);
    if (isNaN(actualBalanceNum)) {
      toast.error('يرجى إدخال رصيد فعلي صحيح');
      return;
    }

    const expectedBalance = summary
      ? currentShift.opening_balance + summary.total_sales - summary.total_expenses
      : currentShift.opening_balance;

    const difference = actualBalanceNum - expectedBalance;

    if (Math.abs(difference) > 0.01 && !differenceReason.trim()) {
      toast.error('يجب إدخال سبب الفرق');
      return;
    }

    setIsLoading(true);
    const success = await closeShift(
      currentShift.id,
      actualBalanceNum,
      differenceReason || undefined,
      user.id
    );
    setIsLoading(false);

    if (success) {
      toast.success('تم إغلاق الوردية بنجاح');
      setActualBalance('');
      setDifferenceReason('');
    } else {
      toast.error('فشل في إغلاق الوردية');
    }
  };

  const expectedBalance = summary && currentShift
    ? currentShift.opening_balance + summary.total_sales - summary.total_expenses
    : 0;

  const difference = actualBalance
    ? parseFloat(actualBalance) - expectedBalance
    : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">إدارة الورديات</h1>
        <p className="text-muted-foreground mt-2">فتح وإغلاق الورديات اليومية</p>
      </div>

      {/* Current Shift Status */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          <span>حالة الوردية</span>
        </h2>

        {currentShift ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-600 rounded-lg w-fit">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="font-medium">
                وردية {currentShift.type === 'morning' ? 'صباحية' : 'مسائية'} نشطة
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">وقت الفتح</p>
                <p className="font-medium text-foreground">
                  {format(new Date(currentShift.opened_at), 'HH:mm', { locale: ar })}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">رصيد البداية</p>
                <p className="font-medium text-foreground">
                  {currentShift.opening_balance.toFixed(2)} ريال
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">إجمالي المبيعات</p>
                <p className="font-medium text-green-600">
                  {summary ? summary.total_sales.toFixed(2) : '0.00'} ريال
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">الرصيد المتوقع</p>
                <p className="font-medium text-foreground">
                  {expectedBalance.toFixed(2)} ريال
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>لا توجد وردية نشطة</p>
          </div>
        )}
      </div>

      {/* Open Shift Form */}
      {!currentShift && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-bold text-foreground mb-4">فتح وردية جديدة</h2>

          <form onSubmit={handleOpenShift} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                نوع الوردية
              </label>
              <select
                value={shiftType}
                onChange={(e) => setShiftType(e.target.value as 'morning' | 'evening')}
                className="w-full px-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
              >
                <option value="morning">صباحية (6:00 - 14:00)</option>
                <option value="evening">مسائية (14:00 - 22:00)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                رصيد البداية (ريال)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                className="w-full px-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                placeholder="0.00"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {isLoading ? 'جاري الفتح...' : 'فتح الوردية'}
            </button>
          </form>
        </div>
      )}

      {/* Close Shift Form */}
      {currentShift && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-bold text-foreground mb-4">إغلاق الوردية</h2>

          <form onSubmit={handleCloseShift} className="space-y-4">
            <div className="bg-muted rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">رصيد البداية:</span>
                <span className="font-medium">{currentShift.opening_balance.toFixed(2)} ريال</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">المبيعات:</span>
                <span className="font-medium text-green-600">
                  +{summary?.total_sales.toFixed(2) || '0.00'} ريال
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">المصاريف:</span>
                <span className="font-medium text-red-600">
                  -{summary?.total_expenses.toFixed(2) || '0.00'} ريال
                </span>
              </div>
              <div className="flex justify-between border-t border-border pt-2">
                <span className="font-medium">الرصيد المتوقع:</span>
                <span className="font-bold text-lg">{expectedBalance.toFixed(2)} ريال</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                الرصيد الفعلي (ريال) *
              </label>
              <input
                type="number"
                step="0.01"
                value={actualBalance}
                onChange={(e) => setActualBalance(e.target.value)}
                className="w-full px-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                placeholder="أدخل الرصيد الفعلي"
                required
              />
            </div>

            {actualBalance && Math.abs(difference) > 0.01 && (
              <>
                <div className={`p-4 rounded-lg ${difference >= 0 ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                  <p className="font-medium">
                    {difference >= 0 ? '+ زيادة' : '- نقص'}: {Math.abs(difference).toFixed(2)} ريال
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    سبب الفرق (إجباري) *
                  </label>
                  <textarea
                    value={differenceReason}
                    onChange={(e) => setDifferenceReason(e.target.value)}
                    className="w-full px-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                    placeholder="يرجى توضيح سبب الفرق بالتفصيل..."
                    rows={3}
                    required
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {isLoading ? 'جاري الإغلاق...' : 'إغلاق الوردية'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
