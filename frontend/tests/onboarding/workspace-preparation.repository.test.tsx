import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import {
  onboardingKeys,
  shouldRetryWorkspacePreparation,
  useRetryWorkspacePreparationMutation,
  workspacePreparationRepository,
} from '../../features/onboarding/data/repositories/onboarding.repository.impl';
import {
  ensureWorkspacePreparationApi,
  getWorkspacePreparationApi,
  retryWorkspacePreparationApi,
} from '../../features/onboarding/data/datasources/onboarding.api';
import {
  WorkspacePreparationDatasourceError,
} from '../../features/onboarding/data/models/onboarding.dtos';
import { WorkspacePreparationError } from '../../features/onboarding/domain/entities/workspace-preparation.entity';

jest.mock('../../features/onboarding/data/datasources/onboarding.api', () => ({
  ensureWorkspacePreparationApi: jest.fn(),
  getWorkspacePreparationApi: jest.fn(),
  retryWorkspacePreparationApi: jest.fn(),
}));

const dto = {
  contract_version: 'workspace_preparation_v1',
  run_id: 'run-1',
  state: 'RETRYABLE_FAILURE',
  aggregate_version: 4,
  progress: { completed: 1, total: 4, indeterminate: false },
  units: [],
  reason_code: 'TRANSIENT_DEPENDENCY_FAILURE',
  retry_allowed: true,
  user_retry_count: 1,
  max_user_retries: 3,
  next_action: 'RETRY',
  refresh_after_seconds: null,
  support_correlation_id: 'correlation-1',
  updated_at: '2026-07-21T12:00:00Z',
};

describe('Workspace Preparation repository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (ensureWorkspacePreparationApi as jest.Mock).mockResolvedValue(dto);
    (getWorkspacePreparationApi as jest.Mock).mockResolvedValue(dto);
    (retryWorkspacePreparationApi as jest.Mock).mockResolvedValue(dto);
  });

  it('delegates and isolates DTO mapping', async () => {
    const result = await workspacePreparationRepository.getWorkspacePreparation('tenant-1');
    expect(getWorkspacePreparationApi).toHaveBeenCalledWith('tenant-1');
    expect(result).toMatchObject({
      contractVersion: 'workspace_preparation_v1',
      aggregateVersion: 4,
      reasonCode: 'TRANSIENT_DEPENDENCY_FAILURE',
    });
    expect(result.updatedAt).toBeInstanceOf(Date);
    expect(result).not.toHaveProperty('contract_version');
  });

  it('maps datasource errors into the safe domain error', async () => {
    (getWorkspacePreparationApi as jest.Mock).mockRejectedValue(
      new WorkspacePreparationDatasourceError(
        'workspace_preparation.stale_version',
        'errors.workspacePreparation.stale_version',
        true
      )
    );
    await expect(
      workspacePreparationRepository.getWorkspacePreparation('tenant-1')
    ).rejects.toMatchObject({
      code: 'workspace_preparation.stale_version',
      message: 'errors.workspacePreparation.stale_version',
      retryable: true,
    });
  });

  it('keys cache by organization, tenant, and contract version', () => {
    expect(onboardingKeys.workspacePreparation('org-1', 'tenant-1')).toEqual([
      'onboarding',
      'workspace-preparation',
      'org-1',
      'tenant-1',
      'workspace_preparation_v1',
    ]);
  });

  it('retries only bounded retryable domain errors', () => {
    expect(
      shouldRetryWorkspacePreparation(
        1,
        new WorkspacePreparationError('code', 'token', true)
      )
    ).toBe(true);
    expect(
      shouldRetryWorkspacePreparation(
        2,
        new WorkspacePreparationError('code', 'token', true)
      )
    ).toBe(false);
    expect(shouldRetryWorkspacePreparation(0, new Error('raw'))).toBe(false);
  });

  it('updates and invalidates only the scoped cache after retry', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const invalidate = jest.spyOn(queryClient, 'invalidateQueries');
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(
      () => useRetryWorkspacePreparationMutation('org-1', 'tenant-1'),
      { wrapper }
    );
    await act(async () => {
      await result.current.mutateAsync({ aggregateVersion: 4, idempotencyKey: 'retry-1' });
    });
    await waitFor(() =>
      expect(invalidate).toHaveBeenCalledWith({
        queryKey: onboardingKeys.workspacePreparation('org-1', 'tenant-1'),
      })
    );
    expect(retryWorkspacePreparationApi).toHaveBeenCalledWith('tenant-1', 4, 'retry-1');
    queryClient.clear();
  });
});
