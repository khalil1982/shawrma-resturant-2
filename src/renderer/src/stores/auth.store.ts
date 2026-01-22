import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@shared/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (username: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await window.api.login(username, password);

          if (response.success && response.user && response.token) {
            set({
              user: response.user,
              token: response.token,
              isAuthenticated: true,
              isLoading: false,
              error: null
            });
            return true;
          } else {
            set({
              error: response.error || 'فشل تسجيل الدخول',
              isLoading: false
            });
            return false;
          }
        } catch (error) {
          set({
            error: 'حدث خطأ أثناء تسجيل الدخول',
            isLoading: false
          });
          return false;
        }
      },

      logout: async () => {
        const { user } = get();
        if (user) {
          await window.api.logout();
        }

        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null
        });
      },

      clearError: () => set({ error: null })
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);
