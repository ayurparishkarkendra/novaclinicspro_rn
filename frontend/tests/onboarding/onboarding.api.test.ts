/**
 * Onboarding API datasource tests
 *
 * Data-layer coverage for idempotent step submission headers.
 */

import {
  ensureWorkspacePreparationApi,
  getWorkspacePreparationApi,
  retryWorkspacePreparationApi,
  submitStepDataApi,
} from '../../features/onboarding/data/datasources/onboarding.api';
import { axiosClient } from '../../core/api/axiosClient';

jest.mock('../../core/api/axiosClient', () => ({
  axiosClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

const mockPost = axiosClient.post as jest.Mock;
const mockGet = axiosClient.get as jest.Mock;

describe('submitStepDataApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPost.mockResolvedValue({
      data: {
        success: true,
      },
    });
  });

  it('sends Idempotency-Key when provided', async () => {
    await submitStepDataApi(
      'tenant-123',
      'services',
      { data: {}, mark_complete: true },
      'submission-uuid-123'
    );

    expect(mockPost).toHaveBeenCalledWith(
      '/api/v1/onboarding/tenant-123/steps/services',
      { data: {}, mark_complete: true },
      {
        headers: {
          'X-Tenant-ID': 'tenant-123',
          'Idempotency-Key': 'submission-uuid-123',
        },
      }
    );
  });

  it('omits Idempotency-Key when not provided while retaining tenant fallback header', async () => {
    await submitStepDataApi(
      'tenant-123',
      'services',
      { data: {}, mark_complete: true }
    );

    expect(mockPost).toHaveBeenCalledWith(
      '/api/v1/onboarding/tenant-123/steps/services',
      { data: {}, mark_complete: true },
      {
        headers: {
          'X-Tenant-ID': 'tenant-123',
        },
      }
    );
  });
});

describe('Workspace Preparation datasource', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPost.mockResolvedValue({ data: { contract_version: 'workspace_preparation_v1' } });
    mockGet.mockResolvedValue({ data: { contract_version: 'workspace_preparation_v1' } });
  });

  it('uses the existing authenticated client for ensure and status without client authority headers', async () => {
    await ensureWorkspacePreparationApi('tenant-1');
    await getWorkspacePreparationApi('tenant-1');
    expect(mockPost).toHaveBeenCalledWith(
      '/api/v1/onboarding/tenant-1/workspace-preparation',
      { contract_version: 'workspace_preparation_v1' }
    );
    expect(mockGet).toHaveBeenCalledWith(
      '/api/v1/onboarding/tenant-1/workspace-preparation'
    );
  });

  it('sends aggregate version and only the approved idempotency header for retry', async () => {
    await retryWorkspacePreparationApi('tenant-1', 7, 'retry-key');
    expect(mockPost).toHaveBeenCalledWith(
      '/api/v1/onboarding/tenant-1/workspace-preparation/retry',
      { contract_version: 'workspace_preparation_v1', aggregate_version: 7 },
      { headers: { 'Idempotency-Key': 'retry-key' } }
    );
  });
});
