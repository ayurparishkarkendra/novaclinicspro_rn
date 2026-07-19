/**
 * T-FE-A.1 — VisitCommandCenter shell tests.
 *
 * Mirrors the established conventions: `workspaceProvider.test.tsx`'s
 * `useEpisodeWorkspaceData` mock (WorkspaceProvider itself is already
 * thoroughly tested there — not re-tested here), and
 * `consultationComponents.test.tsx`'s render-level screen test style.
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import { VisitCommandCenter } from '../../../features/episodes/presentation/pages/VisitCommandCenter';
import { useEpisodeWorkspaceData } from '../../../features/episodes/presentation/hooks/useEpisodeWorkspaceData';

const router = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };

jest.mock('expo-router', () => ({ useRouter: jest.fn() }));
jest.mock('../../../features/auth/presentation/hooks/useAuth', () => ({
  useAuth: () => ({ currentUser: { tenantId: 'tenant-1' }, selectedClinicId: null }),
}));
jest.mock('../../../features/episodes/presentation/hooks/useEpisodeWorkspaceData', () => ({
  useEpisodeWorkspaceData: jest.fn(),
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

describe('VisitCommandCenter (T-FE-A.1)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(router);
    (useEpisodeWorkspaceData as jest.Mock).mockReturnValue(workspaceData);
  });

  it('renders the shell header with the resolved patient name once context resolves', () => {
    const { getByText } = render(
      <VisitCommandCenter episodeId="episode-1" appointmentId="appointment-1" clientId="client-1" />,
    );
    expect(getByText('Visit Command Center')).toBeTruthy();
    expect(getByText('Maya Rao')).toBeTruthy();
    expect(useEpisodeWorkspaceData).toHaveBeenCalledWith('tenant-1', 'episode-1', 'client-1');
  });

  it('shows a loading state while the episode is loading, before any context is used', () => {
    (useEpisodeWorkspaceData as jest.Mock).mockReturnValue({ ...workspaceData, isEpisodeLoading: true });
    const { queryByText } = render(
      <VisitCommandCenter episodeId="episode-1" appointmentId="appointment-1" clientId="client-1" />,
    );
    expect(queryByText('Visit Command Center')).toBeNull();
  });

  it('shows the invalid-context state (W30) when appointmentId is missing — never guesses a Visit', () => {
    const { getByText, queryByText } = render(
      <VisitCommandCenter episodeId="episode-1" appointmentId={undefined} clientId="client-1" />,
    );
    expect(getByText("Can't open workspace")).toBeTruthy();
    expect(getByText('No active appointment for this episode.')).toBeTruthy();
    expect(queryByText('Visit Command Center')).toBeNull();
    // WorkspaceProvider must never even be entered without a real appointmentId.
    expect(useEpisodeWorkspaceData).not.toHaveBeenCalled();
  });

  it('shows the invalid-context state when the appointment-scoped Visit lookup returns undefined', () => {
    const { getByText } = render(
      <VisitCommandCenter episodeId="episode-1" appointmentId="appointment-unmatched" clientId="client-1" />,
    );
    expect(getByText("Can't open workspace")).toBeTruthy();
  });

  it('shows the invalid-context state when the episode fails to load', () => {
    (useEpisodeWorkspaceData as jest.Mock).mockReturnValue({ ...workspaceData, isEpisodeError: true, episodeDetails: undefined });
    const { getByText } = render(
      <VisitCommandCenter episodeId="episode-1" appointmentId="appointment-1" clientId="client-1" />,
    );
    expect(getByText("Can't open workspace")).toBeTruthy();
  });

  it('back navigation uses plain router.back(), matching the existing convention', () => {
    const { getByText } = render(
      <VisitCommandCenter episodeId="episode-1" appointmentId={undefined} clientId="client-1" />,
    );
    fireEvent.press(getByText('Back'));
    expect(router.back).toHaveBeenCalled();
  });

  it('renders no clinical content beyond the header — no fabricated facts, only a neutral placeholder', () => {
    const { queryByText, getByText } = render(
      <VisitCommandCenter episodeId="episode-1" appointmentId="appointment-1" clientId="client-1" />,
    );
    expect(getByText('Coming Soon')).toBeTruthy();
    expect(queryByText(/recommend/i)).toBeNull();
    expect(queryByText(/warning/i)).toBeNull();
    expect(queryByText(/ready to complete/i)).toBeNull();
  });
});
