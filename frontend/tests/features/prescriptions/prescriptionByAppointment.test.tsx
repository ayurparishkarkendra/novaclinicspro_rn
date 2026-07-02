/**
 * Phase 1 · T-A.1 (ADR-P1-01) — Verifies the new deterministic addressing
 * scheme for "the prescription for this consultation" (episode+appointment
 * scoped): `prescriptionsKeys.byAppointment` and
 * `usePrescriptionByAppointmentQuery`.
 *
 * This does NOT test `useConsultationWorkspace.ts` — it isn't wired to use
 * this hook yet (that's a later, flag-gated task). This test only proves the
 * key/hook themselves are correct and match the exact request the workspace
 * currently issues manually.
 */
import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  prescriptionsKeys,
  usePrescriptionByAppointmentQuery,
} from '../../../features/prescriptions/data/repositories/prescriptions.repository.impl';
import { listPrescriptionsApi } from '../../../features/prescriptions/data/datasources/prescriptions.api';

jest.mock('../../../features/prescriptions/data/datasources/prescriptions.api', () => ({
  listPrescriptionsApi: jest.fn(),
}));

const mockListPrescriptionsApi = listPrescriptionsApi as jest.Mock;

describe('prescriptionsKeys.byAppointment (deterministic addressing)', () => {
  it('produces the same key for the same tenant/episode/appointment', () => {
    expect(prescriptionsKeys.byAppointment('tenant-1', 'episode-1', 'appt-1')).toEqual(
      prescriptionsKeys.byAppointment('tenant-1', 'episode-1', 'appt-1')
    );
  });

  it('produces a different key for a different appointment (correctly scoped, not collapsed)', () => {
    expect(prescriptionsKeys.byAppointment('tenant-1', 'episode-1', 'appt-1')).not.toEqual(
      prescriptionsKeys.byAppointment('tenant-1', 'episode-1', 'appt-2')
    );
  });

  it('produces a different key for a different episode (same appointment id reused across episodes is not conflated)', () => {
    expect(prescriptionsKeys.byAppointment('tenant-1', 'episode-1', 'appt-1')).not.toEqual(
      prescriptionsKeys.byAppointment('tenant-1', 'episode-2', 'appt-1')
    );
  });
});

describe('usePrescriptionByAppointmentQuery', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    mockListPrescriptionsApi.mockResolvedValue({ items: [], total: 0, skip: 0, limit: 20 });
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('calls listPrescriptionsApi with the exact appointment_id + episode_id filter the workspace currently uses manually', async () => {
    const { result } = renderHook(
      () => usePrescriptionByAppointmentQuery('tenant-1', 'episode-1', 'appt-1'),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockListPrescriptionsApi).toHaveBeenCalledWith('tenant-1', {
      appointment_id: 'appt-1',
      episode_id: 'episode-1',
    });
  });

  it('is disabled (does not fetch) when appointmentId or episodeId is missing', () => {
    const { result } = renderHook(
      () => usePrescriptionByAppointmentQuery('tenant-1', '', ''),
      { wrapper }
    );

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockListPrescriptionsApi).not.toHaveBeenCalled();
  });
});
