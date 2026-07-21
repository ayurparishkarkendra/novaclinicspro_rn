export const WORKSPACE_PREPARATION_CONTRACT_V1 = 'workspace_preparation_v1' as const;

export type WorkspacePreparationState =
  | 'PENDING'
  | 'PREPARING'
  | 'PERSONALIZATION_AVAILABLE'
  | 'RETRYABLE_FAILURE'
  | 'TERMINAL_FAILURE';

export interface WorkspacePreparationProgress {
  completed: number;
  total: number;
  indeterminate: boolean;
}

export interface WorkspacePreparationUnit {
  code: string;
  outcome: string;
  evidenceVersion: string;
  attempt: number;
  observedAt: Date;
  recordedAt: Date;
}

export interface WorkspacePreparation {
  contractVersion: typeof WORKSPACE_PREPARATION_CONTRACT_V1;
  runId: string;
  state: WorkspacePreparationState;
  aggregateVersion: number;
  progress: WorkspacePreparationProgress;
  units: readonly WorkspacePreparationUnit[];
  reasonCode: string | null;
  retryAllowed: boolean;
  userRetryCount: number;
  maxUserRetries: number;
  nextAction: string;
  refreshAfterSeconds: number | null;
  supportCorrelationId: string;
  updatedAt: Date;
}

export class WorkspacePreparationError extends Error {
  constructor(
    readonly code: string,
    readonly messageToken: string,
    readonly retryable: boolean
  ) {
    super(messageToken);
    this.name = 'WorkspacePreparationError';
  }
}

export class UnsupportedWorkspacePreparationContractError extends WorkspacePreparationError {
  constructor() {
    super(
      'workspace_preparation.unsupported_version',
      'errors.workspacePreparation.unsupported_version',
      false
    );
    this.name = 'UnsupportedWorkspacePreparationContractError';
  }
}

export class InvalidWorkspacePreparationProjectionError extends WorkspacePreparationError {
  constructor() {
    super(
      'workspace_preparation.invalid_projection',
      'errors.workspacePreparation.invalid_projection',
      false
    );
    this.name = 'InvalidWorkspacePreparationProjectionError';
  }
}
