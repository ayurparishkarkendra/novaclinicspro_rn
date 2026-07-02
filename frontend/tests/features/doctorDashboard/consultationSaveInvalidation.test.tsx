/**
 * Phase 1 · T-A.2 (ADR-P1-01) — Verifies each affected clinical save in
 * `useConsultationWorkspace.ts` invalidates the owning query key(s) on
 * success, using the addressing scheme established in T-A.1. This is the
 * "post-save read is fresh" verification the task calls for: it asserts on
 * the actual `queryClient` calls (spied), not on this hook's own local
 * draft state (already covered by useConsultationWorkspace.test.tsx and the
 * T-0.4 baseline in consultationSaveFreshness.characterization.test.tsx,
 * both of which are unaffected by these additions).
 */
import React from 'react';
import { act, renderHook } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useConsultationWorkspace,
} from '../../../features/episodes/presentation/hooks/useConsultationWorkspace';
import { useEpisodeWorkspaceData } from '../../../features/episodes/presentation/hooks/useEpisodeWorkspaceData';
import { createCasesheetApi, updateCasesheetApi } from '../../../features/casesheets/data/datasources/casesheets.api';
import { casesheetsKeys } from '../../../features/casesheets/data/repositories/casesheets.repository.impl';
import { createPrescriptionApi, updatePrescriptionApi } from '../../../features/prescriptions/data/datasources/prescriptions.api';
import { prescriptionsKeys } from '../../../features/prescriptions/data/repositories/prescriptions.repository.impl';
import {
  sendToSchedulingApi,
  createTreatmentRecommendationApi,
} from '../../../features/treatmentSheets/data/datasources/treatmentOrders.api';
import { treatmentOrderKeys } from '../../../features/treatmentSheets/data/repositories/treatmentOrders.repository.impl';
import { treatmentSheetsKeys } from '../../../features/treatmentSheets/data/repositories/treatmentSheets.repository.impl';
import { axiosClient } from '../../../core/api/axiosClient';

jest.mock('../../../core/hooks/useFeatures', () => ({
  useFeatures: () => ({ clinic_type: 'ayurveda', freshness_v1_enabled: true }),
  isAyurvedaClinic: () => true,
  // T-A.6: this file specifically verifies invalidation behavior, so the
  // flag must read as ON here — the gating itself is covered separately
  // in freshnessFeatureFlag.test.tsx.
  isFreshnessV1Enabled: (f: any) => !!f.freshness_v1_enabled,
}));
jest.mock('../../../features/episodes/presentation/hooks/useEpisodeWorkspaceData', () => ({
  useEpisodeWorkspaceData: jest.fn(),
}));
jest.mock('../../../features/casesheets/data/datasources/casesheets.api', () => ({
  createCasesheetApi: jest.fn(),
  updateCasesheetApi: jest.fn(),
}));
jest.mock('../../../features/prescriptions/data/datasources/prescriptions.api', () => ({
  createPrescriptionApi: jest.fn(),
  updatePrescriptionApi: jest.fn(),
}));
jest.mock('../../../features/treatmentSheets/data/datasources/treatmentSheets.api', () => ({
  createSimpleTreatmentSheetApi: jest.fn(),
  updateAllTreatmentSheetRowsApi: jest.fn(),
}));
jest.mock('../../../features/treatmentSheets/data/datasources/treatmentOrders.api', () => ({
  sendToSchedulingApi: jest.fn(),
  createTreatmentRecommendationApi: jest.fn(),
}));
jest.mock('../../../core/api/axiosClient', () => ({
  axiosClient: { get: jest.fn(), post: jest.fn() },
}));

const baseWorkspaceData = {
  episodeDetails: undefined,
  isEpisodeLoading: false,
  isEpisodeError: false,
  refetchEpisode: jest.fn(),
  casesheet: undefined,
  casesheetId: null,
  hasCasesheet: false,
  isCasesheetLoading: false,
  treatmentSheet: undefined,
  treatmentSheets: [],
  treatmentSheetId: null,
  hasTreatmentSheet: false,
  isTreatmentSheetLoading: false,
  isTreatmentSheetError: false,
  refetchTreatmentSheet: jest.fn(),
  visits: [],
  clientId: 'client-1',
  clientName: 'Patient',
};

describe('useConsultationWorkspace save invalidation (T-A.2)', () => {
  let queryClient: QueryClient;
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const renderWorkspace = () =>
    renderHook(
      () =>
        useConsultationWorkspace({
          tenantId: 'tenant-1',
          episodeId: 'episode-1',
          appointmentId: 'appointment-1',
          clientId: 'client-1',
        }),
      { wrapper },
    );

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    (useEpisodeWorkspaceData as jest.Mock).mockReturnValue(baseWorkspaceData);
    (createCasesheetApi as jest.Mock).mockResolvedValue({ id: 'casesheet-1', data_json: {} });
    (updateCasesheetApi as jest.Mock).mockResolvedValue({ id: 'casesheet-1', data_json: {} });
    (createPrescriptionApi as jest.Mock).mockResolvedValue({ id: 'rx-1', prescription_data: { medications: [] } });
    (updatePrescriptionApi as jest.Mock).mockResolvedValue({ id: 'rx-1', prescription_data: { medications: [] } });
    (createTreatmentRecommendationApi as jest.Mock).mockResolvedValue({ id: 'order-1', state: 'ORDERED', is_order: true, version: 1 });
    (sendToSchedulingApi as jest.Mock).mockResolvedValue({ id: 'order-1', state: 'ORDERED', is_order: true, version: 2 });
    (axiosClient.get as jest.Mock).mockResolvedValue({ data: { items: [] } });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('casesheet CREATE (autosave) primes the detail cache and invalidates the client list', async () => {
    const { result } = renderWorkspace();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    const setDataSpy = jest.spyOn(queryClient, 'setQueryData');

    act(() => result.current.updateCasesheetField('chief_complaint', 'Knee pain'));
    await act(async () => {
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
    });

    expect(setDataSpy).toHaveBeenCalledWith(
      casesheetsKeys.detail('tenant-1', 'casesheet-1'),
      expect.objectContaining({ id: 'casesheet-1' }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: casesheetsKeys.list('tenant-1', 'client-1'),
    });
  });

  it('casesheet UPDATE (autosave) writes fresh data to the detail cache and invalidates all lists', async () => {
    (useEpisodeWorkspaceData as jest.Mock).mockReturnValue({
      ...baseWorkspaceData,
      casesheetId: 'casesheet-1',
      hasCasesheet: true,
    });
    const { result } = renderWorkspace();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    const setDataSpy = jest.spyOn(queryClient, 'setQueryData');

    act(() => result.current.updateCasesheetField('plan', 'Rest'));
    await act(async () => {
      await result.current.flushPendingAutosave();
    });

    expect(setDataSpy).toHaveBeenCalledWith(
      casesheetsKeys.detail('tenant-1', 'casesheet-1'),
      expect.objectContaining({ id: 'casesheet-1' }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: casesheetsKeys.lists() });
  });

  it('prescription CREATE primes the detail cache and invalidates lists + the episode/appointment key', async () => {
    const { result } = renderWorkspace();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    const setDataSpy = jest.spyOn(queryClient, 'setQueryData');

    act(() => result.current.onChange({ medications: [{ name: 'Paracetamol', dosage: '500mg', frequency: 'BID', duration: '5d' }] }));
    await act(async () => {
      await result.current.savePrescription();
    });

    expect(setDataSpy).toHaveBeenCalledWith(
      prescriptionsKeys.detail('tenant-1', 'rx-1'),
      expect.objectContaining({ id: 'rx-1' }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: prescriptionsKeys.lists() });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: prescriptionsKeys.byAppointment('tenant-1', 'episode-1', 'appointment-1'),
    });
  });

  it('prescription UPDATE primes the detail cache and invalidates lists + the episode/appointment key', async () => {
    (axiosClient.get as jest.Mock).mockResolvedValue({
      data: { items: [{ id: 'rx-1', prescription_data: { medications: [] } }] },
    });
    const { result } = renderWorkspace();
    await act(async () => {}); // let the load-on-mount effect settle

    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    const setDataSpy = jest.spyOn(queryClient, 'setQueryData');

    act(() => result.current.onChange({ medications: [{ name: 'Ibuprofen', dosage: '400mg', frequency: 'TID', duration: '3d' }] }));
    await act(async () => {
      await result.current.savePrescription();
    });

    expect(setDataSpy).toHaveBeenCalledWith(
      prescriptionsKeys.detail('tenant-1', 'rx-1'),
      expect.objectContaining({ id: 'rx-1' }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: prescriptionsKeys.lists() });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: prescriptionsKeys.byAppointment('tenant-1', 'episode-1', 'appointment-1'),
    });
  });

  it('sendTreatmentToAdmin (create order) invalidates treatment-order surfaces via the shared helper', async () => {
    (useEpisodeWorkspaceData as jest.Mock).mockReturnValue({
      ...baseWorkspaceData,
      casesheetId: 'casesheet-1',
    });
    (createCasesheetApi as jest.Mock).mockResolvedValue({ id: 'casesheet-1' });
    const { result } = renderWorkspace();

    act(() => result.current.updateCasesheetField('chief_complaint', 'Pain'));
    await act(async () => {
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
    });

    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    act(() => result.current.updateTreatmentField('recommendedTherapy', 'Shirodhara'));
    await act(async () => {
      await result.current.sendTreatmentToAdmin();
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: treatmentOrderKeys.detail('order-1'),
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: treatmentSheetsKeys.detail('order-1'),
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: treatmentOrderKeys.worklists('tenant-1'),
      exact: false,
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: treatmentSheetsKeys.all,
      exact: false,
    });
  });

  it('sendTreatmentToAdmin (update existing order) invalidates treatment-order surfaces via the shared helper', async () => {
    (useEpisodeWorkspaceData as jest.Mock).mockReturnValue({
      ...baseWorkspaceData,
      treatmentSheet: { id: 'sheet-1', status: 'DRAFT', rows: [], duration_days: 7, state: 'DRAFT' },
      treatmentSheetId: 'sheet-1',
      hasTreatmentSheet: true,
    });
    const { result } = renderWorkspace();

    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    act(() => result.current.updateTreatmentField('recommendedTherapy', 'Abhyanga'));
    await act(async () => {
      await result.current.sendTreatmentToAdmin();
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: treatmentOrderKeys.detail('sheet-1'),
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: treatmentSheetsKeys.detail('sheet-1'),
    });
  });
});
