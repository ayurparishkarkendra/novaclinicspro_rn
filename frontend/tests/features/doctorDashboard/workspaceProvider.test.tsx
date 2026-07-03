import React from 'react';
import { renderHook } from '@testing-library/react-native';
import {
  WorkspaceProvider,
  usePatientContext,
  useEpisodeContext,
  useVisitContext,
} from '../../../features/episodes/presentation/context/ClinicalWorkspaceContext';
import { useEpisodeWorkspaceData } from '../../../features/episodes/presentation/hooks/useEpisodeWorkspaceData';

// R3A · T-A.1 — WorkspaceProvider unit-tested in isolation: given the same
// route params useConsultationWorkspace.ts already receives, it must
// produce the same Patient/Episode/Visit data that hook derives today
// (design.md §9.B). No existing module is modified by this task — this test
// only proves the new context layer itself is correct in isolation.

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
    {
      appointment_id: 'appointment-other',
      appointment_date: '2026-06-01',
      appointment_time: '09:00:00',
      appointment_status: 'COMPLETED',
      staff_name: 'Dr. Rao',
      prescription: { exists: false, id: null, status: null, created_at: null },
      payment: { invoice_id: null, amount: null, status: null, paid_amount: null },
    },
  ],
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
  visits: episodeDetails.visits,
  clientId: 'client-1',
  clientName: 'Maya Rao',
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <WorkspaceProvider tenantId="tenant-1" episodeId="episode-1" appointmentId="appointment-1" clientId="client-1">
    {children}
  </WorkspaceProvider>
);

describe('WorkspaceProvider / Persistent Context (R3A · T-A.1)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useEpisodeWorkspaceData as jest.Mock).mockReturnValue(mockWorkspaceData);
  });

  it('calls the SAME shared useEpisodeWorkspaceData hook useConsultationWorkspace.ts already uses, with the exact same (tenantId, episodeId, clientId) arguments', () => {
    renderHook(() => usePatientContext(), { wrapper });
    expect(useEpisodeWorkspaceData).toHaveBeenCalledWith('tenant-1', 'episode-1', 'client-1');
  });

  it('usePatientContext exposes the resolved clientId/clientName from useEpisodeWorkspaceData, not the raw prop', () => {
    (useEpisodeWorkspaceData as jest.Mock).mockReturnValue({
      ...mockWorkspaceData,
      clientId: 'resolved-from-episode', // simulates episodeDetails.episode.client_id fallback
    });
    const { result } = renderHook(() => usePatientContext(), { wrapper });
    expect(result.current).toEqual({ clientId: 'resolved-from-episode', clientName: 'Maya Rao' });
  });

  it('useEpisodeContext exposes episodeId + episodeDetails + loading/error/refetch, matching today\'s workspace data', () => {
    const { result } = renderHook(() => useEpisodeContext(), { wrapper });
    expect(result.current.episodeId).toBe('episode-1');
    expect(result.current.episodeDetails).toBe(episodeDetails);
    expect(result.current.isEpisodeLoading).toBe(false);
    expect(result.current.isEpisodeError).toBe(false);
    expect(result.current.refetchEpisode).toBe(mockWorkspaceData.refetchEpisode);
  });

  it('useVisitContext mirrors the SAME appointment_id-keyed VisitInfo lookup ConsultationWorkspaceScreen.tsx performs today — read-only, no independent fetch (ADR-R3A-04)', () => {
    const { result } = renderHook(() => useVisitContext(), { wrapper });
    expect(result.current.appointmentId).toBe('appointment-1');
    expect(result.current.visit).toEqual(episodeDetails.visits[0]);
    // The OTHER visit in the episode is correctly not matched.
    expect(result.current.visit?.appointment_id).not.toBe('appointment-other');
  });

  it('useVisitContext.visit is undefined when no VisitInfo matches the appointmentId (e.g. Visit not yet activated)', () => {
    const noMatchWrapper = ({ children }: { children: React.ReactNode }) => (
      <WorkspaceProvider tenantId="tenant-1" episodeId="episode-1" appointmentId="appointment-unmatched" clientId="client-1">
        {children}
      </WorkspaceProvider>
    );
    const { result } = renderHook(() => useVisitContext(), { wrapper: noMatchWrapper });
    expect(result.current.visit).toBeUndefined();
  });

  it('each hook throws a clear error when used outside a WorkspaceProvider (CO-1: no silent fallback, unlike useClinicTheme)', () => {
    const { result: patientResult } = renderHook(() => {
      try {
        return usePatientContext();
      } catch (e) {
        return e;
      }
    });
    expect(patientResult.current).toEqual(new Error('usePatientContext must be used within a WorkspaceProvider'));

    const { result: episodeResult } = renderHook(() => {
      try {
        return useEpisodeContext();
      } catch (e) {
        return e;
      }
    });
    expect(episodeResult.current).toEqual(new Error('useEpisodeContext must be used within a WorkspaceProvider'));

    const { result: visitResult } = renderHook(() => {
      try {
        return useVisitContext();
      } catch (e) {
        return e;
      }
    });
    expect(visitResult.current).toEqual(new Error('useVisitContext must be used within a WorkspaceProvider'));
  });
});
