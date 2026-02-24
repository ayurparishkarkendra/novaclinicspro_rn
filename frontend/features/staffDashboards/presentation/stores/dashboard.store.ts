/**
 * Dashboard Store
 * Zustand store for managing dashboard state (date selection, filters, etc.)
 */

import { create } from 'zustand';

interface DashboardState {
  // Selected date for viewing appointments
  selectedDate: Date;
  
  // Actions
  setSelectedDate: (date: Date) => void;
  resetToToday: () => void;
}

// Helper to get today's date at midnight local time
const getTodayAtMidnight = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

export const useDashboardStore = create<DashboardState>((set) => ({
  // Initial state - today's date at midnight
  selectedDate: getTodayAtMidnight(),
  
  // Set a specific date
  setSelectedDate: (date: Date) => {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    console.log('[DashboardStore] Setting date:', {
      input: date.toDateString(),
      normalized: normalized.toDateString(),
      timestamp: normalized.getTime(),
    });
    set({ selectedDate: normalized });
  },
  
  // Reset to today
  resetToToday: () => set({ selectedDate: getTodayAtMidnight() }),
}));
