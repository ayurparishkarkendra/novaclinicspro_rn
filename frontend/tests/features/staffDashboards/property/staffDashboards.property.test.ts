/**
 * Property-Based Tests for staffDashboards data layer
 *
 * Uses fast-check to verify universal invariants across many generated inputs.
 * Each property runs a minimum of 100 iterations.
 *
 * Feature: therapist-dashboard
 */

import * as fc from 'fast-check';

// ---------------------------------------------------------------------------
// Mocks — must be declared before imports that use them
// ---------------------------------------------------------------------------

jest.mock('../../../../core/api/axiosClient', () => ({
  axiosClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

// React / React Query stubs — the property tests target pure logic, not hooks
jest.mock('react', () => ({
  useState: (init: unknown) => {
    let val = init;
    const setter = (v: unknown) => { val = typeof v === 'function' ? (v as Function)(val) : v; };
    return [val, setter];
  },
  useCallback: (fn: unknown) => fn,
}));

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
  useQueryClient: () => ({
    invalidateQueries: jest.fn().mockResolvedValue(undefined),
  }),
}));

import { axiosClient } from '../../../../core/api/axiosClient';
import {
  getTherapistSessionsApi,
  getTherapistKpisApi,
  getSheetRowUsablesApi,
  completeSheetRowApi,
} from '../../../../features/staffDashboards/data/datasources/staffDashboards.api';
import { therapistKeys } from '../../../../features/staffDashboards/data/repositories/staffDashboards.repository.impl';
import type { CompleteSheetRowRequest } from '../../../../features/staffDashboards/data/models/staffDashboards.dtos';

const mockGet = axiosClient.get as jest.Mock;
const mockPost = axiosClient.post as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockGet.mockResolvedValue({ data: {} });
  mockPost.mockResolvedValue({ data: {} });
});

// ===========================================================================
// Property 11: REQUEST_IN_PROGRESS retries use identical payload
// Feature: therapist-dashboard, Property 11: REQUEST_IN_PROGRESS retries use identical payload
// Validates: Requirements 8.1, 8.4
// ===========================================================================

describe('Property 11: REQUEST_IN_PROGRESS retries use identical payload', () => {
  /**
   * Arbitraries for generating a CompleteSheetRowRequest payload.
   * Mirrors the Zod schema constraints from the design doc.
   */
  const materialArb = fc.record({
    material_name: fc.string({ minLength: 1, maxLength: 50 }),
    quantity_used: fc.double({ min: 0.001, max: 10000, noNaN: true }),
    unit: fc.string({ minLength: 1, maxLength: 20 }),
    ml_per_unit: fc.double({ min: 0.001, max: 1000, noNaN: true }),
    category: fc.constantFrom('oil', 'medicine', 'disposable', 'other' as const),
  });

  const payloadArb = fc.record({
    materials: fc.array(materialArb, { minLength: 1, maxLength: 5 }),
  });

  it(
    'passes the exact same payload on every retry attempt when 409 REQUEST_IN_PROGRESS is returned',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          payloadArb,
          fc.uuid(), // tenantId
          fc.uuid(), // rowId
          async (payload, tenantId, rowId) => {
            // Clear mocks at the start of each property iteration
            jest.clearAllMocks();

            // Arrange: first 2 calls return 409 REQUEST_IN_PROGRESS, 3rd succeeds
            const conflictError = (retryAfterMs = 0) => {
              const err = Object.assign(new Error('409'), {
                response: {
                  status: 409,
                  data: {
                    error_code: 'REQUEST_IN_PROGRESS',
                    retry_after_ms: retryAfterMs,
                  },
                },
              });
              return Promise.reject(err);
            };

            mockPost
              .mockImplementationOnce(() => conflictError(0))
              .mockImplementationOnce(() => conflictError(0))
              .mockResolvedValueOnce({ data: { row_id: rowId, status: 'completed' } });

            // Act: invoke the API function directly to simulate the retry loop
            // We replicate the attempt logic from useCompleteSheetRowMutation
            // to verify payload identity without needing to render a hook.
            const frozenPayload: CompleteSheetRowRequest = JSON.parse(JSON.stringify(payload));
            const MAX_RETRIES = 3;

            const attempt = async (attemptNumber: number): Promise<void> => {
              try {
                await completeSheetRowApi(tenantId, rowId, frozenPayload);
              } catch (err: unknown) {
                const axiosError = err as {
                  response?: { status?: number; data?: { error_code?: string; retry_after_ms?: number } };
                };
                const status = axiosError?.response?.status;
                const body = axiosError?.response?.data;

                if (status === 409 && body?.error_code === 'REQUEST_IN_PROGRESS') {
                  if (attemptNumber < MAX_RETRIES) {
                    // retry_after_ms is 0 in tests — no real delay
                    const delay = body.retry_after_ms ?? 0;
                    if (delay > 0) {
                      await new Promise<void>((resolve) => setTimeout(resolve, delay));
                    }
                    return attempt(attemptNumber + 1);
                  }
                }
                throw err;
              }
            };

            await attempt(1);

            // Assert: completeSheetRowApi was called 3 times (2 retries + 1 success)
            expect(mockPost).toHaveBeenCalledTimes(3);

            // Assert: every call used the exact same payload (deep equality)
            const calls = mockPost.mock.calls;
            const firstPayload = calls[0][1];

            for (let i = 1; i < calls.length; i++) {
              expect(calls[i][1]).toEqual(firstPayload);
            }

            // Assert: the payload passed is deep-equal to the original input
            expect(firstPayload).toEqual(payload);
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  it(
    'payload is never mutated between retry attempts (reference identity of frozen copy)',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          payloadArb,
          fc.uuid(),
          fc.uuid(),
          async (payload, tenantId, rowId) => {
            // Clear mocks at the start of each property iteration
            jest.clearAllMocks();

            const conflictError = () => {
              const err = Object.assign(new Error('409'), {
                response: {
                  status: 409,
                  data: { error_code: 'REQUEST_IN_PROGRESS', retry_after_ms: 0 },
                },
              });
              return Promise.reject(err);
            };

            // All 3 attempts fail — we just want to verify payload consistency
            mockPost
              .mockImplementationOnce(() => conflictError())
              .mockImplementationOnce(() => conflictError())
              .mockImplementationOnce(() => conflictError());

            const frozenPayload: CompleteSheetRowRequest = JSON.parse(JSON.stringify(payload));
            const payloadSnapshot = JSON.stringify(frozenPayload);

            const attempt = async (attemptNumber: number): Promise<void> => {
              try {
                await completeSheetRowApi(tenantId, rowId, frozenPayload);
              } catch (err: unknown) {
                const axiosError = err as {
                  response?: { status?: number; data?: { error_code?: string; retry_after_ms?: number } };
                };
                const status = axiosError?.response?.status;
                const body = axiosError?.response?.data;

                if (status === 409 && body?.error_code === 'REQUEST_IN_PROGRESS') {
                  if (attemptNumber < 3) {
                    return attempt(attemptNumber + 1);
                  }
                }
                // exhausted — stop
              }
            };

            await attempt(1);

            // The frozen payload must not have been mutated across all 3 attempts
            expect(JSON.stringify(frozenPayload)).toBe(payloadSnapshot);

            // Every call received the same serialized payload
            const calls = mockPost.mock.calls;
            expect(calls).toHaveLength(3);
            for (const call of calls) {
              expect(JSON.stringify(call[1])).toBe(payloadSnapshot);
            }
          }
        ),
        { numRuns: 100 }
      );
    }
  );
});

// ===========================================================================
// Property 2: Tenant ID is present in all API call paths
// Feature: therapist-dashboard, Property 2: Tenant ID is present in all API call paths
// Validates: Requirements 1.7, 12.3
// ===========================================================================

describe('Property 2: Tenant ID is present in all API call paths', () => {
  it(
    'getTherapistSessionsApi URL contains tenantId under /api/v1/clinic/{tenantId}/',
    async () => {
      await fc.assert(
        fc.asyncProperty(fc.uuid(), async (tenantId) => {
          jest.clearAllMocks();
          mockGet.mockResolvedValue({ data: { items: [], total: 0, next_cursor: null } });

          await getTherapistSessionsApi(tenantId);

          const [url] = mockGet.mock.calls[0];
          expect(url).toContain(`/api/v1/clinic/${tenantId}/`);
        }),
        { numRuns: 100 }
      );
    }
  );

  it(
    'getTherapistKpisApi URL contains tenantId under /api/v1/clinic/{tenantId}/',
    async () => {
      await fc.assert(
        fc.asyncProperty(fc.uuid(), async (tenantId) => {
          jest.clearAllMocks();
          mockGet.mockResolvedValue({
            data: {
              completion_rate: 0,
              retention_rate: 0,
              satisfaction_score: null,
              rating_distribution: {},
              period_label: '30d',
            },
          });

          await getTherapistKpisApi(tenantId, 'staff-id', { period: '30d' });

          const [url] = mockGet.mock.calls[0];
          expect(url).toContain(`/api/v1/clinic/${tenantId}/`);
        }),
        { numRuns: 100 }
      );
    }
  );

  it(
    'getSheetRowUsablesApi URL is JWT-scoped and contains rowId',
    async () => {
      await fc.assert(
        fc.asyncProperty(fc.uuid(), async (tenantId) => {
          jest.clearAllMocks();
          mockGet.mockResolvedValue({ data: { items: [] } });

          await getSheetRowUsablesApi(tenantId, 'row-id');

          const [url] = mockGet.mock.calls[0];
          expect(url).toBe('/api/v1/clinic/treatment-sheets/rows/row-id/usables');
          expect(url).not.toContain(`/api/v1/clinic/${tenantId}/`);
        }),
        { numRuns: 100 }
      );
    }
  );

  it(
    'completeSheetRowApi URL is JWT-scoped and contains rowId',
    async () => {
      await fc.assert(
        fc.asyncProperty(fc.uuid(), async (tenantId) => {
          jest.clearAllMocks();
          mockPost.mockResolvedValue({ data: { row_id: 'row-id', status: 'completed' } });

          await completeSheetRowApi(tenantId, 'row-id', { materials: [] });

          const [url] = mockPost.mock.calls[0];
          expect(url).toBe('/api/v1/clinic/treatment-sheets/rows/row-id/complete');
          expect(url).not.toContain(`/api/v1/clinic/${tenantId}/`);
        }),
        { numRuns: 100 }
      );
    }
  );

  it(
    'dashboard APIs are tenant-scoped and row APIs are JWT-scoped',
    async () => {
      await fc.assert(
        fc.asyncProperty(fc.uuid(), async (tenantId) => {
          jest.clearAllMocks();
          // Set up mocks for all 4 calls
          mockGet.mockResolvedValue({ data: { items: [], total: 0, next_cursor: null } });
          mockPost.mockResolvedValue({ data: { row_id: 'row-id', status: 'completed' } });

          await getTherapistSessionsApi(tenantId);
          await getTherapistKpisApi(tenantId, 'staff-id', {});
          await getSheetRowUsablesApi(tenantId, 'row-id');
          await completeSheetRowApi(tenantId, 'row-id', { materials: [] });

          const getCalls = mockGet.mock.calls;
          const postCalls = mockPost.mock.calls;

          expect(getCalls[0][0]).toContain(`/api/v1/clinic/${tenantId}/`);
          expect(getCalls[1][0]).toContain(`/api/v1/clinic/${tenantId}/`);
          expect(getCalls[2][0]).toBe('/api/v1/clinic/treatment-sheets/rows/row-id/usables');
          expect(postCalls[0][0]).toBe('/api/v1/clinic/treatment-sheets/rows/row-id/complete');
        }),
        { numRuns: 100 }
      );
    }
  );
});

// ===========================================================================
// Property 3: Sessions API is called for any valid tenantId
// Feature: therapist-dashboard, Property 3: Sessions API is called for any valid tenantId
// Validates: Requirements 4.1, 3.1
// ===========================================================================

describe('Property 3: Sessions API is called for any valid tenantId', () => {
  it(
    'getTherapistSessionsApi builds URL containing the correct sessions path for any tenantId',
    async () => {
      await fc.assert(
        fc.asyncProperty(fc.uuid(), async (tenantId) => {
          jest.clearAllMocks();
          mockGet.mockResolvedValue({ data: { items: [], total: 0, next_cursor: null } });

          await getTherapistSessionsApi(tenantId);

          const [url] = mockGet.mock.calls[0];
          expect(url).toBe(
            `/api/v1/clinic/${tenantId}/staff/me/dashboard/therapist/sessions`
          );
        }),
        { numRuns: 100 }
      );
    }
  );

  it(
    'therapistKeys.sessions query key contains tenantId for any generated tenantId',
    async () => {
      await fc.assert(
        fc.property(fc.uuid(), (tenantId) => {
          const key = therapistKeys.sessions(tenantId);

          // The query key must contain the tenantId
          expect(key).toContain(tenantId);

          // The key must follow the expected structure
          expect(key[0]).toBe('staffDashboards');
          expect(key[1]).toBe('therapist');
          expect(key[2]).toBe('sessions');
          expect(key[3]).toBe(tenantId);
        }),
        { numRuns: 100 }
      );
    }
  );

  it(
    'therapistKeys.sessions query key with params still contains tenantId',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.record({
            cursor: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
            limit: fc.option(fc.integer({ min: 1, max: 100 }), { nil: undefined }),
          }),
          async (tenantId, params) => {
            const key = therapistKeys.sessions(tenantId, params);

            expect(key).toContain(tenantId);
            expect(key[3]).toBe(tenantId);
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  it(
    'getTherapistSessionsApi URL path matches /api/v1/clinic/{tenantId}/staff/me/dashboard/therapist/sessions exactly',
    async () => {
      await fc.assert(
        fc.asyncProperty(fc.uuid(), async (tenantId) => {
          jest.clearAllMocks();
          mockGet.mockResolvedValue({ data: { items: [], total: 0, next_cursor: null } });

          await getTherapistSessionsApi(tenantId);

          const [url] = mockGet.mock.calls[0];

          // Must start with the correct prefix
          expect(url).toMatch(
            new RegExp(`^/api/v1/clinic/${tenantId}/staff/me/dashboard/therapist/sessions$`)
          );

          // Must not contain any other tenant id segment
          const segments = url.split('/');
          const clinicIdx = segments.indexOf('clinic');
          expect(segments[clinicIdx + 1]).toBe(tenantId);
        }),
        { numRuns: 100 }
      );
    }
  );
});
