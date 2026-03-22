/**
 * Therapist Dashboard Domain Entities
 * Business logic representation of dashboard data
 */

import {
  TherapistSessionItem,
  WorklistSession,
  TherapistKpiSummary,
  LeaveBalance,
  LeaveSummary,
  KpiMetric,
  WorklistPeriod,
} from '../../data/models/therapistDashboard.dtos';
import { StaffLeaveResponse } from '../../../staff/data/models/staff.dtos';
import { colors } from '../../../../core/theme/colors';

// ============================================
// DOMAIN INTERFACES (Task 5.1)
// ============================================

/** Summary data for the dashboard header and stat cards */
export interface TherapistDashboard {
  displayName: string;
  todayDate: string;
  totalSessions: number;
  completedSessions: number;
  pendingSessions: number;
  averageRating: number | null;
}

/** A single session row — rowId maps from row_id */
export interface TherapistSession {
  rowId: string;               // maps from row_id — the only completion identifier
  clientName: string | null;
  treatmentName: string | null;
  dayNumber: number;
  scheduledTime: string | null;
  status: string;
  isCompletable: boolean;      // derived: canCompleteSession(status)
  isTerminal: boolean;         // derived: isTerminalStatus(status)
}

/** KPI metrics for display */
export interface TherapistKpi {
  completionRate: number;
  retentionRate: number;
  satisfactionScore: number | null;
  ratingDistribution: Record<string, number>;
  periodLabel: string;
}

/** A pre-configured material/consumable from the usables endpoint */
export interface SheetRowUsable {
  inventoryItemId: string | null;
  materialName: string;
  materialCode: string | null;
  quantityUsed: number;
  unit: string;
  mlPerUnit: number;
  category: 'oil' | 'medicine' | 'disposable' | 'other';
}

/** A material in the completion payload */
export interface CompleteMaterial {
  inventoryItemId?: string | null;
  materialName: string;
  materialCode?: string | null;
  quantityUsed: number;
  unit: string;
  mlPerUnit: number;
  category: 'oil' | 'medicine' | 'disposable' | 'other';
}

// ============================================
// SESSION STATUS HELPERS (Tasks 5.2 & 5.3)
// ============================================

/**
 * Determines if a session status allows completion.
 * Returns true for 'in_progress' and 'scheduled'.
 * Returns false for all other statuses (including terminal ones).
 *
 * Requirements: 4.6, 4.7
 */
export const canCompleteSession = (status: string): boolean => {
  return status === 'in_progress' || status === 'scheduled';
};

/**
 * Determines if a session status is terminal (no further actions available).
 * Returns true for 'completed', 'cancelled', 'no_show'.
 *
 * Requirements: 4.7
 */
export const isTerminalStatus = (status: string): boolean => {
  return status === 'completed' || status === 'cancelled' || status === 'no_show';
};

// ============================================
// WORKLIST SESSION ENTITY HELPERS
// ============================================

/**
 * Check if session can be started
 */
export const canStartSession = (session: TherapistSessionItem): boolean => {
  const status = session.status?.toLowerCase();
  return ['pending', 'scheduled', 'confirmed'].includes(status);
};

/**
 * Check if session is actionable (not terminal state)
 * @deprecated Use isTerminalStatus(session.status) instead
 */
export const isSessionActionable = (session: TherapistSessionItem): boolean => {
  return !isTerminalStatus(session.status?.toLowerCase() || '');
};

/**
 * Get session priority flags
 */
export const getSessionFlags = (session: WorklistSession): string[] => {
  const flags: string[] = [];
  if (session.isNewPatient) flags.push('New Patient');
  if (session.isIpd) flags.push('IPD');
  return flags;
};

// ============================================
// KPI ENTITY HELPERS
// ============================================

/**
 * Convert KPI summary to display metrics
 */
export const kpiSummaryToMetrics = (summary: TherapistKpiSummary): KpiMetric[] => {
  const metrics: KpiMetric[] = [
    {
      label: 'Total Sessions',
      value: summary.totalSessions,
      icon: 'fitness',
      color: colors.primary.main,
    },
    {
      label: 'Completed',
      value: summary.completedSessions,
      icon: 'checkmark-circle',
      color: colors.success.main,
    },
    {
      label: 'No Shows',
      value: summary.noShowCount,
      icon: 'person-remove',
      color: colors.warning.main,
    },
    {
      label: 'Cancelled',
      value: summary.cancellationCount,
      icon: 'close-circle',
      color: colors.error.main,
    },
  ];

  // Add feedback metric if available
  if (summary.averageFeedback !== null) {
    metrics.push({
      label: 'Avg Rating',
      value: summary.averageFeedback.toFixed(1),
      icon: 'star',
      color: colors.warning.main,
    });
  }

  return metrics;
};

/**
 * Calculate completion rate
 */
export const calculateCompletionRate = (summary: TherapistKpiSummary): number => {
  if (summary.totalSessions === 0) return 0;
  return Math.round((summary.completedSessions / summary.totalSessions) * 100);
};

// ============================================
// LEAVE ENTITY HELPERS
// ============================================

/**
 * Check if leave request can be cancelled
 */
export const canCancelLeave = (leave: StaffLeaveResponse): boolean => {
  const status = leave.status?.toUpperCase();
  // Can only cancel pending or approved (future) leaves
  if (status === 'PENDING') return true;
  if (status === 'APPROVED') {
    // Can only cancel if leave hasn't started yet
    const startDate = new Date(leave.start_date);
    return startDate > new Date();
  }
  return false;
};

/**
 * Calculate leave days
 */
export const calculateLeaveDays = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays;
};

/**
 * Get next upcoming leave
 */
export const getUpcomingLeave = (leaves: StaffLeaveResponse[]): StaffLeaveResponse | null => {
  const now = new Date();
  const upcoming = leaves
    .filter(leave => {
      const startDate = new Date(leave.start_date);
      return leave.status?.toUpperCase() === 'APPROVED' && startDate > now;
    })
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
  
  return upcoming[0] || null;
};

/**
 * Get pending leave count
 */
export const getPendingLeaveCount = (leaves: StaffLeaveResponse[]): number => {
  return leaves.filter(leave => leave.status?.toUpperCase() === 'PENDING').length;
};

/**
 * Build leave summary from leave list
 * Note: Leave balances require separate API (not supported)
 */
export const buildLeaveSummary = (leaves: StaffLeaveResponse[]): Omit<LeaveSummary, 'balances'> => {
  return {
    pendingRequests: getPendingLeaveCount(leaves),
    upcomingLeave: getUpcomingLeave(leaves),
  };
};

// ============================================
// PERIOD HELPERS
// ============================================

/**
 * Get period display label
 */
export const getPeriodLabel = (period: WorklistPeriod): string => {
  const labels: Record<WorklistPeriod, string> = {
    today: "Today's Sessions",
    next_7_days: 'Next 7 Days',
    past_7_days: 'Past 7 Days',
  };
  return labels[period];
};

/**
 * Get period for KPI display
 */
export const getKpiPeriodLabel = (period: WorklistPeriod): string => {
  const labels: Record<WorklistPeriod, string> = {
    today: 'Today',
    next_7_days: 'Next 7 Days',
    past_7_days: 'Last 7 Days',
  };
  return labels[period];
};
