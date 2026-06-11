/**
 * Treatment Orders Repository
 *
 * React Query hooks for the treatment-order execution lifecycle.
 * Separate from treatmentSheets.repository.impl.ts (documentation lifecycle).
 *
 * VERSION CONFLICT POLICY (applies to all mutations):
 *   On 409 with error = 'VERSION_CONFLICT':
 *     - Surface a toast message to the user.
 *     - Refetch the order to get the current version.
 *     - Do NOT auto-retry — let the user re-trigger.
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
} from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import {
  getTreatmentOrderApi,
  listTreatmentOrdersApi,
  sendToSchedulingApi,
  startSheetRowApi,
  scheduleRowApi,
  bulkScheduleRowsApi,
  cancelTreatmentOrderApi,
} from '../datasources/treatmentOrders.api';
import {
  TreatmentOrderResponse,
  TreatmentOrdersListResponse,
  TreatmentOrdersListParams,
  SendToSchedulingRequest,
  ScheduleRowRequest,
  BulkScheduleRequest,
  VersionConflictError,
} from '../models/treatmentOrders.dtos';

// ============================================
// QUERY KEYS
// ============================================

export const treatmentOrderKeys = {
  all: ['treatmentOrders'] as const,
  detail: (sheetId: string) =>
    [...treatmentOrderKeys.all, 'detail', sheetId] as const,
  worklist: (tenantId: string, params?: TreatmentOrdersListParams) =>
    [...treatmentOrderKeys.all, 'worklist', tenantId, params] as const,
  pendingDocumentation: (tenantId: string, staffId: string) =>
    [...treatmentOrderKeys.all, 'pendingDocumentation', tenantId, staffId] as const,
};

// ============================================
// QUERY HOOKS
// ============================================

/**
 * Fetch a single treatment order by sheet id.
 * Used by the doctor CTA screen and therapist start-session flow.
 */
export const useTreatmentOrderQuery = (
  sheetId: string,
  tenantId: string,
  options?: Omit<UseQueryOptions<TreatmentOrderResponse, Error>, 'queryKey' | 'queryFn'>
) =>
  useQuery<TreatmentOrderResponse, Error>({
    queryKey: treatmentOrderKeys.detail(sheetId),
    queryFn: () => getTreatmentOrderApi(sheetId, tenantId),
    enabled: !!sheetId && !!tenantId,
    staleTime: 0,
    ...options,
  });

/**
 * Admin worklist — paginated list of treatment orders.
 * Filtered by state / scheduling_status / overdue etc.
 */
export const useTreatmentOrdersQuery = (
  tenantId: string,
  params?: TreatmentOrdersListParams,
  options?: Omit<UseQueryOptions<TreatmentOrdersListResponse, Error>, 'queryKey' | 'queryFn'>
) =>
  useQuery<TreatmentOrdersListResponse, Error>({
    queryKey: treatmentOrderKeys.worklist(tenantId, params),
    queryFn: () => listTreatmentOrdersApi(tenantId, params),
    enabled: !!tenantId,
    staleTime: 0,
    ...options,
  });

/**
 * Doctor widget — sheets where state IN (ORDERED, SCHEDULED, IN_PROGRESS)
 * AND documentation_status NOT IN (FINAL, SIGNED).
 * ORDERED = sent to scheduling, awaiting assignment.
 * SCHEDULED/IN_PROGRESS = active, may need documentation.
 */
export const usePendingDocumentationQuery = (
  tenantId: string,
  options?: Omit<UseQueryOptions<TreatmentOrdersListResponse, Error>, 'queryKey' | 'queryFn'>
) =>
  useQuery<TreatmentOrdersListResponse, Error>({
    queryKey: treatmentOrderKeys.pendingDocumentation(tenantId, 'doctor'),
    queryFn: async () => {
      const [ordered, scheduled, inProgress] = await Promise.all([
        listTreatmentOrdersApi(tenantId, { state: 'ORDERED', limit: 50 }),
        listTreatmentOrdersApi(tenantId, { state: 'SCHEDULED', limit: 50 }),
        listTreatmentOrdersApi(tenantId, { state: 'IN_PROGRESS', limit: 50 }),
      ]);
      const items = [...ordered.items, ...scheduled.items, ...inProgress.items].filter(
        (o) => o.documentation_status === 'DRAFT'
      );
      return { items, total: items.length, skip: 0, limit: items.length };
    },
    enabled: !!tenantId,
    staleTime: 0,
    ...options,
  });

// ============================================
// VERSION CONFLICT HELPERS
// ============================================

/** Extracts the VersionConflictError body from an axios error, or null. */
const extractVersionConflict = (err: unknown): VersionConflictError | null => {
  const axiosErr = err as { response?: { status?: number; data?: any } };
  if (axiosErr?.response?.status !== 409) return null;
  // Body may be flat: {error, current_version} or nested: {detail: {error, current_version}}
  const body = axiosErr.response.data?.error === 'VERSION_CONFLICT'
    ? axiosErr.response.data
    : axiosErr.response.data?.detail?.error === 'VERSION_CONFLICT'
    ? axiosErr.response.data.detail
    : null;
  return body;
};

/** Extracts a human-readable message from any API error. */
const extractErrorMessage = (err: unknown, fallback: string): string => {
  const axiosErr = err as { response?: { data?: any }; message?: string };
  const data = axiosErr?.response?.data;
  // detail may be a string or an object — extract string safely
  const detail = data?.detail;
  const detailStr = typeof detail === 'string' ? detail : detail?.message || detail?.error || null;
  return (
    data?.message ||
    detailStr ||
    data?.error ||
    (axiosErr as any)?.message ||
    fallback
  );
};

// ============================================
// SEND TO SCHEDULING MUTATION
// ============================================

export type SendToSchedulingStatus = 'idle' | 'sending' | 'success' | 'error' | 'conflict';

export interface UseSendToSchedulingResult {
  mutate: (args: { sheetId: string; version: number; payload?: SendToSchedulingRequest }) => void;
  status: SendToSchedulingStatus;
  errorMessage: string | null;
  /** Current version after a conflict refetch — use this to re-trigger. */
  currentVersion: number | null;
  reset: () => void;
}

/**
 * Mutation: Send treatment sheet to scheduling (DRAFT → ORDERED).
 * On 409 VERSION_CONFLICT: surfaces conflict status + current_version for re-trigger.
 * Invalidates: treatmentOrder detail + admin worklist.
 */
export const useSendToSchedulingMutation = (tenantId: string): UseSendToSchedulingResult => {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<SendToSchedulingStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentVersion, setCurrentVersion] = useState<number | null>(null);

  const reset = useCallback(() => {
    setStatus('idle');
    setErrorMessage(null);
    setCurrentVersion(null);
  }, []);

  const mutate = useCallback(
    async ({ sheetId, version, payload = {} }: { sheetId: string; version: number; payload?: SendToSchedulingRequest }) => {
      setStatus('sending');
      setErrorMessage(null);
      setCurrentVersion(null);
      try {
        await sendToSchedulingApi(sheetId, version, payload);
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: treatmentOrderKeys.detail(sheetId) }),
          queryClient.invalidateQueries({ queryKey: treatmentOrderKeys.worklist(tenantId) }),
        ]);
        setStatus('success');
      } catch (err) {
        const conflict = extractVersionConflict(err);
        if (conflict) {
          // Refetch to surface the latest version to the caller
          await queryClient.invalidateQueries({ queryKey: treatmentOrderKeys.detail(sheetId) });
          setCurrentVersion(conflict.current_version);
          setStatus('conflict');
          setErrorMessage('This plan was updated elsewhere. Please review and try again.');
        } else {
          setStatus('error');
          setErrorMessage(extractErrorMessage(err, 'Failed to send to scheduling.'));
        }
      }
    },
    [tenantId, queryClient]
  );

  return { mutate, status, errorMessage, currentVersion, reset };
};

// ============================================
// START SESSION MUTATION
// ============================================

export type StartSessionStatus = 'idle' | 'starting' | 'success' | 'error' | 'conflict';

export interface UseStartSessionResult {
  mutate: (args: { sheetId: string; rowId: string; version: number }) => void;
  status: StartSessionStatus;
  errorMessage: string | null;
  currentVersion: number | null;
  reset: () => void;
}

/**
 * Mutation: Start a session row (SCHEDULED → IN_PROGRESS).
 * On 409 VERSION_CONFLICT: surfaces conflict + current_version.
 * On 422: surfaces validation error (e.g. row not in SCHEDULED state).
 * Invalidates: therapist sessions + treatment order detail.
 */
export const useStartSessionMutation = (tenantId: string): UseStartSessionResult => {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<StartSessionStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentVersion, setCurrentVersion] = useState<number | null>(null);

  const reset = useCallback(() => {
    setStatus('idle');
    setErrorMessage(null);
    setCurrentVersion(null);
  }, []);

  const mutate = useCallback(
    async ({ sheetId, rowId, version }: { sheetId: string; rowId: string; version: number }) => {
      setStatus('starting');
      setErrorMessage(null);
      setCurrentVersion(null);
      try {
        await startSheetRowApi(sheetId, rowId, version);
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: ['staffDashboards', 'therapist', 'sessions', tenantId],
            exact: false,
          }),
          queryClient.invalidateQueries({ queryKey: treatmentOrderKeys.detail(sheetId) }),
        ]);
        setStatus('success');
      } catch (err) {
        const conflict = extractVersionConflict(err);
        if (conflict) {
          await queryClient.invalidateQueries({ queryKey: treatmentOrderKeys.detail(sheetId) });
          await queryClient.invalidateQueries({
            queryKey: ['staffDashboards', 'therapist', 'sessions', tenantId],
            exact: false,
          });
          setCurrentVersion(conflict.current_version);
          setStatus('conflict');
          setErrorMessage('This session was updated elsewhere. Refreshing…');
        } else {
          setStatus('error');
          setErrorMessage(extractErrorMessage(err, 'Failed to start session.'));
        }
      }
    },
    [tenantId, queryClient]
  );

  return { mutate, status, errorMessage, currentVersion, reset };
};

// ============================================
// SCHEDULE ROW MUTATION (admin scheduler)
// ============================================

/**
 * Mutation: Schedule a single row (assign staff + date/time).
 * Returns the full updated TreatmentOrderResponse.
 */
export const useScheduleRowMutation = (tenantId: string) => {
  const queryClient = useQueryClient();

  return useMutation<
    TreatmentOrderResponse,
    Error,
    { sheetId: string; rowId: string; version: number; payload: ScheduleRowRequest }
  >({
    mutationFn: ({ sheetId, rowId, version, payload }) =>
      scheduleRowApi(sheetId, rowId, version, payload),
    onSuccess: (data) => {
      queryClient.setQueryData(treatmentOrderKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: treatmentOrderKeys.worklist(tenantId) });
    },
  });
};

/**
 * Mutation: Bulk-schedule multiple rows.
 */
export const useBulkScheduleRowsMutation = (tenantId: string) => {
  const queryClient = useQueryClient();

  return useMutation<
    TreatmentOrderResponse,
    Error,
    { sheetId: string; version: number; payload: BulkScheduleRequest }
  >({
    mutationFn: ({ sheetId, version, payload }) =>
      bulkScheduleRowsApi(sheetId, version, payload),
    onSuccess: (data) => {
      queryClient.setQueryData(treatmentOrderKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: treatmentOrderKeys.worklist(tenantId) });
    },
  });
};

// ============================================
// CANCEL ORDER MUTATION
// ============================================

/**
 * Mutation: Cancel a treatment order.
 * Invalidates: order detail + admin worklist + doctor dashboard.
 */
export const useCancelTreatmentOrderMutation = (tenantId: string) => {
  const queryClient = useQueryClient();

  return useMutation<TreatmentOrderResponse, Error, { sheetId: string; version: number }>({
    mutationFn: ({ sheetId, version }) => cancelTreatmentOrderApi(sheetId, version),
    onSuccess: (data) => {
      queryClient.setQueryData(treatmentOrderKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: treatmentOrderKeys.worklist(tenantId) });
    },
  });
};
