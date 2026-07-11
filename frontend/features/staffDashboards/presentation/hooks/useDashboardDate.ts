/**
 * useDashboardDate
 *
 * Shared date-selection hook for staff dashboards.
 * Each role reads/writes its own independent field in the Zustand store so
 * navigating between dashboards never clobbers another role's selection.
 *
 * Returns: { selectedDate, setSelectedDate, selectedDateStr, isToday }
 */

import { useMemo } from 'react';
import { useDashboardStore } from '../stores/dashboard.store';
import { toISODateLocal } from '../../../../core/components/DateStrip';

interface DashboardDateResult {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  selectedDateStr: string;
  isToday: boolean;
}

const useDashboardDate = (
  getDate: (s: ReturnType<typeof useDashboardStore.getState>) => Date,
  setDate: (s: ReturnType<typeof useDashboardStore.getState>) => (d: Date) => void
): DashboardDateResult => {
  const selectedDate = useDashboardStore(getDate);
  const setSelectedDate = useDashboardStore(setDate);

  const todayStr = useMemo(() => toISODateLocal(new Date()), []);
  const selectedDateStr = useMemo(() => toISODateLocal(selectedDate), [selectedDate]);
  const isToday = selectedDateStr === todayStr;

  return { selectedDate, setSelectedDate, selectedDateStr, isToday };
};

/** Date hook for the Doctor dashboard. */
export const useDoctorDashboardDate = (): DashboardDateResult =>
  useDashboardDate(
    (s) => s.selectedDate,
    (s) => s.setSelectedDate
  );

/** Date hook for the Therapist dashboard. */
export const useTherapistDashboardDate = (): DashboardDateResult =>
  useDashboardDate(
    (s) => s.therapistSelectedDate,
    (s) => s.setTherapistSelectedDate
  );
