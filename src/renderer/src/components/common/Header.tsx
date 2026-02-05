import { useEffect } from 'react';
import { Clock, AlertCircle } from 'lucide-react';
import { useShiftStore } from '../../stores/shift.store';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function Header() {
  const { currentShift, loadCurrentShift } = useShiftStore();

  useEffect(() => {
    // Refresh shift every minute
    const interval = setInterval(() => {
      loadCurrentShift();
    }, 60000);

    return () => clearInterval(interval);
  }, [loadCurrentShift]);

  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Current Time */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="w-5 h-5" />
          <span className="font-medium">
            {format(new Date(), 'EEEE، d MMMM yyyy - HH:mm', { locale: ar })}
          </span>
        </div>

        {/* Shift Status */}
        <div>
          {currentShift ? (
            <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-600 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="font-medium">
                وردية {currentShift.type === 'morning' ? 'صباحية' : 'مسائية'} نشطة
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 text-yellow-600 rounded-lg">
              <AlertCircle className="w-4 h-4" />
              <span className="font-medium">لا توجد وردية نشطة</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
