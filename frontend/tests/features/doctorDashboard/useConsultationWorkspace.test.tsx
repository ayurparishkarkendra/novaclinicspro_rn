import { act, renderHook, waitFor } from '@testing-library/react-native';
import {
  buildSectionConfig,
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

let mockFeatures = { clinic_type: 'ayurveda' };

jest.mock('../../../core/hooks/useFeatures', () => ({
  useFeatures: () => mockFeatures,
  isAyurvedaClinic: (value: any) => value.clinic_type === 'ayurveda',
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

const mockWorkspaceData = {
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

const renderWorkspace = () =>
  renderHook(() =>
    useConsultationWorkspace({
      tenantId: 'tenant-1',
      episodeId: 'episode-1',
      appointmentId: 'appointment-1',
      clientId: 'client-1',
    }),
  );

describe('useConsultationWorkspace', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockFeatures = { clinic_type: 'ayurveda' };
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

  it('debounces autosave and creates then patches a casesheet', async () => {
    const { result } = renderWorkspace();

    act(() => {
      result.current.updateCasesheetField('chief_complaint', 'Pain');
      result.current.updateCasesheetField('chief_complaint', 'Knee pain');
    });
    expect(createCasesheetApi).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
    });
    expect(createCasesheetApi).toHaveBeenCalledTimes(1);
    expect(createCasesheetApi).toHaveBeenCalledWith('tenant-1', 'client-1', expect.objectContaining({
      appointment_id: 'appointment-1',
      episode_id: 'episode-1',
    }));

    act(() => result.current.updateCasesheetField('plan', 'Rest'));
    await act(async () => {
      await result.current.flushPendingAutosave();
    });
    expect(updateCasesheetApi).toHaveBeenCalledWith(
      'tenant-1',
      'casesheet-1',
      expect.objectContaining({ data_json: expect.any(Object) }),
    );
  });

  it('flushPendingAutosave resolves immediately when no save is pending', async () => {
    const { result } = renderWorkspace();
    await expect(result.current.flushPendingAutosave()).resolves.toBeUndefined();
    expect(createCasesheetApi).not.toHaveBeenCalled();
  });

  it('flushPendingAutosave rejects on save failure and retains draft', async () => {
    (createCasesheetApi as jest.Mock).mockRejectedValue(new Error('save failed'));
    const { result } = renderWorkspace();

    act(() => result.current.updateCasesheetField('chief_complaint', 'Pain'));
    await expect(result.current.flushPendingAutosave()).rejects.toThrow('save failed');
    expect(result.current.casesheetData.basic.chief_complaint).toBe('Pain');
  });

  it('fires pending autosave on unmount', () => {
    const { result, unmount } = renderWorkspace();
    act(() => result.current.updateCasesheetField('chief_complaint', 'Pain'));
    unmount();
    expect(createCasesheetApi).toHaveBeenCalledTimes(1);
  });

  it('loads and saves prescriptions with POST then PATCH', async () => {
    (axiosClient.get as jest.Mock).mockResolvedValue({
      data: { items: [{ id: 'rx-existing', prescription_data: { medications: [{ name: 'A', dosage: '1', frequency: 'daily', duration: '7d' }] } }] },
    });
    const { result } = renderWorkspace();
    await waitFor(() => expect(result.current.prescriptionId).toBe('rx-existing'));

    act(() => result.current.onChange({ medications: [{ name: 'B', dosage: '1', frequency: 'daily', duration: '7d' }] }));
    await act(async () => result.current.savePrescription());
    expect(updatePrescriptionApi).toHaveBeenCalledWith('tenant-1', 'rx-existing', expect.any(Object));
  });

  it('creates prescription and preserves draft after save failure', async () => {
    (createPrescriptionApi as jest.Mock).mockRejectedValue(new Error('rx failed'));
    const { result } = renderWorkspace();
    const draft = { medications: [{ name: 'A', dosage: '1', frequency: 'daily', duration: '7d' }] };

    act(() => result.current.onChange(draft));
    await expect(result.current.savePrescription()).rejects.toThrow('rx failed');
    expect(result.current.prescriptionData).toEqual(draft);
  });

  it('computes progress and autosave status boundaries', async () => {
    const { result } = renderWorkspace();
    expect(result.current.sectionProgress.chiefComplaint?.status).toBe('empty');
    act(() => result.current.updateCasesheetField('subjective', 'S'));
    expect(result.current.sectionProgress.clinicalNotes?.status).toBe('in_progress');
    await act(async () => result.current.flushPendingAutosave());
    expect(result.current.sectionProgress.chiefComplaint?.saveStatus).toBe('saved');
    act(() => jest.advanceTimersByTime(2000));
    expect(result.current.sectionProgress.chiefComplaint?.saveStatus).toBe('idle');
  });

  it('omits hidden Ayurveda section and ignores extension updates', () => {
    mockFeatures = { clinic_type: 'general' };
    const { result } = renderWorkspace();

    expect(buildSectionConfig(mockFeatures as any).activeSections).not.toContain('ayurvedicAssessment');
    expect(result.current.sectionProgress.ayurvedicAssessment).toBeUndefined();
    act(() => result.current.updateExtensionField('nadi_pariksha', 'nadi_type', 'Vata'));
    expect(result.current.casesheetData.extensions).toEqual([]);
    expect(createCasesheetApi).not.toHaveBeenCalled();
  });

  it('sendTreatmentToAdmin calls send-to-scheduling and never calls PATCH status', async () => {
    // Sheet already exists in workspace data (execution state DRAFT — not yet sent)
    (useEpisodeWorkspaceData as jest.Mock).mockReturnValue({
      ...mockWorkspaceData,
      treatmentSheet: { id: 'sheet-1', status: 'DRAFT', rows: [], duration_days: 7, state: 'DRAFT' },
      treatmentSheetId: 'sheet-1',
      hasTreatmentSheet: true,
    });

    const { result } = renderWorkspace();

    act(() => result.current.updateTreatmentField('recommendedTherapy', 'Abhyanga'));
    await act(async () => {
      await result.current.sendTreatmentToAdmin();
    });

    // send-to-scheduling must be called with the correct sheet ID and version
    expect(sendToSchedulingApi).toHaveBeenCalledWith(
      'sheet-1',
      expect.any(Number),
      expect.any(Object),
    );
    // isTreatmentSent must be true after success
    expect(result.current.isTreatmentSent).toBe(true);
    expect(result.current.treatmentSaveError).toBeNull();
  });

  it('sendTreatmentToAdmin creates a recommendation ORDER (no rows) when no sheet exists', async () => {
    // Ensure a casesheetId exists so send-to-admin can proceed.
    (useEpisodeWorkspaceData as jest.Mock).mockReturnValue({
      ...mockWorkspaceData,
      casesheetId: 'casesheet-1',
    });
    // Make createCasesheetApi set the ref by simulating the remote casesheetId sync
    (createCasesheetApi as jest.Mock).mockResolvedValue({ id: 'casesheet-1' });

    const { result } = renderWorkspace();

    // Trigger autosave to set casesheetIdRef
    act(() => result.current.updateCasesheetField('chief_complaint', 'Pain'));
    await act(async () => {
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
    });

    act(() => result.current.updateTreatmentField('recommendedTherapy', 'Shirodhara'));
    await act(async () => {
      await result.current.sendTreatmentToAdmin();
    });

    // The recommendation is an ORDER carrying therapy + sessions — NO rows are
    // created, and the row-creation / row-update endpoints must NOT be called.
    expect(createTreatmentRecommendationApi).toHaveBeenCalledWith(
      'tenant-1',
      expect.objectContaining({
        client_id: 'client-1',
        episode_id: 'episode-1',
        appointment_id: 'appointment-1',
        recommended_therapy: 'Shirodhara',
        planned_sessions: expect.any(Number),
      }),
    );
    expect(createSimpleTreatmentSheetApi).not.toHaveBeenCalled();
    expect(updateAllTreatmentSheetRowsApi).not.toHaveBeenCalled();
    // No separate send-to-scheduling call — the recommendation endpoint orders it.
    expect(sendToSchedulingApi).not.toHaveBeenCalled();
    expect(result.current.isTreatmentSent).toBe(true);
  });

  it('keeps ordered treatment values and re-enables send after further edits', () => {
    (useEpisodeWorkspaceData as jest.Mock).mockReturnValue({
      ...mockWorkspaceData,
      treatmentSheet: {
        id: 'sheet-ordered',
        status: 'DRAFT',
        duration_days: 14,
        state: 'ORDERED',
        rows: [{ id: 'row-1', treatment_description: 'Abhyanga', instructions: '{"notesForAdmin":"Morning"}' }],
      },
      treatmentSheetId: 'sheet-ordered',
      hasTreatmentSheet: true,
    });

    const { result } = renderWorkspace();

    expect(result.current.treatmentRecommendation.recommendedTherapy).toBe('Abhyanga');
    expect(result.current.isTreatmentSent).toBe(true);

    act(() => result.current.updateTreatmentField('notesForAdmin', 'Evening'));
    expect(result.current.treatmentRecommendation.notesForAdmin).toBe('Evening');
    expect(result.current.isTreatmentSent).toBe(false);
  });
});
