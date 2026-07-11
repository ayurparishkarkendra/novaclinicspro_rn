/**
 * Onboarding repository hook tests
 *
 * Repository-layer coverage for React Query invalidation behaviour.
 */

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  onboardingKeys,
  useSubmitStepMutation,
} from '../../features/onboarding/data/repositories/onboarding.repository.impl';
import { submitStepDataApi } from '../../features/onboarding/data/datasources/onboarding.api';

jest.mock('../../features/onboarding/data/datasources/onboarding.api', () => ({
  getApplicationDetailApi: jest.fn(),
  getValidationReportApi: jest.fn(),
  improveApplicationApi: jest.fn(),
  resubmitApplicationApi: jest.fn(),
  createDemoTenantApi: jest.fn(),
  getDemoStatusApi: jest.fn(),
  transitionDemoToLiveApi: jest.fn(),
  getSetupWizardContextApi: jest.fn(),
  getSetupWizardProgressApi: jest.fn(),
  completeSetupWizardApi: jest.fn(),
  getOnboardingStatusApi: jest.fn(),
  submitStepDataApi: jest.fn(),
  completeSetupApi: jest.fn(),
}));

const mockSubmitStepDataApi = submitStepDataApi as jest.Mock;

describe('useSubmitStepMutation', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSubmitStepDataApi.mockResolvedValue({ success: true });
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('invalidates the tenant onboarding status query after a successful step submit', async () => {
    const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(
      () => useSubmitStepMutation('tenant-123', 'services'),
      { wrapper }
    );

    await act(async () => {
      await result.current.mutateAsync({
        idempotencyKey: 'submission-123',
        data: {},
        mark_complete: true,
      });
    });

    await waitFor(() => {
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: onboardingKeys.status('tenant-123'),
      });
    });
    expect(mockSubmitStepDataApi).toHaveBeenCalledWith(
      'tenant-123',
      'services',
      { data: {}, mark_complete: true },
      'submission-123'
    );
  });
});
