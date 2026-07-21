import {
  InvalidWorkspacePreparationProjectionError,
  UnsupportedWorkspacePreparationContractError,
} from '../../features/onboarding/domain/entities/workspace-preparation.entity';
import { buildWorkspacePreparationViewModel } from '../../features/onboarding/domain/usecases/build-workspace-preparation-view-model.usecase';

const projection = () => ({
  contractVersion: 'workspace_preparation_v1',
  runId: 'run-1',
  state: 'PREPARING',
  aggregateVersion: 3,
  progress: { completed: 1, total: 4, indeterminate: false },
  units: [
    {
      code: 'TENANT_FOUNDATION',
      outcome: 'SATISFIED',
      evidenceVersion: 'tenant_foundation_v1',
      attempt: 1,
      observedAt: '2026-07-21T12:00:00Z',
      recordedAt: '2026-07-21T12:00:01Z',
    },
  ],
  reasonCode: null,
  retryAllowed: false,
  userRetryCount: 0,
  maxUserRetries: 3,
  nextAction: 'WAIT',
  refreshAfterSeconds: 2,
  supportCorrelationId: 'correlation-1',
  updatedAt: '2026-07-21T12:00:01Z',
});

describe('buildWorkspacePreparationViewModel', () => {
  it('maps safe transport primitives into domain dates and camel-case fields', () => {
    const result = buildWorkspacePreparationViewModel(projection());
    expect(result.state).toBe('PREPARING');
    expect(result.updatedAt).toBeInstanceOf(Date);
    expect(result.units[0].observedAt).toBeInstanceOf(Date);
    expect(result.progress).toEqual({ completed: 1, total: 4, indeterminate: false });
  });

  it('fails closed for an unknown contract version', () => {
    expect(() =>
      buildWorkspacePreparationViewModel({ ...projection(), contractVersion: 'future_v2' })
    ).toThrow(UnsupportedWorkspacePreparationContractError);
  });

  it('fails closed for unknown states and impossible progress', () => {
    expect(() =>
      buildWorkspacePreparationViewModel({ ...projection(), state: 'UNKNOWN' })
    ).toThrow(InvalidWorkspacePreparationProjectionError);
    expect(() =>
      buildWorkspacePreparationViewModel({
        ...projection(),
        progress: { completed: 5, total: 4, indeterminate: false },
      })
    ).toThrow(InvalidWorkspacePreparationProjectionError);
  });
});
