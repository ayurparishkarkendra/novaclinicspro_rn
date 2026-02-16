/**
 * Therapist Dashboard DTOs
 * Data Transfer Objects matching OpenAPI schemas and UI requirements
 * 
 * API Support Status:
 * - Worklist/Sessions: SUPPORTED via therapist dashboard API
 * - KPIs: PARTIALLY SUPPORTED - derived from session data
 * - Leave Requests: SUPPORTED via staff leave API
 * - Documents: NOT SUPPORTED - no API
 * - Bank Details: NOT SUPPORTED - no API
 * - Salary/Payslips: NOT SUPPORTED - no API
 * - Learning: NOT SUPPORTED - no API
 */

import { TherapistSessionItem, TherapistDashboardResponse } from '../../../staffDashboards/data/models/staffDashboards.dtos';
import { StaffLeaveResponse, StaffLeaveCreate, LeaveStatus } from '../../../staff/data/models/staff.dtos';

// ============================================
// RE-EXPORT BASE TYPES FROM EXISTING MODULES
// ============================================

export type { TherapistSessionItem, TherapistDashboardResponse };
export type { StaffLeaveResponse, StaffLeaveCreate, LeaveStatus };

// ============================================
// WORKLIST SESSION ENTITY (Enhanced)
// ============================================

/** Enhanced worklist session with additional UI flags */
export interface WorklistSession extends TherapistSessionItem {
  /** Flag: New patient (first session) */
  isNewPatient?: boolean;
  /** Flag: IPD patient */
  isIpd?: boolean;
  /** Room/Location name if available */
  roomName?: string | null;
  /** Time range display */
  timeRange?: string;
}

// ============================================
// KPI METRICS
// ============================================

/** KPI metric item for display */
export interface KpiMetric {
  label: string;
  value: number | string;
  icon: string;
  color: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

/** KPI summary for therapist dashboard */
export interface TherapistKpiSummary {
  /** Total sessions delivered in period */
  totalSessions: number;
  /** Completed sessions */
  completedSessions: number;
  /** No-show count */
  noShowCount: number;
  /** Cancellation count */
  cancellationCount: number;
  /** Average feedback score (if available) */
  averageFeedback: number | null;
  /** Period label (e.g., "Last 7 days") */
  periodLabel: string;
}

// ============================================
// HR SELF-SERVICE (STUBS - NO API)
// ============================================

/** Document item (UI stub - no API support) */
export interface TherapistDocument {
  id: string;
  type: string;
  name: string;
  uploadDate: string;
  status: 'verified' | 'pending' | 'rejected';
}

/** Bank details (UI stub - no API support) */
export interface BankDetails {
  accountNumber: string; // Masked
  bankName: string;
  ifscCode: string;
  accountHolderName: string;
  isPrimary: boolean;
}

/** Payslip item (UI stub - no API support) */
export interface Payslip {
  id: string;
  month: string;
  year: number;
  netPay: number;
  currency: string;
  status: 'paid' | 'pending';
}

/** Incentive breakdown (UI stub - no API support) */
export interface IncentiveBreakdown {
  period: string;
  sessionsCount: number;
  amount: number;
  currency: string;
}

// ============================================
// LEAVE MANAGEMENT
// ============================================

/** Leave balance by type */
export interface LeaveBalance {
  leaveType: string;
  total: number;
  used: number;
  available: number;
}

/** Leave summary for dashboard */
export interface LeaveSummary {
  balances: LeaveBalance[];
  pendingRequests: number;
  upcomingLeave: StaffLeaveResponse | null;
}

// ============================================
// LEARNING (STUB - NO API)
// ============================================

/** Learning item (UI stub - no API support) */
export interface LearningItem {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  completionStatus: 'not_started' | 'in_progress' | 'completed';
  category: string;
}

// ============================================
// FILTER/QUERY PARAMS
// ============================================

/** Worklist filter options */
export type WorklistPeriod = 'today' | 'next_7_days' | 'past_7_days';

/** Worklist query parameters */
export interface WorklistParams {
  period?: WorklistPeriod;
  status?: string;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/** Calculate KPI metrics from sessions */
export const calculateKpiFromSessions = (
  sessions: TherapistSessionItem[],
  periodLabel: string
): TherapistKpiSummary => {
  const statusLower = (s: TherapistSessionItem) => s.status?.toLowerCase() || '';
  
  return {
    totalSessions: sessions.length,
    completedSessions: sessions.filter(s => statusLower(s) === 'completed').length,
    noShowCount: sessions.filter(s => statusLower(s) === 'no_show').length,
    cancellationCount: sessions.filter(s => statusLower(s) === 'cancelled').length,
    averageFeedback: null, // No API support for feedback
    periodLabel,
  };
};

/** Map session to enhanced worklist session */
export const mapToWorklistSession = (session: TherapistSessionItem): WorklistSession => {
  return {
    ...session,
    isNewPatient: session.session_number === 1,
    isIpd: false, // Would need backend support
    roomName: null, // Would need backend support
    timeRange: formatSessionTime(session.session_date),
  };
};

/** Format session time for display */
export const formatSessionTime = (dateStr: string | null): string => {
  if (!dateStr) return '--:--';
  try {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '--:--';
  }
};

/** Get period date range */
export const getPeriodDateRange = (period: WorklistPeriod): { start: Date; end: Date } => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  switch (period) {
    case 'today':
      return { start: today, end: tomorrow };
    case 'next_7_days':
      const next7End = new Date(today);
      next7End.setDate(next7End.getDate() + 8);
      return { start: today, end: next7End };
    case 'past_7_days':
      const past7Start = new Date(today);
      past7Start.setDate(past7Start.getDate() - 7);
      return { start: past7Start, end: tomorrow };
    default:
      return { start: today, end: tomorrow };
  }
};

/** Filter sessions by period */
export const filterSessionsByPeriod = (
  sessions: TherapistSessionItem[],
  period: WorklistPeriod
): TherapistSessionItem[] => {
  const { start, end } = getPeriodDateRange(period);
  
  return sessions.filter(session => {
    if (!session.session_date) return false;
    const sessionDate = new Date(session.session_date);
    return sessionDate >= start && sessionDate < end;
  });
};

/** Get leave status color */
export const getLeaveStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    PENDING: '#f59e0b',
    APPROVED: '#10b981',
    REJECTED: '#ef4444',
    CANCELLED: '#6b7280',
  };
  return colors[status?.toUpperCase()] || '#6b7280';
};

/** Get leave type display label */
export const getLeaveTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    SICK: 'Sick Leave',
    CASUAL: 'Casual Leave',
    VACATION: 'Vacation',
    PERSONAL: 'Personal Leave',
    PRIVILEGE: 'Privilege Leave',
    MATERNITY: 'Maternity Leave',
    PATERNITY: 'Paternity Leave',
    OTHER: 'Other',
  };
  return labels[type?.toUpperCase()] || type;
};
