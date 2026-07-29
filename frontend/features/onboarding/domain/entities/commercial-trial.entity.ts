export const COMMERCIAL_TRIAL_CONTRACT_V1 = 'commercial_trial_v1' as const;

export type CommercialTrialState =
  | 'ELIGIBLE'
  | 'ACTIVE'
  | 'EXPIRING'
  | 'EXPIRED'
  | 'SUSPENDED'
  | 'ARCHIVED'
  | 'DELETED';

export type CommercialTrialAction =
  | 'START_TRIAL'
  | 'REQUEST_EXTENSION'
  | 'GRANT_EXTENSION'
  | 'DOWNLOADS'
  | 'REQUEST_SUBSCRIPTION';

export type CommercialRetentionAction =
  | 'START_TRIAL'
  | 'REQUEST_EXTENSION'
  | 'GRANT_EXTENSION'
  | 'RESTORE_WORKSPACE'
  | 'REQUEST_PERMANENT_DELETION'
  | 'REQUEST_WORKSPACE_DATA_EXPORT'
  | 'REQUEST_SUBSCRIPTION'
  | 'CONTACT_SUPPORT';

export type CommercialRetentionIneligibilityReason =
  | 'PROTECTION_EVIDENCE_UNAVAILABLE'
  | 'LEGAL_HOLD_ACTIVE'
  | 'STATUTORY_RETENTION_ACTIVE'
  | 'EXPORT_IN_PROGRESS'
  | 'RETENTION_PERIOD_ACTIVE';

export interface CommercialTrial {
  readonly contractVersion: typeof COMMERCIAL_TRIAL_CONTRACT_V1;
  readonly trialId: string;
  readonly organizationId: string;
  readonly tenantId: string;
  readonly state: CommercialTrialState;
  readonly aggregateVersion: number;
  readonly activationAt: string | null;
  readonly expiresAt: string | null;
  readonly finalNoticeStartsAt: string | null;
  readonly allowedActions: readonly CommercialTrialAction[];
}

export interface CommercialTrialHandoff {
  readonly owner: 'exports' | 'E9';
  readonly action: 'OPEN_APPROVED_DOWNLOADS' | 'REQUEST_SUBSCRIPTION';
  readonly tenantId: string;
}

export interface CommercialRetention {
  readonly contractVersion: typeof COMMERCIAL_TRIAL_CONTRACT_V1;
  readonly trialId: string;
  readonly organizationId: string;
  readonly tenantId: string;
  readonly commercialState: CommercialTrialState;
  readonly aggregateVersion: number;
  readonly archivedAt: string | null;
  readonly retentionUntil: string | null;
  readonly restoreEligible: boolean;
  readonly permanentDeletionEligible: boolean;
  readonly extensionEligible: boolean;
  readonly workspaceDataExportRequestPermitted: boolean;
  readonly legalHoldActive: boolean | null;
  readonly statutoryRetentionActive: boolean | null;
  readonly allowedActions: readonly CommercialRetentionAction[];
  readonly ineligibilityReasons: readonly CommercialRetentionIneligibilityReason[];
}

export type CommercialTrialFailureKind =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'TENANT_MISMATCH'
  | 'ORGANIZATION_MISMATCH'
  | 'UNSUPPORTED_CONTRACT'
  | 'INVALID_AGGREGATE'
  | 'NOT_READY'
  | 'CONFIRMATION_REQUIRED'
  | 'CONFLICT'
  | 'NOT_FOUND'
  | 'RETENTION_EVIDENCE_UNAVAILABLE'
  | 'BACKEND_FAILURE';

export class CommercialTrialError extends Error {
  constructor(
    readonly kind: CommercialTrialFailureKind,
    readonly code: string,
    readonly messageToken: string,
    readonly retryable: boolean
  ) {
    super(messageToken);
    this.name = 'CommercialTrialError';
  }
}
