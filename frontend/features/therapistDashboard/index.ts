/**
 * Therapist Dashboard Feature Index
 * Exports all public APIs for the therapist dashboard module
 */

// ============================================
// DATA LAYER
// ============================================

// DTOs & Models
export * from './data/models/therapistDashboard.dtos';

// API functions (for advanced usage)
export {
  getTherapistWorklistApi,
  getTherapistKpisApi,
  getTherapistLeaveRequestsApi,
  createTherapistLeaveRequestApi,
  cancelTherapistLeaveRequestApi,
  ApiNotImplementedError,
} from './data/datasources/therapistDashboard.api';

// Repository hooks
export {
  therapistDashboardKeys,
  useTherapistWorklistQuery,
  useFilteredWorklistQuery,
  useTherapistKpisQuery,
  useTherapistLeaveRequestsQuery,
  useCreateLeaveRequestMutation,
  useCancelLeaveRequestMutation,
  // Stub hooks for unsupported features
  useTherapistDocumentsQuery,
  useTherapistBankDetailsQuery,
  useTherapistPayslipsQuery,
  useTherapistLearningItemsQuery,
} from './data/repositories/therapistDashboard.repository.impl';

// ============================================
// DOMAIN LAYER
// ============================================

// Entities & helpers
export {
  canStartSession,
  canCompleteSession,
  isSessionActionable,
  getSessionFlags,
  kpiSummaryToMetrics,
  calculateCompletionRate,
  canCancelLeave,
  calculateLeaveDays,
  getUpcomingLeave,
  getPendingLeaveCount,
  buildLeaveSummary,
  getPeriodLabel,
  getKpiPeriodLabel,
} from './domain/entities/therapistDashboard.entity';

// Repository interface
export type { ITherapistDashboardRepository } from './domain/repositories/therapistDashboard.repository';

// ============================================
// PRESENTATION LAYER
// ============================================

// Components
export {
  TherapistKpiRow,
  WorklistSection,
  WorklistItemCard,
  HrSection,
  LeaveSection,
  LearningSection,
} from './presentation/components';

// Pages
export { TherapistDashboardScreen } from './presentation/pages/TherapistDashboardScreen';
