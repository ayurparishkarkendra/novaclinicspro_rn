export const JOURNEY_VISIBILITY_CONTRACT_V1 = '1.0' as const;

export type JourneyVisibilityProgress = 'INCOMPLETE' | 'COMPLETED';

export interface JourneyVisibilityProjectionIdentity {
  readonly contractVersion: typeof JOURNEY_VISIBILITY_CONTRACT_V1;
  readonly templateVersion: string;
  readonly capabilityRevision: string;
  readonly tenantId: string;
}

export interface JourneyVisibilityStep {
  readonly stepId: string;
  readonly order: number;
  readonly visibility: 'VISIBLE';
  readonly progress: JourneyVisibilityProgress;
}

export interface JourneyVisibilityProjection {
  readonly identity: JourneyVisibilityProjectionIdentity;
  readonly projectedAt: Date;
  readonly visibleSteps: readonly JourneyVisibilityStep[];
}

export type JourneyVisibilityFailureKind =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'TENANT_MISMATCH'
  | 'PROJECTION_UNAVAILABLE'
  | 'CONTRACT_MISMATCH'
  | 'BACKEND_FAILURE';

export class JourneyVisibilityError extends Error {
  constructor(
    readonly kind: JourneyVisibilityFailureKind,
    readonly code: string,
    readonly messageToken: string,
    readonly retryable: boolean
  ) {
    super(messageToken);
    this.name = 'JourneyVisibilityError';
  }
}

export const isSameJourneyVisibilityProjectionIdentity = (
  left: JourneyVisibilityProjectionIdentity,
  right: JourneyVisibilityProjectionIdentity
): boolean =>
  left.contractVersion === right.contractVersion &&
  left.templateVersion === right.templateVersion &&
  left.capabilityRevision === right.capabilityRevision &&
  left.tenantId === right.tenantId;
