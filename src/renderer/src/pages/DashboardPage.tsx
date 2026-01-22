import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import { useShiftStore } from '../stores/shift.store';

// Components
import Sidebar from '../components/common/Sidebar';
import Header from '../components/common/Header';

// Pages
import HomePage from './HomePage';
import SalesPage from './SalesPage';
import ShiftsPage from './ShiftsPage';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { loadCurrentShift } = useShiftStore();

  useEffect(() => {
    // Load current shift on mount
    loadCurrentShift();
  }, [loadCurrentShift]);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/sales" element={<SalesPage />} />
            <Route path="/shifts" element={<ShiftsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
