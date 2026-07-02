/**
 * Phase 1 · T-A.3 (FR-A3/A4, AC-2) — Verifies:
 *  (1) prescription save now produces an explicit "saved" confirmation
 *      (`sectionProgress.prescription.saveStatus`), previously hardcoded to
 *      'idle' regardless of outcome.
 *  (2) unmount (which every exit path in ConsultationWorkspaceScreen —
 *      back arrow, "Change Case", "Save & Submit" — triggers, since they
 *      all navigate away and unmount this hook) auto-commits any
 *      genuinely unsaved, non-empty prescription/treatment-recommendation
 *      draft rather than silently dropping it. Casesheet's equivalent
 *      unmount-flush already existed and is unaffected — not re-tested
 *      here (see useConsultationWorkspace.test.tsx's existing coverage).
 */
import React from 'react';
import { act, renderHook } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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
  // T-A.6: this file doesn't assert on invalidation, only save-confirmation
  // and unmount-flush behavior, which are unaffected by the flag — value
  // here is arbitrary, just needs to exist so the real hook doesn't throw.
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

describe('useConsultationWorkspace save confirmation + save-before-transition (T-A.3)', () => {
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
    (updatePrescriptionApi as jest.Mock).mockResolvedValue({ id: 'rx-1', prescription_data: { medications: [] } });
    (createTreatmentRecommendationApi as jest.Mock).mockResolvedValue({ id: 'order-1', state: 'ORDERED', is_order: true, version: 1 });
    (sendToSchedulingApi as jest.Mock).mockResolvedValue({ id: 'order-1', state: 'ORDERED', is_order: true, version: 2 });
    (axiosClient.get as jest.Mock).mockResolvedValue({ data: { items: [] } });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('FR-A3: prescription save confirmation', () => {
    it('exposes saveStatus "saved" (not hardcoded "idle") after a successful save', async () => {
      const { result } = renderWorkspace();

      act(() => result.current.onChange({ medications: [{ name: 'Paracetamol', dosage: '500mg', frequency: 'BID', duration: '5d' }] }));
      await act(async () => {
        await result.current.savePrescription();
      });

      expect(result.current.sectionProgress.prescription?.saveStatus).toBe('saved');
    });

    it('fades back to idle 2s after a successful save (same pattern as casesheet sections)', async () => {
      const { result } = renderWorkspace();

      act(() => result.current.onChange({ medications: [{ name: 'Paracetamol', dosage: '500mg', frequency: 'BID', duration: '5d' }] }));
      await act(async () => {
        await result.current.savePrescription();
      });
      expect(result.current.sectionProgress.prescription?.saveStatus).toBe('saved');

      act(() => {
        jest.advanceTimersByTime(2000);
      });
      expect(result.current.sectionProgress.prescription?.saveStatus).toBe('idle');
    });

    it('exposes saveStatus "error" when the save fails', async () => {
      (updatePrescriptionApi as jest.Mock).mockRejectedValue(new Error('network down'));
      (axiosClient.get as jest.Mock).mockResolvedValue({
        data: { items: [{ id: 'rx-1', prescription_data: { medications: [] } }] },
      });
      const { result } = renderWorkspace();
      await act(async () => {}); // let load-on-mount settle

      act(() => result.current.onChange({ medications: [{ name: 'Ibuprofen', dosage: '400mg', frequency: 'TID', duration: '3d' }] }));
      await act(async () => {
        await expect(result.current.savePrescription()).rejects.toThrow('network down');
      });

      expect(result.current.sectionProgress.prescription?.saveStatus).toBe('error');
    });
  });

  describe('FR-A4: save-before-transition (unmount-flush)', () => {
    it('auto-saves an unsaved, non-empty prescription draft on unmount', async () => {
      const { result, unmount } = renderWorkspace();

      act(() => result.current.onChange({ medications: [{ name: 'Amoxicillin', dosage: '250mg', frequency: 'TID', duration: '7d' }] }));
      expect(createPrescriptionApi).not.toHaveBeenCalled();

      unmount();
      await act(async () => {
        await Promise.resolve();
      });

      expect(createPrescriptionApi).toHaveBeenCalledWith(
        'tenant-1',
        expect.objectContaining({
          prescription_data: { medications: [{ name: 'Amoxicillin', dosage: '250mg', frequency: 'TID', duration: '7d' }] },
        }),
      );
    });

    it('does NOT auto-save on unmount if the medication list has no real name (empty draft, not worth committing)', async () => {
      const { result, unmount } = renderWorkspace();

      act(() => result.current.onChange({ medications: [{ name: '', dosage: '', frequency: '', duration: '' }] }));
      unmount();
      await act(async () => {
        await Promise.resolve();
      });

      expect(createPrescriptionApi).not.toHaveBeenCalled();
    });

    it('does NOT auto-save on unmount if nothing was edited (not dirty)', async () => {
      const { unmount } = renderWorkspace();
      unmount();
      await act(async () => {
        await Promise.resolve();
      });

      expect(createPrescriptionApi).not.toHaveBeenCalled();
    });

    it('does NOT auto-save on unmount after "Mark as Not Required" (intentional resolution, not a dropped draft)', async () => {
      const { result, unmount } = renderWorkspace();

      act(() => result.current.onChange({ medications: [{ name: 'Aspirin', dosage: '75mg', frequency: 'OD', duration: '30d' }] }));
      act(() => result.current.markPrescriptionNotRequired());
      unmount();
      await act(async () => {
        await Promise.resolve();
      });

      expect(createPrescriptionApi).not.toHaveBeenCalled();
    });

    it('auto-sends an unsent, non-empty treatment recommendation draft on unmount', async () => {
      // Ensure a casesheetId exists so sendTreatmentToAdmin can proceed.
      (useEpisodeWorkspaceData as jest.Mock).mockReturnValue({
        ...baseWorkspaceData,
        casesheetId: 'casesheet-1',
      });
      (createCasesheetApi as jest.Mock).mockResolvedValue({ id: 'casesheet-1' });

      const { result, unmount } = renderWorkspace();

      act(() => result.current.updateCasesheetField('chief_complaint', 'Pain'));
      await act(async () => {
        jest.advanceTimersByTime(1000);
        await Promise.resolve();
      });

      act(() => result.current.updateTreatmentField('recommendedTherapy', 'Shirodhara'));
      expect(createTreatmentRecommendationApi).not.toHaveBeenCalled();

      unmount();
      await act(async () => {
        await Promise.resolve();
      });

      expect(createTreatmentRecommendationApi).toHaveBeenCalledWith(
        'tenant-1',
        expect.objectContaining({ recommended_therapy: 'Shirodhara' }),
      );
    });

    it('does NOT auto-send on unmount if the therapy field is empty', async () => {
      const { result, unmount } = renderWorkspace();

      act(() => result.current.updateTreatmentField('notesForAdmin', 'some note but no therapy'));
      unmount();
      await act(async () => {
        await Promise.resolve();
      });

      expect(createTreatmentRecommendationApi).not.toHaveBeenCalled();
    });

    it('does NOT re-send on unmount if the recommendation was already sent and nothing changed since', async () => {
      (useEpisodeWorkspaceData as jest.Mock).mockReturnValue({
        ...baseWorkspaceData,
        treatmentSheet: { id: 'sheet-1', status: 'DRAFT', rows: [], duration_days: 7, state: 'DRAFT' },
        treatmentSheetId: 'sheet-1',
        hasTreatmentSheet: true,
      });

      const { result, unmount } = renderWorkspace();

      act(() => result.current.updateTreatmentField('recommendedTherapy', 'Abhyanga'));
      await act(async () => {
        await result.current.sendTreatmentToAdmin();
      });
      expect(sendToSchedulingApi).toHaveBeenCalledTimes(1);

      unmount();
      await act(async () => {
        await Promise.resolve();
      });

      // No further send attempt — dirty flag was cleared on the explicit send.
      expect(sendToSchedulingApi).toHaveBeenCalledTimes(1);
      expect(createTreatmentRecommendationApi).not.toHaveBeenCalled();
    });
  });
});
