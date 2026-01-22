import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../stores/auth.store';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading, error } = useAuthStore();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password) {
      toast.error('يرجى إدخال اسم المستخدم وكلمة المرور');
      return;
    }

    const success = await login(username, password);

    if (success) {
      toast.success('تم تسجيل الدخول بنجاح');
      navigate('/');
    } else {
      toast.error(error || 'فشل تسجيل الدخول');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
      <div className="w-full max-w-md p-8">
        <div className="bg-white dark:bg-card rounded-lg shadow-2xl p-8">
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🍗</div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              مطعم الشاورما
            </h1>
            <p className="text-muted-foreground">
              نظام إدارة المطعم
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-foreground mb-2"
              >
                اسم المستخدم
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                placeholder="أدخل اسم المستخدم"
                disabled={isLoading}
                autoFocus
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-foreground mb-2"
              >
                كلمة المرور
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                placeholder="أدخل كلمة المرور"
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
            </button>
          </form>

          {/* Hints */}
          <div className="mt-6 p-4 bg-muted rounded-md">
            <p className="text-sm text-muted-foreground text-center">
              <strong>للتجربة:</strong>
            </p>
            <p className="text-sm text-muted-foreground text-center mt-1">
              مدير: admin / admin123
            </p>
            <p className="text-sm text-muted-foreground text-center">
              كاشير: cashier / cashier123
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            نظام إدارة مطعم الشاورما © 2024
          </p>
        </div>
      </div>
    </div>
  );
}
