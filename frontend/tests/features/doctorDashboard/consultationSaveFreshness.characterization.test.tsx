/**
 * Phase 1 · T-0.4 (baseline) / T-A.5 (fix) — "save → navigate → return"
 * freshness. See .kiro/specs/phase-1-clinical-platform-trust/design.md §4.A
 * and Document 09 finding V4 (Critical).
 *
 * T-0.4 ORIGINALLY documented current (pre-fix) behavior only, including a
 * latent effect-ordering defect (ED-003) explicitly deferred to T-A.5. T-A.5
 * fixed ED-003 (casesheet-sync effect now reads a ref instead of a stale
 * state closure) and removed the forced-remount mechanism at
 * app/clinic-admin/episodes/[episodeId]/consultation.tsx — this file's
 * ED-003 test is updated to verify the FIX, per the same pattern used
 * elsewhere in this phase when a characterization file's own governed
 * behavior changes in-scope (e.g. T-D.2/T-A.4). The other two tests in this
 * file are unaffected by T-A.5 and still pass unchanged.
 *
 * Mock setup mirrors the existing
 * tests/features/doctorDashboard/useConsultationWorkspace.test.tsx file so
 * this baseline stays consistent with established test infrastructure.
 */
import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useConsultationWorkspace,
} from '../../../features/episodes/presentation/hooks/useConsultationWorkspace';
import { useEpisodeWorkspaceData } from '../../../features/episodes/presentation/hooks/useEpisodeWorkspaceData';
import { createCasesheetApi, updateCasesheetApi } from '../../../features/casesheets/data/datasources/casesheets.api';
import { createPrescriptionApi, updatePrescriptionApi } from '../../../features/prescriptions/data/datasources/prescriptions.api';
import {
  createSimpleTreatmentSheetApi,
  updateAllTreatmentSheetRowsApi,
} from '../../../features/treatmentSheets/data/datasources/treatmentSheets.api';
import {
  sendToSchedulingApi,
  createTreatmentRecommendationApi,
} from '../../../features/treatmentSheets/data/datasources/treatmentOrders.api';
import { axiosClient } from '../../../core/api/axiosClient';
import fs from 'fs';
import path from 'path';

jest.mock('../../../core/hooks/useFeatures', () => ({
  useFeatures: () => ({ clinic_type: 'general', freshness_v1_enabled: false }),
  isAyurvedaClinic: () => false,
  // T-A.6: this file characterizes LOCAL draft state, unaffected by the
  // flag; value just needs to exist so the real hook doesn't throw.
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
  casesheetId: null,
  hasCasesheet: true,
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

const casesheetV1 = {
  id: 'casesheet-1',
  data_json: { basic: { chief_complaint: 'Initial complaint (V1)' }, extensions: [] },
};
const casesheetV2 = {
  id: 'casesheet-1',
  data_json: { basic: { chief_complaint: 'Updated complaint (V2, saved elsewhere)' }, extensions: [] },
};

// Phase 1 · T-A.2 (ADR-P1-01): the hook now calls useQueryClient() to
// invalidate the owning keys on save success, so it must be rendered inside
// a QueryClientProvider. A fresh QueryClient per test avoids cache bleed
// between tests. This does not change what this file characterizes (the
// LOCAL draft-staleness baseline) — the hook's invalidation calls have no
// effect on that, since nothing here reads via the invalidated query keys.
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

describe('Consultation save → navigate → return freshness (baseline, T-0.4)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    (axiosClient.get as jest.Mock).mockResolvedValue({ data: { items: [] } });
  });

  it('BASELINE (current, stale-by-design): re-rendering the SAME hook instance for the same episode/appointment with updated remote casesheet data does NOT refresh the local draft', async () => {
    (useEpisodeWorkspaceData as jest.Mock).mockReturnValue({
      ...baseWorkspaceData,
      casesheet: casesheetV1,
    });

    const { result, rerender } = renderWorkspace();

    // Initial sync loads V1 into the local draft.
    await waitFor(() => {
      expect(result.current.casesheetData.basic.chief_complaint).toBe('Initial complaint (V1)');
    });

    // Simulate what happens WITHOUT the forced-remount mechanism: the same
    // component instance stays mounted (Expo Router does not unmount on
    // forward navigation), and the underlying query now returns fresher data
    // (e.g. after a save-and-refetch elsewhere), but episodeId/appointmentId
    // are unchanged.
    (useEpisodeWorkspaceData as jest.Mock).mockReturnValue({
      ...baseWorkspaceData,
      casesheet: casesheetV2,
    });
    rerender({});

    // CURRENT BEHAVIOR: the local draft does NOT pick up V2. This is the
    // staleness Document 09 V4 and design.md §4.A describe — it is the
    // reason `consultation.tsx:17` currently forces a remount via a
    // `key={episodeId:appointmentId}` prop. This assertion documents the
    // baseline; it is not the desired end-state.
    expect(result.current.casesheetData.basic.chief_complaint).toBe('Initial complaint (V1)');
  });

  it('BASELINE: a genuinely fresh hook instance (simulating a remount) for the same episode/appointment DOES load current remote data', async () => {
    (useEpisodeWorkspaceData as jest.Mock).mockReturnValue({
      ...baseWorkspaceData,
      casesheet: casesheetV2,
    });

    // A fresh `renderHook` call is a new instance — analogous to what the
    // `key={episodeId:appointmentId}` remount currently forces to happen in
    // the real screen.
    const { result } = renderWorkspace();

    await waitFor(() => {
      expect(result.current.casesheetData.basic.chief_complaint).toBe(
        'Updated complaint (V2, saved elsewhere)'
      );
    });
  });

  it('T-A.5 FIX (was: latent defect ED-003): changing episodeId/appointmentId on the SAME hook instance resets the local draft AND correctly re-syncs the new episode\'s remote casesheet data', async () => {
    (useEpisodeWorkspaceData as jest.Mock).mockReturnValue({
      ...baseWorkspaceData,
      casesheet: casesheetV1,
    });

    const { result, rerender } = renderHook(
      (props: { episodeId: string; appointmentId: string }) =>
        useConsultationWorkspace({
          tenantId: 'tenant-1',
          episodeId: props.episodeId,
          appointmentId: props.appointmentId,
          clientId: 'client-1',
        }),
      { initialProps: { episodeId: 'episode-1', appointmentId: 'appointment-1' }, wrapper }
    );

    await waitFor(() => {
      expect(result.current.casesheetData.basic.chief_complaint).toBe('Initial complaint (V1)');
    });

    // Navigate to a DIFFERENT episode/appointment with different remote data,
    // on the SAME hook/component instance (i.e. what would happen if a future
    // change ever let the same consultation screen instance survive a
    // navigation between two different episodes/appointments, rather than
    // being fully remounted).
    (useEpisodeWorkspaceData as jest.Mock).mockReturnValue({
      ...baseWorkspaceData,
      casesheet: casesheetV2,
    });
    rerender({ episodeId: 'episode-2', appointmentId: 'appointment-2' });
    // Allow any further passive-effect passes to settle.
    await new Promise((resolve) => setTimeout(resolve, 50));

    // T-A.5 FIX: the casesheet-sync effect now reads `casesheetDataRef.current`
    // instead of the `casesheetData` state closure. The episode/appointment-keyed
    // reset effect (which runs first, in the same commit) already updated the
    // ref SYNCHRONOUSLY before the sync effect runs, so the sync effect
    // correctly sees "draft is empty" and loads V2 — instead of reading the
    // stale, still-populated V1 state (which isn't updated until the next
    // render) and wrongly concluding nothing needs loading. This was the
    // exact ED-003 gap; `consultation.tsx`'s forced remount (`key={...}`,
    // removed in this same task) previously masked it by never letting this
    // code path execute in production.
    await waitFor(() => {
      expect(result.current.casesheetData.basic.chief_complaint).toBe(
        'Updated complaint (V2, saved elsewhere)'
      );
    });
  });

  it('T-A.5 FIX: an analogous race for treatment-recommendation pre-population, found during this same task, is also fixed', async () => {
    // Episode 1's treatment recommendation was already sent (isTreatmentSent
    // becomes true). Episode 2 has a DIFFERENT, not-yet-sent treatment sheet
    // with its own existing recommendation that should pre-populate the
    // draft. Without isTreatmentSentRef (added in this task), the
    // pre-populate effect would read the STALE isTreatmentSent=true from
    // episode 1 in the same commit episode 2's data arrives, and skip
    // pre-populating episode 2's recommendedTherapy entirely.
    (useEpisodeWorkspaceData as jest.Mock).mockReturnValue({
      ...baseWorkspaceData,
      treatmentSheet: { id: 'sheet-1', status: 'DRAFT', rows: [], duration_days: 7, state: 'ORDERED', recommended_therapy: 'Abhyanga' },
      treatmentSheetId: 'sheet-1',
      hasTreatmentSheet: true,
    });

    const { result, rerender } = renderHook(
      (props: { episodeId: string; appointmentId: string }) =>
        useConsultationWorkspace({
          tenantId: 'tenant-1',
          episodeId: props.episodeId,
          appointmentId: props.appointmentId,
          clientId: 'client-1',
        }),
      { initialProps: { episodeId: 'episode-1', appointmentId: 'appointment-1' }, wrapper }
    );

    await waitFor(() => {
      expect(result.current.isTreatmentSent).toBe(true);
      expect(result.current.treatmentRecommendation.recommendedTherapy).toBe('Abhyanga');
    });

    (useEpisodeWorkspaceData as jest.Mock).mockReturnValue({
      ...baseWorkspaceData,
      treatmentSheet: { id: 'sheet-2', status: 'DRAFT', rows: [], duration_days: 14, state: 'DRAFT', recommended_therapy: 'Shirodhara' },
      treatmentSheetId: 'sheet-2',
      hasTreatmentSheet: true,
    });
    rerender({ episodeId: 'episode-2', appointmentId: 'appointment-2' });
    await new Promise((resolve) => setTimeout(resolve, 50));

    await waitFor(() => {
      expect(result.current.isTreatmentSent).toBe(false);
      expect(result.current.treatmentRecommendation.recommendedTherapy).toBe('Shirodhara');
    });
  });

  it('T-A.5: the forced-remount key is gone from the consultation route (source inspection)', () => {
    const routeSource = fs.readFileSync(
      path.resolve(__dirname, '../../../app/clinic-admin/episodes/[episodeId]/consultation.tsx'),
      'utf8'
    );
    expect(routeSource).not.toContain('key={`${episodeId}:${appointmentId}`}');
    expect(routeSource).toContain('<ConsultationWorkspaceScreen');
  });
});
