/**
 * Phase 1 · T-A.6 (ADR-P1-01, FR-A6, RB-1) — Verifies the freshness flag
 * genuinely gates behavior both ways:
 *  (1) OFF: none of T-A.2's invalidation calls fire in
 *      useConsultationWorkspace.ts (this is the "return to prior behavior"
 *      half of RB-1 — the ON case is already covered by
 *      consultationSaveInvalidation.test.tsx, which sets the flag ON).
 *  (2) consultation.tsx conditionally restores the old
 *      key={episodeId:appointmentId} remount when OFF, and omits it when
 *      ON — verified via source inspection (same established technique as
 *      T-0.5/T-0.7/T-E.1, since testing an actual React `key` prop's
 *      presence through rendering doesn't reliably expose it).
 */
import React from 'react';
import { act, renderHook } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import fs from 'fs';
import path from 'path';
import {
  useConsultationWorkspace,
} from '../../../features/episodes/presentation/hooks/useConsultationWorkspace';
import { useEpisodeWorkspaceData } from '../../../features/episodes/presentation/hooks/useEpisodeWorkspaceData';
import { createCasesheetApi, updateCasesheetApi } from '../../../features/casesheets/data/datasources/casesheets.api';
import { createPrescriptionApi, updatePrescriptionApi } from '../../../features/prescriptions/data/datasources/prescriptions.api';
import {
  sendToSchedulingApi,
  createTreatmentRecommendationApi,
} from '../../../features/treatmentSheets/data/datasources/treatmentOrders.api';
import { axiosClient } from '../../../core/api/axiosClient';

jest.mock('../../../core/hooks/useFeatures', () => ({
  useFeatures: () => ({ clinic_type: 'ayurveda', freshness_v1_enabled: false }),
  isAyurvedaClinic: () => true,
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

describe('freshness flag OFF: T-A.2 invalidation is skipped (T-A.6, RB-1)', () => {
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
    (createPrescriptionApi as jest.Mock).mockResolvedValue({ id: 'rx-1', prescription_data: { medications: [] } });
    (createTreatmentRecommendationApi as jest.Mock).mockResolvedValue({ id: 'order-1', state: 'ORDERED', is_order: true, version: 1 });
    (axiosClient.get as jest.Mock).mockResolvedValue({ data: { items: [] } });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('casesheet save still calls the API and refetchEpisode(), but does NOT invalidate the query cache', async () => {
    const { result } = renderWorkspace();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    const setDataSpy = jest.spyOn(queryClient, 'setQueryData');

    act(() => result.current.updateCasesheetField('chief_complaint', 'Knee pain'));
    await act(async () => {
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
    });

    expect(createCasesheetApi).toHaveBeenCalledTimes(1);
    expect(baseWorkspaceData.refetchEpisode).toHaveBeenCalled();
    expect(invalidateSpy).not.toHaveBeenCalled();
    expect(setDataSpy).not.toHaveBeenCalled();
  });

  it('prescription save still calls the API, but does NOT invalidate the query cache', async () => {
    const { result } = renderWorkspace();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    const setDataSpy = jest.spyOn(queryClient, 'setQueryData');

    act(() => result.current.onChange({ medications: [{ name: 'Paracetamol', dosage: '500mg', frequency: 'BID', duration: '5d' }] }));
    await act(async () => {
      await result.current.savePrescription();
    });

    expect(createPrescriptionApi).toHaveBeenCalledTimes(1);
    expect(invalidateSpy).not.toHaveBeenCalled();
    expect(setDataSpy).not.toHaveBeenCalled();
  });

  it('sendTreatmentToAdmin still calls the API and refetches, but does NOT invalidate treatment-order surfaces', async () => {
    (useEpisodeWorkspaceData as jest.Mock).mockReturnValue({ ...baseWorkspaceData, casesheetId: 'casesheet-1' });
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

    expect(createTreatmentRecommendationApi).toHaveBeenCalledTimes(1);
    expect(result.current.isTreatmentSent).toBe(true);
    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});

describe('consultation.tsx conditional remount (T-A.6, RB-1, source inspection)', () => {
  const source = fs.readFileSync(
    path.resolve(__dirname, '../../../app/clinic-admin/episodes/[episodeId]/consultation.tsx'),
    'utf8'
  );

  it('reads the freshness flag via useFeatures/isFreshnessV1Enabled', () => {
    expect(source).toContain("import { useFeatures, isFreshnessV1Enabled } from '../../../../core/hooks/useFeatures';");
    expect(source).toContain('const freshnessEnabled = isFreshnessV1Enabled(useFeatures());');
  });

  it('the key prop is undefined (no forced remount) when the flag is ON, and the old episode:appointment key when OFF', () => {
    expect(source).toContain('key={freshnessEnabled ? undefined : `${episodeId}:${appointmentId}`}');
  });
});
