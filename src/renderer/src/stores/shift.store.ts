import { create } from 'zustand';
import type { Shift, ShiftSummary } from '@shared/types';

interface ShiftState {
  currentShift: Shift | null;
  summary: ShiftSummary | null;
  isLoading: boolean;
  error: string | null;

  loadCurrentShift: () => Promise<void>;
  loadShiftSummary: (shiftId: number) => Promise<void>;
  openShift: (type: 'morning' | 'evening', openingBalance: number, userId: number) => Promise<boolean>;
  closeShift: (shiftId: number, actualBalance: number, differenceReason: string | undefined, userId: number) => Promise<boolean>;
  clearError: () => void;
}

export const useShiftStore = create<ShiftState>((set, get) => ({
  currentShift: null,
  summary: null,
  isLoading: false,
  error: null,

  loadCurrentShift: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await window.api.getCurrentShift();

      if (response.success) {
        set({
          currentShift: response.data || null,
          isLoading: false
        });
      } else {
        set({
          error: response.error || 'فشل في جلب الوردية',
          isLoading: false
        });
      }
    } catch (error) {
      set({
        error: 'حدث خطأ أثناء جلب الوردية',
        isLoading: false
      });
    }
  },

  loadShiftSummary: async (shiftId: number) => {
    set({ isLoading: true, error: null });

    try {
      const response = await window.api.getShiftSummary?.(shiftId);

      if (response?.success) {
        set({
          summary: response.data || null,
          isLoading: false
        });
      } else {
        set({
          error: response?.error || 'فشل في جلب ملخص الوردية',
          isLoading: false
        });
      }
    } catch (error) {
      set({
        error: 'حدث خطأ أثناء جلب ملخص الوردية',
        isLoading: false
      });
    }
  },

  openShift: async (type: 'morning' | 'evening', openingBalance: number, userId: number) => {
    set({ isLoading: true, error: null });

    try {
      const response = await window.api.openShift({
        data: { type, opening_balance: openingBalance },
        userId
      });

      if (response.success && response.data) {
        set({
          currentShift: response.data,
          isLoading: false,
          error: null
        });
        return true;
      } else {
        set({
          error: response.error || 'فشل في فتح الوردية',
          isLoading: false
        });
        return false;
      }
    } catch (error) {
      set({
        error: 'حدث خطأ أثناء فتح الوردية',
        isLoading: false
      });
      return false;
    }
  },

  closeShift: async (
    shiftId: number,
    actualBalance: number,
    differenceReason: string | undefined,
    userId: number
  ) => {
    set({ isLoading: true, error: null });

    try {
      const response = await window.api.closeShift({
        data: {
          shift_id: shiftId,
          actual_balance: actualBalance,
          difference_reason: differenceReason
        },
        userId
      });

      if (response.success) {
        set({
          currentShift: null,
          summary: null,
          isLoading: false,
          error: null
        });
        return true;
      } else {
        set({
          error: response.error || 'فشل في إغلاق الوردية',
          isLoading: false
        });
        return false;
      }
    } catch (error) {
      set({
        error: 'حدث خطأ أثناء إغلاق الوردية',
        isLoading: false
      });
      return false;
    }
  },

  clearError: () => set({ error: null })
}));
