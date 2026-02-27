/**
 * Treatment Proposals API - Barrel Export
 * Exports all API functions for easy importing
 */

// Proposal APIs
export {
  createProposalApi,
  getProposalsByEpisodeApi,
  getProposalByIdApi,
  updateProposalApi,
  declineProposalApi,
  canCreateProposalApi,
  canEditProposalApi,
  canScheduleProposalApi,
} from '../datasources/proposals.api';

// Scheduling APIs
export {
  validateScheduleApi,
  scheduleSeriesApi,
} from './schedulingApi';

// Lifecycle APIs
export {
  canPauseSeriesApi,
  pauseSeriesApi,
  canResumeSeriesApi,
  resumeSeriesApi,
  canCancelSeriesApi,
  cancelSeriesApi,
} from './lifecycleApi';

// Rules APIs
export {
  evaluateRuleApi,
  canEditRowApi,
  isActionAllowed,
  getDisallowReason,
  requiresAudit,
  requiresReason,
  getAuditMessage,
} from './rulesApi';
