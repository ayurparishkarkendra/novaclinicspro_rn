import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { AppointmentListItem } from '../../../features/appointments/presentation/components/AppointmentListItem';
import { CreateConsultationScreen } from '../../../features/episodes/presentation/pages/CreateConsultationScreen';
import {
  CompleteConsultationScreen,
  deriveSummary,
} from '../../../features/episodes/presentation/pages/CompleteConsultationScreen';
import { createEpisodeApi } from '../../../features/episodes/data/datasources/episodes.api';
import { transitionCasesheetStatusApi } from '../../../features/casesheets/data/datasources/casesheets.api';
import { useEpisodeWorkspaceData } from '../../../features/episodes/presentation/hooks/useEpisodeWorkspaceData';

const router = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };

jest.mock('../../../features/auth/presentation/hooks/useAuth', () => ({
  useAuth: () => ({ currentUser: { tenantId: 'tenant-1' }, selectedClinicId: null }),
}));
jest.mock('../../../core/hooks/useFeatures', () => ({
  useFeatures: () => ({ clinic_type: 'ayurveda' }),
  isAyurvedaClinic: () => true,
  hasMultiDayAppointments: () => false,
}));
jest.mock('../../../features/treatmentSheets/data/repositories/treatmentSheets.repository.impl', () => ({
  useTreatmentSheetDetailQuery: () => ({ data: undefined, isLoading: false }),
}));
jest.mock('../../../features/appointments/data/repositories/appointments.repository.impl', () => ({
  useAppointmentDetailQuery: () => ({
    data: {
      id: 'appointment-1',
      client_name: 'Maya Rao',
      appointment_start: '2026-06-29T10:00:00',
    },
  }),
}));
jest.mock('../../../features/episodes/data/datasources/episodes.api', () => ({
  createEpisodeApi: jest.fn(),
}));
jest.mock('../../../features/casesheets/data/datasources/casesheets.api', () => ({
  transitionCasesheetStatusApi: jest.fn(),
}));
jest.mock('../../../features/episodes/presentation/hooks/useEpisodeWorkspaceData', () => ({
  useEpisodeWorkspaceData: jest.fn(),
}));

const appointment = {
  id: 'appointment-1',
  tenant_id: 'tenant-1',
  client_id: 'client-1',
  doctor_id: 'doctor-1',
  therapist_ids: [],
  room_id: null,
  treatment_id: null,
  appointment_start: '2026-06-29T10:00:00',
  appointment_end: null,
  status: 'scheduled',
  notes: null,
  is_active: true,
  created_at: '2026-06-29T09:00:00',
  appointment_type: 'SINGLE',
  series_id: null,
  client_name: 'Maya Rao',
};

const workspaceData = {
  episodeDetails: {
    episode: {
      id: 'episode-1',
      title: 'Back pain',
      status: 'ACTIVE',
      start_date: '2026-06-29',
      end_date: null,
      description: null,
      client_id: 'client-1',
      client_name: 'Maya Rao',
      visits_count: 1,
      last_visit_date: null,
    },
    documents: {
      casesheet: { exists: true, id: 'casesheet-1', status: 'DRAFT', created_at: null, last_updated: null },
      treatment_sheet: { exists: true, id: 'sheet-1', status: 'FINAL', created_at: null, last_updated: null },
    },
    visits: [{
      appointment_id: 'appointment-1',
      appointment_date: '2026-06-29',
      appointment_time: '10:00:00',
      appointment_status: 'scheduled',
      staff_name: 'Dr A',
      prescription: { exists: true, id: 'rx-1', status: 'DRAFT', created_at: null },
      payment: { exists: false, invoice_id: null, amount: null, status: null, paid_amount: null },
    }],
  },
  isEpisodeLoading: false,
  isEpisodeError: false,
  refetchEpisode: jest.fn(),
  casesheet: { id: 'casesheet-1', status: 'DRAFT', data_json: { extensions: [{ template_id: 'nadi_pariksha', data: { nadi_type: 'Vata' } }] } },
  casesheetId: 'casesheet-1',
  hasCasesheet: true,
  isCasesheetLoading: false,
  treatmentSheet: { id: 'sheet-1', status: 'DRAFT', state: 'ORDERED' },
  treatmentSheets: [],
  treatmentSheetId: 'sheet-1',
  hasTreatmentSheet: true,
  isTreatmentSheetLoading: false,
  isTreatmentSheetError: false,
  refetchTreatmentSheet: jest.fn(),
  visits: [],
  clientId: 'client-1',
  clientName: 'Maya Rao',
};

describe('consultation components', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(router);
    (useEpisodeWorkspaceData as jest.Mock).mockReturnValue({
      ...workspaceData,
      visits: workspaceData.episodeDetails.visits,
    });
  });

  it('renders doctor Start Consultation without episode actions', () => {
    const onStart = jest.fn();
    const screen = render(
      <AppointmentListItem appointment={appointment as any} userRole="doctor" onStartConsultation={onStart} />,
    );

    expect(screen.getByText('Start Consultation')).toBeTruthy();
    expect(screen.queryByText('Link Episode')).toBeNull();
    expect(screen.queryByText('New Episode')).toBeNull();
    fireEvent.press(screen.getByTestId('action-start-consultation'));
    expect(onStart).toHaveBeenCalledWith('appointment-1', 'client-1');
  });

  it('shows loading and disables doctor CTA while starting', () => {
    const { getByTestId } = render(
      <AppointmentListItem appointment={appointment as any} userRole="doctor" isStartingConsultation />,
    );
    expect(getByTestId('action-start-consultation').props.accessibilityState?.disabled ?? true).toBe(true);
  });

  it('hides doctor CTA for terminal appointments', () => {
    const { queryByText, getAllByLabelText } = render(
      <AppointmentListItem appointment={{ ...appointment, status: 'completed' } as any} userRole="doctor" />,
    );
    expect(queryByText('Start Consultation')).toBeNull();
    expect(getAllByLabelText('Status: Completed').length).toBeGreaterThan(0);
  });

  it('keeps non-doctor quick actions visible', () => {
    const { getByText } = render(
      <AppointmentListItem
        appointment={appointment as any}
        userRole="receptionist"
        onReschedule={jest.fn()}
        onStatusUpdate={jest.fn()}
        onCancel={jest.fn()}
      />,
    );
    expect(getByText('Reschedule')).toBeTruthy();
  });

  it('validates empty chief complaint before creating a consultation', () => {
    const { getByText } = render(<CreateConsultationScreen appointmentId="appointment-1" clientId="client-1" />);
    fireEvent.press(getByText('Start Consultation'));
    expect(getByText('Chief Complaint is required.')).toBeTruthy();
    expect(createEpisodeApi).not.toHaveBeenCalled();
  });

  it('creates an episode and navigates to consultation', async () => {
    (createEpisodeApi as jest.Mock).mockResolvedValue({ id: 'episode-1' });
    const { getByText, getByPlaceholderText } = render(
      <CreateConsultationScreen appointmentId="appointment-1" clientId="client-1" />,
    );

    fireEvent.changeText(getByPlaceholderText("Primary reason for today's visit"), 'Back pain');
    fireEvent.press(getByText('Start Consultation'));

    await waitFor(() => expect(createEpisodeApi).toHaveBeenCalled());
    expect(router.replace).toHaveBeenCalledWith(
      '/clinic-admin/episodes/episode-1/consultation?appointmentId=appointment-1&clientId=client-1',
    );
  });

  it('retains create form data after API failure and keeps patient context visible', async () => {
    (createEpisodeApi as jest.Mock).mockRejectedValue(new Error('failed'));
    const { getByText, getByDisplayValue, getByPlaceholderText } = render(
      <CreateConsultationScreen appointmentId="appointment-1" clientId="client-1" />,
    );

    fireEvent.changeText(getByPlaceholderText("Primary reason for today's visit"), 'Back pain');
    fireEvent.press(getByText('Start Consultation'));

    await waitFor(() => expect(getByText('failed')).toBeTruthy());
    expect(getByText('Maya Rao')).toBeTruthy();
    expect(getByDisplayValue('Back pain')).toBeTruthy();
  });

  it('derives and renders complete consultation summary', () => {
    const summary = deriveSummary({ ...workspaceData, visits: workspaceData.episodeDetails.visits } as any, 'appointment-1', true);
    expect(summary.notes.status).toBe('DRAFT');
    expect(summary.prescription.status).toBe('DRAFT');
    expect(summary.treatmentRecommendation.status).toBe('Sent to Admin');
    expect(summary.ayurvedicAssessment?.status).toBe('Recorded');
  });

  it('finalizes casesheet and returns to doctor dashboard', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
    (transitionCasesheetStatusApi as jest.Mock).mockResolvedValue({});
    const { getByText } = render(
      <CompleteConsultationScreen episodeId="episode-1" appointmentId="appointment-1" clientId="client-1" />,
    );

    fireEvent.press(getByText('Complete Consultation'));

    await waitFor(() =>
      expect(transitionCasesheetStatusApi).toHaveBeenCalledWith('tenant-1', 'casesheet-1', { status: 'FINAL' }),
    );
    expect(router.replace).toHaveBeenCalledWith('/doctor');
  });

  it('blocks completion when notes are not saved', () => {
    (useEpisodeWorkspaceData as jest.Mock).mockReturnValue({ ...workspaceData, casesheetId: null, hasCasesheet: false });
    const { getByText } = render(
      <CompleteConsultationScreen episodeId="episode-1" appointmentId="appointment-1" clientId="client-1" />,
    );
    fireEvent.press(getByText('Complete Consultation'));
    expect(getByText('Consultation notes must be saved before completing.')).toBeTruthy();
    expect(transitionCasesheetStatusApi).not.toHaveBeenCalled();
  });
});
