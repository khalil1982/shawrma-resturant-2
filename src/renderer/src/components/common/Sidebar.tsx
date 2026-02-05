import { NavLink } from 'react-router-dom';
import { Home, ShoppingCart, Clock, LogOut } from 'lucide-react';
import { useAuthStore } from '../../stores/auth.store';
import toast from 'react-hot-toast';

export default function Sidebar() {
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    toast.success('تم تسجيل الخروج بنجاح');
  };

  const navItems = [
    {
      to: '/',
      icon: Home,
      label: 'الرئيسية',
      roles: ['admin', 'cashier']
    },
    {
      to: '/sales',
      icon: ShoppingCart,
      label: 'المبيعات',
      roles: ['admin', 'cashier']
    },
    {
      to: '/shifts',
      icon: Clock,
      label: 'الورديات',
      roles: ['admin']
    }
  ];

  const filteredNavItems = navItems.filter(item =>
    item.roles.includes(user?.role || '')
  );

  return (
    <aside className="w-64 bg-card border-l border-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="text-4xl">🍗</div>
          <div>
            <h2 className="text-xl font-bold text-foreground">الشاورما</h2>
            <p className="text-sm text-muted-foreground">نظام الإدارة</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-primary font-bold">
              {user?.full_name?.charAt(0)}
            </span>
          </div>
          <div className="flex-1">
            <p className="font-medium text-foreground">{user?.full_name}</p>
            <p className="text-sm text-muted-foreground">
              {user?.role === 'admin' ? 'مدير' : 'كاشير'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {filteredNavItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-border">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg w-full text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  );
}
