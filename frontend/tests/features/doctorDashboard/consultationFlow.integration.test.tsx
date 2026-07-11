import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { resolveCase } from '../../../features/doctorDashboard/application/caseResolver';
import { ConsultationWorkspaceScreen } from '../../../features/episodes/presentation/pages/ConsultationWorkspaceScreen';
import { CreateConsultationScreen } from '../../../features/episodes/presentation/pages/CreateConsultationScreen';
import { CompleteConsultationScreen } from '../../../features/episodes/presentation/pages/CompleteConsultationScreen';
import { EpisodeWorkspaceScreen } from '../../../features/episodes/presentation/pages/EpisodeWorkspaceScreen';
import { axiosClient } from '../../../core/api/axiosClient';
import { createEpisodeApi } from '../../../features/episodes/data/datasources/episodes.api';
import { transitionCasesheetStatusApi } from '../../../features/casesheets/data/datasources/casesheets.api';
import { useConsultationWorkspace } from '../../../features/episodes/presentation/hooks/useConsultationWorkspace';
import { useEpisodeWorkspaceData } from '../../../features/episodes/presentation/hooks/useEpisodeWorkspaceData';

const router = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };
const flushPendingAutosave = jest.fn().mockResolvedValue(undefined);

jest.mock('../../../core/api/axiosClient', () => ({
  axiosClient: { get: jest.fn(), post: jest.fn() },
}));
jest.mock('../../../features/auth/presentation/hooks/useAuth', () => ({
  useAuth: () => ({ currentUser: { tenantId: 'tenant-1' }, selectedClinicId: null }),
}));
jest.mock('../../../core/hooks/useFeatures', () => ({
  useFeatures: () => ({ clinic_type: 'ayurveda' }),
  isAyurvedaClinic: () => true,
}));
jest.mock('../../../features/episodes/data/datasources/episodes.api', () => ({
  createEpisodeApi: jest.fn(),
}));
jest.mock('../../../features/casesheets/data/datasources/casesheets.api', () => ({
  transitionCasesheetStatusApi: jest.fn(),
}));
jest.mock('../../../features/appointments/data/repositories/appointments.repository.impl', () => ({
  useAppointmentDetailQuery: () => ({
    data: { id: 'appointment-1', client_name: 'Maya Rao', appointment_start: '2026-06-29T10:00:00' },
  }),
}));
jest.mock('../../../features/episodes/presentation/hooks/useConsultationWorkspace', () => ({
  useConsultationWorkspace: jest.fn(),
}));
jest.mock('../../../features/episodes/presentation/hooks/useEpisodeWorkspaceData', () => ({
  useEpisodeWorkspaceData: jest.fn(),
}));
jest.mock('../../../features/episodes/presentation/components/CasesheetTab', () => ({
  CasesheetTab: () => null,
}));
jest.mock('../../../features/episodes/presentation/components/TreatmentPlansTab', () => ({
  TreatmentPlansTab: () => null,
}));
jest.mock('../../../features/episodes/presentation/components/VisitsTab', () => ({
  VisitsTab: () => null,
}));

const episodeDetails = {
  episode: {
    id: 'episode-1',
    title: 'Back pain',
    status: 'ACTIVE',
    start_date: '2026-06-29',
    end_date: null,
    description: null,
    client_id: 'client-1',
    client_name: 'Maya Rao',
    visits_count: 2,
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
};

const workspaceData = {
  episodeDetails,
  isEpisodeLoading: false,
  isEpisodeError: false,
  refetchEpisode: jest.fn(),
  casesheet: { id: 'casesheet-1', status: 'DRAFT', data_json: { extensions: [] } },
  casesheetId: 'casesheet-1',
  hasCasesheet: true,
  isCasesheetLoading: false,
  treatmentSheet: { id: 'sheet-1', status: 'FINAL' },
  treatmentSheets: [],
  treatmentSheetId: 'sheet-1',
  hasTreatmentSheet: true,
  isTreatmentSheetLoading: false,
  isTreatmentSheetError: false,
  refetchTreatmentSheet: jest.fn(),
  visits: episodeDetails.visits,
  clientId: 'client-1',
  clientName: 'Maya Rao',
};

const consultationState = {
  ...workspaceData,
  casesheetData: { basic: {}, extensions: [] },
  isCasesheetSaving: false,
  casesheetSaveError: null,
  updateCasesheetField: jest.fn(),
  updateExtensionField: jest.fn(),
  prescriptionId: 'rx-1',
  prescriptionData: { medications: [] },
  isPrescriptionSaving: false,
  prescriptionSaveError: null,
  prescriptionNotRequired: false,
  savePrescription: jest.fn(),
  markPrescriptionNotRequired: jest.fn(),
  onChange: jest.fn(),
  treatmentRecommendation: {
    recommendedTherapy: '',
    frequency: 'daily',
    durationDays: 7,
    startPreference: 'asap',
    notesForAdmin: '',
  },
  isTreatmentSaving: false,
  treatmentSaveError: null,
  updateTreatmentField: jest.fn(),
  sendTreatmentToAdmin: jest.fn(),
  sectionConfig: {
    activeSections: ['chiefComplaint', 'clinicalNotes', 'ayurvedicAssessment', 'prescription', 'treatmentRecommendation'],
    specialtySections: new Set(['ayurvedicAssessment']),
  },
  sectionProgress: {
    chiefComplaint: { status: 'empty', saveStatus: 'idle' },
    clinicalNotes: { status: 'empty', saveStatus: 'idle' },
    ayurvedicAssessment: { status: 'empty', saveStatus: 'idle' },
    prescription: { status: 'complete', saveStatus: 'idle' },
    treatmentRecommendation: { status: 'empty', saveStatus: 'idle' },
  },
  flushPendingAutosave,
};

describe('doctor consultation flow integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(router);
    (useConsultationWorkspace as jest.Mock).mockReturnValue(consultationState);
    (useEpisodeWorkspaceData as jest.Mock).mockReturnValue(workspaceData);
  });

  it('active case flow attaches, opens workspace, flushes, reviews, and completes', async () => {
    (axiosClient.get as jest.Mock).mockResolvedValue({ data: { total: 1, items: [{ id: 'episode-1' }] } });
    (axiosClient.post as jest.Mock).mockResolvedValue({});
    await resolveCase('tenant-1', 'appointment-1', 'client-1', router);
    expect(axiosClient.post).toHaveBeenCalledWith('/api/v1/clinic/tenant-1/appointments/appointment-1/attach-episode', {
      episode_id: 'episode-1',
    });

    const workspace = render(
      <ConsultationWorkspaceScreen episodeId="episode-1" appointmentId="appointment-1" clientId="client-1" />,
    );
    expect(workspace.getByText('Active case: Back pain · 2 visits')).toBeTruthy();
    fireEvent.press(workspace.getByText('Save & Submit'));
    await waitFor(() => expect(flushPendingAutosave).toHaveBeenCalled());
    expect(router.push).toHaveBeenCalledWith(
      '/clinic-admin/episodes/episode-1/complete-consultation?appointmentId=appointment-1&clientId=client-1',
    );

    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
    (transitionCasesheetStatusApi as jest.Mock).mockResolvedValue({});
    const complete = render(
      <CompleteConsultationScreen episodeId="episode-1" appointmentId="appointment-1" clientId="client-1" />,
    );
    fireEvent.press(complete.getByText('Complete Consultation'));
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/doctor'));
  });

  it('no active case flow opens create screen and creates episode', async () => {
    (axiosClient.get as jest.Mock).mockResolvedValue({ data: { total: 0, items: [] } });
    await resolveCase('tenant-1', 'appointment-1', 'client-1', router);
    expect(router.push).toHaveBeenCalledWith(
      '/clinic-admin/appointments/appointment-1/start-consultation?clientId=client-1',
    );

    (createEpisodeApi as jest.Mock).mockResolvedValue({ id: 'episode-2' });
    const create = render(<CreateConsultationScreen appointmentId="appointment-1" clientId="client-1" />);
    fireEvent.changeText(create.getByPlaceholderText("Primary reason for today's visit"), 'Headache');
    fireEvent.press(create.getByText('Start Consultation'));
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith(
      '/clinic-admin/episodes/episode-2/consultation?appointmentId=appointment-1&clientId=client-1',
    ));
  });

  it('admin workspace still mounts with all tabs available when casesheet exists', () => {
    const screen = render(
      <EpisodeWorkspaceScreen mode="admin" episodeId="episode-1" clientId="client-1" initialTab="prescriptions" />,
    );
    expect(screen.getByText('episodeWorkspace.tabs.prescriptions')).toBeTruthy();
    expect(screen.getByText('episodeWorkspace.tabs.visitNotes')).toBeTruthy();
    expect(screen.getByText('episodeWorkspace.tabs.treatmentPlans')).toBeTruthy();
  });
});
