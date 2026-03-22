/**
 * Dashboard Store
 * Zustand store for managing dashboard state (date selection, filters, etc.)
 *
 * Each role has its own independent date field so navigating between dashboards
 * never clobbers another role's selection.
 */

import { create } from 'zustand';

// ─── helpers ────────────────────────────────────────────────────────────────

const getTodayAtMidnight = (): Date => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const normalizeToMidnight = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

// ─── state shape ────────────────────────────────────────────────────────────

interface DashboardState {
  // Doctor dashboard date
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  resetToToday: () => void;

  // Therapist dashboard date (independent from doctor)
  therapistSelectedDate: Date;
  setTherapistSelectedDate: (date: Date) => void;
  resetTherapistToToday: () => void;
}

// ─── store ──────────────────────────────────────────────────────────────────

export const useDashboardStore = create<DashboardState>((set) => ({
  // ── Doctor ──────────────────────────────────────────────────────────────
  selectedDate: getTodayAtMidnight(),

  setSelectedDate: (date: Date) =>
    set({ selectedDate: normalizeToMidnight(date) }),

  resetToToday: () =>
    set({ selectedDate: getTodayAtMidnight() }),

  // ── Therapist ────────────────────────────────────────────────────────────
  therapistSelectedDate: getTodayAtMidnight(),

  setTherapistSelectedDate: (date: Date) =>
    set({ therapistSelectedDate: normalizeToMidnight(date) }),

  resetTherapistToToday: () =>
    set({ therapistSelectedDate: getTodayAtMidnight() }),
}));
