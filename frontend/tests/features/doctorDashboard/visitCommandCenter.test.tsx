/**
 * T-FE-A.1 — VisitCommandCenter shell tests.
 * T-FE-C.1 — extended with a QueryClientProvider wrapper + mocked
 * clinicalWorkspace datasource, since the shell now mounts
 * `WhyTodaySection` (which calls `useClinicalWorkspaceQuery`) once
 * workspace context resolves. WhyTodaySection's own behaviour (loading /
 * error / recorded / not_recorded / unavailable / inference rejection)
 * is NOT re-tested here — that is `whyTodaySection.test.tsx`'s own
 * scope; this file only proves the shell still composes correctly.
 *
 * Mirrors the established conventions: `workspaceProvider.test.tsx`'s
 * `useEpisodeWorkspaceData` mock (WorkspaceProvider itself is already
 * thoroughly tested there — not re-tested here), and
 * `consultationComponents.test.tsx`'s render-level screen test style.
 */
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { VisitCommandCenter } from '../../../features/episodes/presentation/pages/VisitCommandCenter';
import { useEpisodeWorkspaceData } from '../../../features/episodes/presentation/hooks/useEpisodeWorkspaceData';
import { getClinicalWorkspaceApi } from '../../../features/episodes/data/datasources/clinicalWorkspace.api';
import { WorkspaceFactsResponse } from '../../../features/episodes/data/models/clinicalWorkspace.dtos';

const router = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };

jest.mock('expo-router', () => ({ useRouter: jest.fn() }));
jest.mock('../../../features/auth/presentation/hooks/useAuth', () => ({
  useAuth: () => ({ currentUser: { tenantId: 'tenant-1' }, selectedClinicId: null }),
}));
jest.mock('../../../features/episodes/presentation/hooks/useEpisodeWorkspaceData', () => ({
  useEpisodeWorkspaceData: jest.fn(),
}));
jest.mock('../../../features/episodes/data/datasources/clinicalWorkspace.api', () => ({
  getClinicalWorkspaceApi: jest.fn(),
}));

const mockGetClinicalWorkspaceApi = getClinicalWorkspaceApi as jest.Mock;

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
  visits: [
    {
      appointment_id: 'appointment-1',
      appointment_date: '2026-07-03',
      appointment_time: '10:00:00',
      appointment_status: 'IN_PROGRESS',
      staff_name: 'Dr. Rao',
      prescription: { exists: false, id: null, status: null, created_at: null },
      payment: { invoice_id: null, amount: null, status: null, paid_amount: null },
    },
  ],
};

const workspaceData = {
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
  visits: episodeDetails.visits,
  clientId: 'client-1',
  clientName: 'Maya Rao',
};

const notRecordedSnapshot: WorkspaceFactsResponse = {
  identity: {
    tenant_id: 'tenant-1',
    client_id: 'client-1',
    episode_id: 'episode-1',
    appointment_id: 'appointment-1',
    visit_id: 'visit-1',
    requesting_tenant_user_id: 'user-1',
    context_valid: true,
  },
  purpose: { value: null, recording_state: 'not_recorded' },
  episode: { exists: true, episode_id: 'episode-1', status: 'ACTIVE', recording_state: 'recorded' },
  visit: { exists: true, visit_id: 'visit-1', outcome_type: null, outcome_notes: null, recording_state: 'recorded' },
  appointment: { exists: true, appointment_id: 'appointment-1', status: 'IN_PROGRESS', recording_state: 'recorded' },
  casesheet: {
    exists: false,
    casesheet_id: null,
    episode_id: null,
    document_status: null,
    signed: false,
    contribution_count: null,
    recording_state: 'absent',
  },
  prescription: { exists: false, prescription_id: null, document_status: null, recording_state: 'absent' },
  treatment: {
    exists: false,
    treatment_sheet_id: null,
    is_order: false,
    lifecycle_status: null,
    lifecycle_unresolved: false,
    recording_state: 'absent',
  },
  billing: {
    clinical_services_exist: null,
    invoice_exists: null,
    invoice_status: null,
    outstanding_state: 'not_applicable',
    recording_state: 'unavailable',
    invoice_count: null,
    invoice_ids: [],
    invoice_statuses: [],
    billed_amount: null,
    paid_amount: null,
    outstanding_amount: null,
    currency: null,
  },
  capability: { states: {}, recording_state: 'recorded' },
  permission: { granted_codes: [], recording_state: 'recorded' },
  what_changed: {
    previous_visit: { exists: false, visit_id: null, visit_date: null, outcome_notes: null, recording_state: 'absent' },
    sessions: { active_session_count: null, completed_session_count: null, recording_state: 'absent' },
    pending_review: { pending: null, recording_state: 'absent' },
  },
};

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
};

describe('VisitCommandCenter (T-FE-A.1)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(router);
    (useEpisodeWorkspaceData as jest.Mock).mockReturnValue(workspaceData);
    mockGetClinicalWorkspaceApi.mockResolvedValue(notRecordedSnapshot);
  });

  it('renders the shell header with the resolved patient name once context resolves', async () => {
    const { getByText } = renderWithProviders(
      <VisitCommandCenter episodeId="episode-1" appointmentId="appointment-1" clientId="client-1" />,
    );
    expect(getByText('Visit Command Center')).toBeTruthy();
    expect(getByText('Maya Rao')).toBeTruthy();
    expect(useEpisodeWorkspaceData).toHaveBeenCalledWith('tenant-1', 'episode-1', 'client-1');
    await waitFor(() => expect(mockGetClinicalWorkspaceApi).toHaveBeenCalled());
  });

  it('shows a loading state while the episode is loading, before any context is used', () => {
    (useEpisodeWorkspaceData as jest.Mock).mockReturnValue({ ...workspaceData, isEpisodeLoading: true });
    const { queryByText } = renderWithProviders(
      <VisitCommandCenter episodeId="episode-1" appointmentId="appointment-1" clientId="client-1" />,
    );
    expect(queryByText('Visit Command Center')).toBeNull();
    expect(mockGetClinicalWorkspaceApi).not.toHaveBeenCalled();
  });

  it('shows the invalid-context state (W30) when appointmentId is missing — never guesses a Visit', () => {
    const { getByText, queryByText } = renderWithProviders(
      <VisitCommandCenter episodeId="episode-1" appointmentId={undefined} clientId="client-1" />,
    );
    expect(getByText("Can't open workspace")).toBeTruthy();
    expect(getByText('No active appointment for this episode.')).toBeTruthy();
    expect(queryByText('Visit Command Center')).toBeNull();
    // WorkspaceProvider must never even be entered without a real appointmentId.
    expect(useEpisodeWorkspaceData).not.toHaveBeenCalled();
    expect(mockGetClinicalWorkspaceApi).not.toHaveBeenCalled();
  });

  it('shows the invalid-context state when the appointment-scoped Visit lookup returns undefined', () => {
    const { getByText } = renderWithProviders(
      <VisitCommandCenter episodeId="episode-1" appointmentId="appointment-unmatched" clientId="client-1" />,
    );
    expect(getByText("Can't open workspace")).toBeTruthy();
  });

  it('shows the invalid-context state when the episode fails to load', () => {
    (useEpisodeWorkspaceData as jest.Mock).mockReturnValue({ ...workspaceData, isEpisodeError: true, episodeDetails: undefined });
    const { getByText } = renderWithProviders(
      <VisitCommandCenter episodeId="episode-1" appointmentId="appointment-1" clientId="client-1" />,
    );
    expect(getByText("Can't open workspace")).toBeTruthy();
  });

  it('back navigation uses plain router.back(), matching the existing convention', () => {
    const { getByText } = renderWithProviders(
      <VisitCommandCenter episodeId="episode-1" appointmentId={undefined} clientId="client-1" />,
    );
    fireEvent.press(getByText('Back'));
    expect(router.back).toHaveBeenCalled();
  });

  it('renders the Why Today, What Changed, and Before You Act regions plus a neutral placeholder for the remaining not-yet-built regions — no fabricated recommendation/warning/completion content', async () => {
    const { queryByText, getByText, findByText } = renderWithProviders(
      <VisitCommandCenter episodeId="episode-1" appointmentId="appointment-1" clientId="client-1" />,
    );
    await findByText('Why today');
    await findByText('What changed');
    await findByText('Before you act');
    expect(getByText('Coming Soon')).toBeTruthy();
    expect(queryByText(/recommend/i)).toBeNull();
    expect(queryByText(/warning/i)).toBeNull();
    expect(queryByText(/ready to complete/i)).toBeNull();
  });
});
