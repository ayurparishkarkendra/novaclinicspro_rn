import '../doctorDashboard/setup';
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConsultationWorkspaceScreen } from '../../../features/episodes/presentation/pages/ConsultationWorkspaceScreen';
import * as WorkspaceContextModule from '../../../features/episodes/presentation/context/ClinicalWorkspaceContext';
import { WorkspaceSaveStatusProvider } from '../../../features/episodes/presentation/context/WorkspaceSaveStatusContext';
import { useEpisodeWorkspaceData } from '../../../features/episodes/presentation/hooks/useEpisodeWorkspaceData';
import { createCasesheetApi, updateCasesheetApi } from '../../../features/casesheets/data/datasources/casesheets.api';
import { createPrescriptionApi, updatePrescriptionApi } from '../../../features/prescriptions/data/datasources/prescriptions.api';
import {
  createSimpleTreatmentSheetApi,
  updateAllTreatmentSheetRowsApi,
} from '../../../features/treatmentSheets/data/datasources/treatmentSheets.api';
import { sendToSchedulingApi, createTreatmentRecommendationApi } from '../../../features/treatmentSheets/data/datasources/treatmentOrders.api';
import { createClinicalServiceApi } from '../../../features/clinicalServices/data/datasources/clinicalServices.api';
import { axiosClient } from '../../../core/api/axiosClient';

/**
 * R3A · T-C.1 — Verify module-switching never re-triggers context
 * resolution (design §9.G, FR-E2, AC-1).
 *
 * design §9.G's own "ModuleHost" label refers to ConsultationWorkspaceScreen's
 * existing ScrollView + expandedSections collapsible-section pattern (§3.2)
 * — confirmed by grep, there is no separately implemented `ModuleHost`
 * component to test against; ConsultationWorkspaceScreen IS ModuleHost.
 *
 * sectionSwitchingContext.characterization.test.tsx (T-0.2) already proves
 * switching sections doesn't refetch/reset draft state or change WHICH
 * tenant/episode/client identifiers are used — but it asserts on primitive
 * argument equality, not object identity. It does not (and, being T-0.2's
 * pre-Persistent-Context baseline, could not) assert that the actual
 * EpisodeContext/PatientContext/VisitContext VALUE OBJECTS returned by
 * useEpisodeContext()/usePatientContext()/useVisitContext() are the SAME
 * reference across a switch — the specific guarantee T-C.1 asks for, and
 * the one that actually matters for CO-1..CO-4 (single owner) and for every
 * migrated module avoiding unnecessary re-renders of its children.
 *
 * Technique: jest.spyOn(...) on the real hook exports (call-through, not a
 * full jest.mock replacement) records every invocation's return value via
 * spy.mock.results while every module (CaseSheetModule, PrescriptionModule,
 * TreatmentRecommendationModule, ClinicalServicesModule — all unconditional
 * children of ConsultationWorkspaceScreen, mounted regardless of
 * expand/collapse state per sectionRenderer.tsx) keeps calling the REAL,
 * unmodified hooks. Toggling sections re-renders ConsultationWorkspaceScreen
 * and therefore every module beneath it, so each hook fires many times
 * across a toggle cycle.
 *
 * Two tests, two different things proven (confirmed empirically — see
 * tasks.md's T-C.1 writeup for the negative-control experiment run before
 * writing this note): the first test's guarantee holds "by construction"
 * (design §9.G's own words) purely from React's component-tree shape —
 * expandedSections is local state on ConsultationWorkspaceScreen, a
 * descendant of WorkspaceProvider, so toggling it can never cause
 * WorkspaceProvider itself to re-render, regardless of whether its value is
 * memoized. That test alone would still pass even if WorkspaceProvider's own
 * useMemo were deleted — it isn't exercising the memo, only the tree shape.
 * The second test closes that gap: it forces a whole-tree rerender (which
 * DOES reach WorkspaceProvider, unlike a toggle) with unchanged inputs, and
 * would fail if the memo (or its dependency array) were ever broken.
 */

jest.mock('../../../features/auth/presentation/hooks/useAuth', () => ({
  useAuth: () => ({ currentUser: { tenantId: 'tenant-1' }, selectedClinicId: null }),
}));
jest.mock('../../../core/hooks/useFeatures', () => ({
  useFeatures: () => ({ clinic_type: 'ayurveda' }),
  isAyurvedaClinic: (value: any) => value.clinic_type === 'ayurveda',
  isFreshnessV1Enabled: () => false,
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
jest.mock('../../../features/clinicalServices/data/datasources/clinicalServices.api', () => ({
  createClinicalServiceApi: jest.fn(),
}));
jest.mock('../../../core/api/axiosClient', () => ({
  axiosClient: { get: jest.fn(), post: jest.fn() },
}));

const episodeDetails = {
  episode: {
    id: 'episode-1',
    title: 'Chronic Knee Pain',
    status: 'ACTIVE',
    start_date: '2026-06-01',
    end_date: null,
    description: null,
    client_id: 'client-1',
    client_name: 'Maya Rao',
    visits_count: 1,
    last_visit_date: null,
  },
  documents: {
    casesheet: { exists: false, id: null, status: null, created_at: null },
    treatment_sheet: { exists: false, id: null, status: null, created_at: null },
  },
  visits: [],
};

const mockWorkspaceData = {
  episodeDetails,
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
  clientName: 'Maya Rao',
};

let queryClient: QueryClient;
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <WorkspaceContextModule.WorkspaceProvider tenantId="tenant-1" episodeId="episode-1" appointmentId="appointment-1" clientId="client-1">
      <WorkspaceSaveStatusProvider>{children}</WorkspaceSaveStatusProvider>
    </WorkspaceContextModule.WorkspaceProvider>
  </QueryClientProvider>
);

const renderScreen = () =>
  render(
    <ConsultationWorkspaceScreen episodeId="episode-1" appointmentId="appointment-1" clientId="client-1" />,
    { wrapper },
  );

describe('Persistent Context continuity across module switching (R3A · T-C.1, FR-E2/AC-1)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    (useEpisodeWorkspaceData as jest.Mock).mockReturnValue(mockWorkspaceData);
    (createCasesheetApi as jest.Mock).mockResolvedValue({ id: 'casesheet-1' });
    (updateCasesheetApi as jest.Mock).mockResolvedValue({});
    (createPrescriptionApi as jest.Mock).mockResolvedValue({ id: 'rx-1' });
    (updatePrescriptionApi as jest.Mock).mockResolvedValue({});
    (createSimpleTreatmentSheetApi as jest.Mock).mockResolvedValue({ id: 'new-sheet', rows: [], version: 1 });
    (createTreatmentRecommendationApi as jest.Mock).mockResolvedValue({ id: 'new-order', state: 'ORDERED', is_order: true, version: 2 });
    (createClinicalServiceApi as jest.Mock).mockResolvedValue({ id: 'cs-1', visit_id: 'visit-1' });
    (axiosClient.get as jest.Mock).mockResolvedValue({ data: { items: [] } });
    (axiosClient.post as jest.Mock).mockResolvedValue({ data: { id: 'new-sheet', rows: [], version: 1 } });
    (sendToSchedulingApi as jest.Mock).mockResolvedValue({ id: 'sheet-1', state: 'ORDERED', is_order: true, version: 1 });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('EpisodeContext/PatientContext/VisitContext keep the exact same object reference across an expand/collapse cycle', () => {
    const episodeSpy = jest.spyOn(WorkspaceContextModule, 'useEpisodeContext');
    const patientSpy = jest.spyOn(WorkspaceContextModule, 'usePatientContext');
    const visitSpy = jest.spyOn(WorkspaceContextModule, 'useVisitContext');

    const { getByText } = renderScreen();

    // Every module (CaseSheetModule, PrescriptionModule,
    // TreatmentRecommendationModule, ClinicalServicesModule) is an
    // unconditional child of the screen, so each toggle re-renders all of
    // them — and each calls all three hooks again.
    fireEvent.press(getByText('Clinical Notes'));
    fireEvent.press(getByText('Prescription'));
    fireEvent.press(getByText('Treatment Recommendation'));
    fireEvent.press(getByText('Clinical Services'));

    // Each hook must actually have been re-invoked multiple times across
    // the four toggles — otherwise this test would trivially pass without
    // exercising the switch at all.
    expect(episodeSpy.mock.results.length).toBeGreaterThan(1);
    expect(patientSpy.mock.results.length).toBeGreaterThan(1);
    expect(visitSpy.mock.results.length).toBeGreaterThan(1);

    const assertAllSameReference = (spy: jest.SpyInstance) => {
      const values = spy.mock.results.map((r) => r.value);
      const first = values[0];
      values.forEach((value) => expect(value).toBe(first));
    };

    assertAllSameReference(episodeSpy);
    assertAllSameReference(patientSpy);
    assertAllSameReference(visitSpy);
  });

  it('WorkspaceProvider memoizes its context value: an unrelated ancestor re-render with unchanged inputs does not create new context objects', () => {
    const episodeSpy = jest.spyOn(WorkspaceContextModule, 'useEpisodeContext');
    const patientSpy = jest.spyOn(WorkspaceContextModule, 'usePatientContext');
    const visitSpy = jest.spyOn(WorkspaceContextModule, 'useVisitContext');

    const { rerender } = renderScreen();

    // Forces the WHOLE tree — including WorkspaceProvider itself, unlike a
    // toggle press scoped to ConsultationWorkspaceScreen's own local state —
    // through a normal React update pass. With identical
    // tenantId/episodeId/appointmentId/clientId props and unchanged
    // useEpisodeWorkspaceData() output, WorkspaceProvider's useMemo must
    // still return the exact same value object; if the memo dependency
    // array were ever wrong (or removed), this is the assertion that would
    // catch it, since a toggle alone never reaches the provider's render.
    rerender(
      <ConsultationWorkspaceScreen episodeId="episode-1" appointmentId="appointment-1" clientId="client-1" />,
    );

    const values = (spy: jest.SpyInstance) => spy.mock.results.map((r) => r.value);
    expect(episodeSpy.mock.results.length).toBeGreaterThan(1);
    values(episodeSpy).forEach((v) => expect(v).toBe(values(episodeSpy)[0]));
    values(patientSpy).forEach((v) => expect(v).toBe(values(patientSpy)[0]));
    values(visitSpy).forEach((v) => expect(v).toBe(values(visitSpy)[0]));
  });
});
