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
