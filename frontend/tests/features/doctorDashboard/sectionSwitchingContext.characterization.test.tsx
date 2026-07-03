import '../doctorDashboard/setup';
import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConsultationWorkspaceScreen } from '../../../features/episodes/presentation/pages/ConsultationWorkspaceScreen';
import { WorkspaceProvider } from '../../../features/episodes/presentation/context/ClinicalWorkspaceContext';
import { WorkspaceSaveStatusProvider } from '../../../features/episodes/presentation/context/WorkspaceSaveStatusContext';
import { useEpisodeWorkspaceData } from '../../../features/episodes/presentation/hooks/useEpisodeWorkspaceData';
import { createCasesheetApi, updateCasesheetApi } from '../../../features/casesheets/data/datasources/casesheets.api';
import { createPrescriptionApi, updatePrescriptionApi } from '../../../features/prescriptions/data/datasources/prescriptions.api';
import {
  createSimpleTreatmentSheetApi,
  updateAllTreatmentSheetRowsApi,
} from '../../../features/treatmentSheets/data/datasources/treatmentSheets.api';
import { sendToSchedulingApi, createTreatmentRecommendationApi } from '../../../features/treatmentSheets/data/datasources/treatmentOrders.api';
import { axiosClient } from '../../../core/api/axiosClient';

// R3A · T-0.2 — Characterization of TODAY'S section-switching behavior, before
// any Persistent-Context work begins. This is the direct oracle for FR-E2
// ("switching modules SHALL NOT re-trigger entry resolution / lose draft
// state") and for requirements.md AC-1. No existing Phase 1 test file covers
// this (confirmed by grep across tests/features/doctorDashboard/ during this
// task's audit) — entry resolution, freshness-flag branches, and
// unmount-flush are already characterized elsewhere (caseResolver.test.ts,
// startBehavior.characterization.test.ts, freshnessFeatureFlag.test.tsx,
// consultationSaveInvalidation.test.tsx, consultationSaveFreshness
// .characterization.test.tsx, freshnessNoDuplicateFetch.test.tsx,
// consultationSaveConfirmationAndTransition.test.tsx) and are NOT
// re-characterized here to avoid duplicating already-passing coverage.

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
// R3A · T-B.1: ConsultationWorkspaceScreen now hosts CaseSheetModule, which
// reads Persistent Context (T-A.1) — the screen itself is only ever rendered
// inside ClinicalWorkspace's WorkspaceProvider in production (T-A.2), so this
// characterization wrapper must provide one too, matching that reality.
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <WorkspaceProvider tenantId="tenant-1" episodeId="episode-1" appointmentId="appointment-1" clientId="client-1">
      <WorkspaceSaveStatusProvider>{children}</WorkspaceSaveStatusProvider>
    </WorkspaceProvider>
  </QueryClientProvider>
);

const renderScreen = () =>
  render(
    <ConsultationWorkspaceScreen episodeId="episode-1" appointmentId="appointment-1" clientId="client-1" />,
    { wrapper },
  );

describe('Section-switching preserves workspace state (R3A · T-0.2, baseline for FR-E2/AC-1)', () => {
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
    (axiosClient.get as jest.Mock).mockResolvedValue({ data: { items: [] } });
    (axiosClient.post as jest.Mock).mockResolvedValue({ data: { id: 'new-sheet', rows: [], version: 1 } });
    (sendToSchedulingApi as jest.Mock).mockResolvedValue({ id: 'sheet-1', state: 'ORDERED', is_order: true, version: 1 });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('BASELINE: only Chief Complaint starts expanded; every other section starts collapsed', () => {
    const { getByText, queryByDisplayValue } = renderScreen();
    // Chief Complaint's TextInput is rendered (expanded by default).
    expect(queryByDisplayValue('')).toBeTruthy();
    // Every other section renders as a collapsed, tappable summary row.
    expect(getByText('Clinical Notes')).toBeTruthy();
    expect(getByText('Prescription')).toBeTruthy();
    expect(getByText('Treatment Recommendation')).toBeTruthy();
  });

  it('BASELINE: expanding a second section preserves an in-progress, unsaved draft in the first', async () => {
    const { getByText, getByDisplayValue } = renderScreen();

    fireEvent.changeText(getByDisplayValue(''), 'Knee pain for 3 weeks');
    expect(getByDisplayValue('Knee pain for 3 weeks')).toBeTruthy();

    // Switch: expand "Clinical Notes" (today's only switching mechanism —
    // there is no UI affordance to re-collapse an expanded section, since
    // renderSection() only renders CollapsedSection when NOT expanded).
    fireEvent.press(getByText('Clinical Notes'));

    // The Chief Complaint draft, entered before the switch, is untouched —
    // switching sections does not reset or refetch the workspace hook's
    // local state. This is the exact guarantee FR-E2/CO-1..CO-4 depend on
    // once Persistent Context replaces this ad hoc local state.
    expect(getByDisplayValue('Knee pain for 3 weeks')).toBeTruthy();
  });

  it('BASELINE: expanding another section does not trigger any additional API call by itself', async () => {
    const { getByText } = renderScreen();

    fireEvent.press(getByText('Clinical Notes'));
    fireEvent.press(getByText('Prescription'));

    // Section-switching is pure local UI state (expandedSections) — it must
    // not, by itself, cause a save, a re-fetch, or a create call. (Autosave
    // is exercised in useConsultationWorkspace.test.tsx / consultationSave*
    // suites; this test isolates the switching action alone.)
    expect(createCasesheetApi).not.toHaveBeenCalled();
    expect(updateCasesheetApi).not.toHaveBeenCalled();
    expect(createPrescriptionApi).not.toHaveBeenCalled();
    expect(mockWorkspaceData.refetchEpisode).not.toHaveBeenCalled();
  });

  it('BASELINE: switching sections re-invokes useEpisodeWorkspaceData with the SAME tenant/episode/client identifiers every time', () => {
    const { getByText } = renderScreen();
    const callsBefore = (useEpisodeWorkspaceData as jest.Mock).mock.calls.length;

    fireEvent.press(getByText('Treatment Recommendation'));

    // useEpisodeWorkspaceData(tenantId, episodeId, clientId) — every call
    // triggered by a section-switch re-render resolves the identical
    // identifiers; switching sections never changes which Patient/Episode
    // context the screen is resolving (today's ad hoc equivalent of
    // Persistent Context's FR-E2 guarantee).
    const callsAfter = (useEpisodeWorkspaceData as jest.Mock).mock.calls.slice(callsBefore);
    expect(callsAfter.length).toBeGreaterThan(0);
    callsAfter.forEach(([tenantId, episodeId, clientId]) => {
      expect(tenantId).toBe('tenant-1');
      expect(episodeId).toBe('episode-1');
      expect(clientId).toBe('client-1');
    });
  });
});
