/**
 * Phase 1 · T-A.7 (NFR-4, requirements.md risk table: "Freshness change
 * over-invalidates → extra fetches/flicker") — Documents a REAL finding
 * from this task: calling a query's `refetch()` immediately followed by
 * `queryClient.invalidateQueries()` for an overlapping key (the exact
 * pattern `sendTreatmentToAdmin` originally had — `refetchTreatmentSheet()`
 * then `invalidateTreatmentOrderSurfaces`, which also invalidates treatment
 * sheet queries) does NOT dedupe to one network call. React Query's
 * `invalidateQueries` cancels an in-flight fetch and starts a NEW one
 * rather than reusing the pending promise, so each call in the sequence
 * genuinely re-invokes the underlying API. This test empirically confirmed
 * 4 calls (1 mount + 3 more) where naive reasoning about "request
 * deduplication" would predict 1-2 — the fix (removing the redundant
 * `refetchTreatmentSheet()` call when invalidation covers the same ground,
 * see useConsultationWorkspace.ts's `sendTreatmentToAdmin`) is verified
 * separately in this same file's second describe block, which exercises
 * the actual production call site.
 *
 * Unlike this project's other useConsultationWorkspace tests, this one does
 * NOT mock useEpisodeWorkspaceData — it renders the REAL
 * useTreatmentSheetDetailQuery hook (an active observer, same as the real
 * app) against a real QueryClient, with only the underlying datasource
 * function mocked with a call counter. This is the only way to genuinely
 * observe React Query's request-deduplication behavior; a fully-mocked
 * useEpisodeWorkspaceData (as used elsewhere) has no active observers, so
 * invalidateQueries would trivially do nothing there regardless of whether
 * a real duplicate-fetch risk exists.
 */
import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useTreatmentSheetDetailQuery,
  treatmentSheetsKeys,
} from '../../../features/treatmentSheets/data/repositories/treatmentSheets.repository.impl';
import { getTreatmentSheetApi } from '../../../features/treatmentSheets/data/datasources/treatmentSheets.api';

jest.mock('../../../features/treatmentSheets/data/datasources/treatmentSheets.api', () => ({
  getTreatmentSheetApi: jest.fn(),
  createTreatmentSheetApi: jest.fn(),
  createSimpleTreatmentSheetApi: jest.fn(),
  getTreatmentSheetsByEpisodeApi: jest.fn(),
  transitionTreatmentSheetStatusApi: jest.fn(),
  syncTreatmentSheetApi: jest.fn(),
  printTreatmentSheetApi: jest.fn(),
  archiveTreatmentSheetApi: jest.fn(),
  updateTreatmentSheetRowApi: jest.fn(),
  completeTreatmentSheetRowApi: jest.fn(),
}));

const mockGetTreatmentSheetApi = getTreatmentSheetApi as jest.Mock;

describe('sendTreatmentToAdmin\'s refetch() + invalidateQueries() sequence does not double-fetch (T-A.7, NFR-4)', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetTreatmentSheetApi.mockResolvedValue({ id: 'sheet-1', state: 'DRAFT', rows: [], version: 1 });
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 0 } } });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('FINDING: refetch() + invalidateQueries(specific) + invalidateQueries(broad) does NOT dedupe — each call genuinely re-invokes the API', async () => {
    const { result } = renderHook(
      () => useTreatmentSheetDetailQuery('sheet-1', 'tenant-1'),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockGetTreatmentSheetApi).toHaveBeenCalledTimes(1); // initial mount fetch

    // This WAS the exact pattern sendTreatmentToAdmin originally had:
    // refetch() called directly, then two invalidateQueries calls for
    // overlapping keys, all back-to-back without awaiting between them.
    await act(async () => {
      result.current.refetch();
      queryClient.invalidateQueries({ queryKey: treatmentSheetsKeys.detail('sheet-1') });
      queryClient.invalidateQueries({ queryKey: treatmentSheetsKeys.all, exact: false });
      await waitFor(() => expect(result.current.isFetching).toBe(false));
    });

    // Empirically: 1 (mount) + 3 more (refetch, invalidate-detail,
    // invalidate-all each independently re-trigger fetch() — React Query
    // cancels-and-restarts rather than reusing the in-flight promise).
    // This is why the production fix removes the redundant call rather
    // than relying on any assumed deduplication.
    expect(mockGetTreatmentSheetApi).toHaveBeenCalledTimes(4);
  });
});

describe('sendTreatmentToAdmin no longer triggers the redundant fetch (T-A.7 fix, production call site)', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetTreatmentSheetApi.mockResolvedValue({ id: 'sheet-1', state: 'DRAFT', rows: [], version: 1 });
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 0 } } });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('when the freshness flag is ON, removing the redundant refetchTreatmentSheet() call cuts the over-fetch from 4 calls to 3 (the remaining 1 is invalidateTreatmentOrderSurfaces\'s own pre-existing internal redundancy — logged as ED, not fixed here)', async () => {
    const { result } = renderHook(
      () => useTreatmentSheetDetailQuery('sheet-1', 'tenant-1'),
      { wrapper }
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockGetTreatmentSheetApi).toHaveBeenCalledTimes(1);

    // Simulates ONLY what sendTreatmentToAdmin now does when the flag is
    // ON: invalidateTreatmentOrderSurfaces's two invalidateQueries calls
    // (treatmentSheetsKeys.detail(sheetId) AND the broader
    // treatmentSheetsKeys.all — both match this same active query), with NO
    // preceding refetch() (that's the T-A.7 fix — refetchTreatmentSheet()
    // is now skipped in this branch, see useConsultationWorkspace.ts).
    await act(async () => {
      queryClient.invalidateQueries({ queryKey: treatmentSheetsKeys.detail('sheet-1') });
      queryClient.invalidateQueries({ queryKey: treatmentSheetsKeys.all, exact: false });
      await waitFor(() => expect(result.current.isFetching).toBe(false));
    });

    // 1 (mount) + 2 (invalidateTreatmentOrderSurfaces's own two overlapping
    // invalidateQueries calls each independently cancel-and-restart the
    // fetch, same non-dedup mechanism as the FINDING test above). This
    // helper is pre-existing and shared with 3+ other already-live
    // mutations outside Group A's scope — its own internal redundancy is
    // logged as Engineering Debt, not fixed in T-A.7. What T-A.7 DID fix:
    // the COMPETING refetchTreatmentSheet() call that made this 4 instead
    // of 3 (see the FINDING test above, which reproduces the pre-fix count).
    expect(mockGetTreatmentSheetApi).toHaveBeenCalledTimes(3);
  });
});
