import {
  InvalidWorkspacePreparationProjectionError,
  UnsupportedWorkspacePreparationContractError,
  WORKSPACE_PREPARATION_CONTRACT_V1,
  WorkspacePreparation,
  WorkspacePreparationState,
} from '../entities/workspace-preparation.entity';

export interface WorkspacePreparationProjectionInput {
  contractVersion: string;
  runId: string;
  state: string;
  aggregateVersion: number;
  progress: { completed: number; total: number; indeterminate: boolean };
  units: readonly {
    code: string;
    outcome: string;
    evidenceVersion: string;
    attempt: number;
    observedAt: string;
    recordedAt: string;
  }[];
  reasonCode: string | null;
  retryAllowed: boolean;
  userRetryCount: number;
  maxUserRetries: number;
  nextAction: string;
  refreshAfterSeconds: number | null;
  supportCorrelationId: string;
  updatedAt: string;
}

const STATES: readonly WorkspacePreparationState[] = [
  'PENDING',
  'PREPARING',
  'PERSONALIZATION_AVAILABLE',
  'RETRYABLE_FAILURE',
  'TERMINAL_FAILURE',
];

const parseDate = (value: string): Date => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw new InvalidWorkspacePreparationProjectionError();
  return parsed;
};

export const buildWorkspacePreparationViewModel = (
  input: WorkspacePreparationProjectionInput
): WorkspacePreparation => {
  if (input.contractVersion !== WORKSPACE_PREPARATION_CONTRACT_V1) {
    throw new UnsupportedWorkspacePreparationContractError();
  }
  if (
    !STATES.includes(input.state as WorkspacePreparationState) ||
    input.aggregateVersion < 1 ||
    input.progress.completed < 0 ||
    input.progress.total < 1 ||
    input.progress.completed > input.progress.total ||
    input.userRetryCount < 0 ||
    input.maxUserRetries < input.userRetryCount
  ) {
    throw new InvalidWorkspacePreparationProjectionError();
  }

  return {
    ...input,
    contractVersion: WORKSPACE_PREPARATION_CONTRACT_V1,
    state: input.state as WorkspacePreparationState,
    updatedAt: parseDate(input.updatedAt),
    units: input.units.map((unit) => ({
      ...unit,
      observedAt: parseDate(unit.observedAt),
      recordedAt: parseDate(unit.recordedAt),
    })),
  };
};
