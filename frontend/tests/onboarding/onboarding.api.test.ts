/**
 * Onboarding API datasource tests
 *
 * Data-layer coverage for idempotent step submission headers.
 */

import { submitStepDataApi } from '../../features/onboarding/data/datasources/onboarding.api';
import { axiosClient } from '../../core/api/axiosClient';

jest.mock('../../core/api/axiosClient', () => ({
  axiosClient: {
    post: jest.fn(),
  },
}));

const mockPost = axiosClient.post as jest.Mock;

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
