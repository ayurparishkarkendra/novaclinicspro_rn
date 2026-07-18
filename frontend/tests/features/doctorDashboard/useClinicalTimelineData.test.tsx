import fs from 'fs';
import path from 'path';
import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useClinicalTimelineData } from '../../../features/episodes/presentation/hooks/useClinicalTimelineData';
import { useEpisodeContext, usePatientContext } from '../../../features/episodes/presentation/context/ClinicalWorkspaceContext';
import { useAppointmentsListQuery } from '../../../features/appointments/data/repositories/appointments.repository.impl';
import { usePrescriptionsListQuery } from '../../../features/prescriptions/data/repositories/prescriptions.repository.impl';
import { useTreatmentSheetsByEpisodeQuery } from '../../../features/treatmentSheets/data/repositories/treatmentSheets.repository.impl';
import { listClinicalServicesByVisitApi } from '../../../features/clinicalServices/data/datasources/clinicalServices.api';

/**
 * R3B · T-C.1 — Verification for the Clinical Timeline adapter
 * (`useClinicalTimelineData`). Confirms it returns correctly ordered,
 * uniformly shaped data across the 5 in-scope artifact types (Visits,
 * Prescriptions, Case Sheet, Treatment Recommendation, Clinical Services —
 * Feedback deferred per FR-C1a), and holds no component-level state of its
 * own (Timeline Adapter Rule, design.md §7).
 */

jest.mock('../../../features/episodes/presentation/context/ClinicalWorkspaceContext', () => ({
  useEpisodeContext: jest.fn(),
  usePatientContext: jest.fn(),
}));
jest.mock('../../../features/appointments/data/repositories/appointments.repository.impl', () => ({
  useAppointmentsListQuery: jest.fn(),
}));
jest.mock('../../../features/prescriptions/data/repositories/prescriptions.repository.impl', () => ({
  usePrescriptionsListQuery: jest.fn(),
}));
jest.mock('../../../features/treatmentSheets/data/repositories/treatmentSheets.repository.impl', () => ({
  useTreatmentSheetsByEpisodeQuery: jest.fn(),
}));
jest.mock('../../../features/clinicalServices/data/datasources/clinicalServices.api', () => ({
  listClinicalServicesByVisitApi: jest.fn(),
}));

let queryClient: QueryClient;
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('useClinicalTimelineData (R3B · T-C.1)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    (useEpisodeContext as jest.Mock).mockReturnValue({
      tenantId: 'tenant-1',
      episodeId: 'episode-1',
      casesheet: undefined,
      casesheetId: null,
    });
    (usePatientContext as jest.Mock).mockReturnValue({ clientId: 'client-1' });
    (useAppointmentsListQuery as jest.Mock).mockReturnValue({ data: { items: [] }, isLoading: false });
    (usePrescriptionsListQuery as jest.Mock).mockReturnValue({ data: { items: [] }, isLoading: false });
    (useTreatmentSheetsByEpisodeQuery as jest.Mock).mockReturnValue({ data: { treatment_sheets: [] }, isLoading: false });
    (listClinicalServicesByVisitApi as jest.Mock).mockResolvedValue({ items: [], total: 0, skip: 0, limit: 50 });
  });

  it('returns an empty item list when nothing exists yet', async () => {
    const { result } = renderHook(() => useClinicalTimelineData(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.items).toEqual([]);
  });

  it('aggregates Visits, Prescriptions, Case Sheet, and Treatment Recommendation, sorted most-recent-first', async () => {
    (useAppointmentsListQuery as jest.Mock).mockReturnValue({
      data: { items: [{ id: 'visit-1', appointment_start: '2026-06-01T10:00:00Z', status: 'COMPLETED' }] },
      isLoading: false,
    });
    (usePrescriptionsListQuery as jest.Mock).mockReturnValue({
      data: {
        items: [
          {
            id: 'rx-1',
            created_at: '2026-06-03T10:00:00Z',
            prescription_data: { medications: [{ name: 'Paracetamol', dosage: '500mg', frequency: '', duration: '' }] },
          },
        ],
      },
      isLoading: false,
    });
    (useEpisodeContext as jest.Mock).mockReturnValue({
      tenantId: 'tenant-1',
      episodeId: 'episode-1',
      casesheet: { recorded_at: '2026-06-02T10:00:00Z', chief_complaint: 'Knee pain' },
      casesheetId: 'casesheet-1',
    });
    (useTreatmentSheetsByEpisodeQuery as jest.Mock).mockReturnValue({
      data: { treatment_sheets: [{ id: 'sheet-1', recorded_at: '2026-06-04T10:00:00Z', rows: [{ session_date: '2026-06-05' }, { session_date: null }] }] },
      isLoading: false,
    });

    const { result } = renderHook(() => useClinicalTimelineData(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const items = result.current.items;
    expect(items.map((i) => i.type)).toEqual([
      'treatment_recommendation', // 06-04, most recent
      'prescription', // 06-03
      'case_sheet', // 06-02
      'visit', // 06-01, oldest
    ]);
    expect(items[0]).toEqual(
      expect.objectContaining({ title: 'Treatment Recommendation', subtitle: '1/2 therapy sessions', route: '/clinic-admin/treatment-sheets/sheet-1' }),
    );
    expect(items[1]).toEqual(
      expect.objectContaining({ title: 'Prescription', subtitle: '1 medication', route: '/clinic-admin/clients/client-1/prescriptions/rx-1' }),
    );
    expect(items[2]).toEqual(
      expect.objectContaining({ title: 'Case Sheet', subtitle: 'Knee pain', route: '/clinic-admin/clients/client-1/casesheets/casesheet-1' }),
    );
    expect(items[3]).toEqual(
      expect.objectContaining({ title: 'Visit', subtitle: 'COMPLETED', route: '/clinic-admin/appointments/visit-1' }),
    );
  });

  it('omits the Case Sheet entry entirely when the episode has no casesheet yet', async () => {
    const { result } = renderHook(() => useClinicalTimelineData(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.items.some((i) => i.type === 'case_sheet')).toBe(false);
  });

  it('fans Clinical Services out per Visit (the backend has no episode-wide query) and aggregates the results', async () => {
    (useAppointmentsListQuery as jest.Mock).mockReturnValue({
      data: {
        items: [
          { id: 'visit-1', appointment_start: '2026-06-01T10:00:00Z', status: 'COMPLETED' },
          { id: 'visit-2', appointment_start: '2026-06-08T10:00:00Z', status: 'COMPLETED' },
        ],
      },
      isLoading: false,
    });
    (listClinicalServicesByVisitApi as jest.Mock).mockImplementation((tenantId: string, visitId: string) => {
      if (visitId === 'visit-1') {
        return Promise.resolve({
          items: [{ id: 'svc-1', visit_id: 'visit-1', service_type: 'Massage', delivered_at: '2026-06-01T11:00:00Z' }],
          total: 1, skip: 0, limit: 50,
        });
      }
      return Promise.resolve({ items: [], total: 0, skip: 0, limit: 50 });
    });

    const { result } = renderHook(() => useClinicalTimelineData(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(listClinicalServicesByVisitApi).toHaveBeenCalledWith('tenant-1', 'visit-1');
    expect(listClinicalServicesByVisitApi).toHaveBeenCalledWith('tenant-1', 'visit-2');
    const serviceItems = result.current.items.filter((i) => i.type === 'clinical_service');
    expect(serviceItems).toEqual([
      expect.objectContaining({
        title: 'Clinical Service',
        subtitle: 'Massage',
        date: '2026-06-01T11:00:00Z',
        route: '/clinic-admin/appointments/visit-1',
      }),
    ]);
  });

  it('is a pure derivation with no component-level state of its own (Timeline Adapter Rule, design.md §7): no useState/useReducer for clinical content anywhere in the adapter file', () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, '../../../features/episodes/presentation/hooks/useClinicalTimelineData.ts'),
      'utf8',
    );
    expect(source).not.toMatch(/useState|useReducer/);
  });

  it('exposes zero JSX / zero rendering — a plain module, not a component (Timeline Adapter Rule): no react-native view imports, no .tsx extension', () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, '../../../features/episodes/presentation/hooks/useClinicalTimelineData.ts'),
      'utf8',
    );
    expect(source).not.toMatch(/from ['"]react-native['"]/);
    expect(fs.existsSync(path.resolve(__dirname, '../../../features/episodes/presentation/hooks/useClinicalTimelineData.tsx'))).toBe(false);
  });
});

// Characterization of the R7 v1.1 history-hierarchy defect (Group -1 · T-0.1,
// ahead of Group 0 · T-0.6 removal and later T-FE-C.5/C.6 replacement — see
// R7-HISTORY-HIERARCHY-AMENDMENT.md, ED-ARCH-007, FR-HIST-1/2). These tests
// characterize CURRENT flat-list behavior exactly as it exists today —
// including the parts already verified as defects (therapy appointments
// undifferentiated from consultations; session count computed from
// "scheduled" not "completed"; the same therapy course representable twice).
// Passing here does NOT endorse this behavior as correct; it exists so
// T-FE-C.5/C.6 can prove the defect was corrected on purpose, not lost by
// accident.
describe('useClinicalTimelineData — history-hierarchy defect characterization (pre-T-0.6/ED-ARCH-007, not endorsement)', () => {
  it('CHARACTERIZATION: a therapy appointment (appointment_type THERAPY) produces the exact same undifferentiated "visit" item shape as a doctor-consultation appointment — no encounter-type field distinguishes them', async () => {
    (useAppointmentsListQuery as jest.Mock).mockReturnValue({
      data: {
        items: [
          { id: 'consult-1', appointment_start: '2026-06-01T10:00:00Z', status: 'COMPLETED', appointment_type: 'consultation' },
          { id: 'therapy-1', appointment_start: '2026-06-02T10:00:00Z', status: 'COMPLETED', appointment_type: 'THERAPY' },
        ],
      },
      isLoading: false,
    });

    const { result } = renderHook(() => useClinicalTimelineData(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const visitItems = result.current.items.filter((i) => i.type === 'visit');
    expect(visitItems).toHaveLength(2);
    // Both items carry the identical shape/keys — `appointment_type` is never
    // read by the adapter, so nothing downstream can tell them apart.
    expect(Object.keys(visitItems[0]).sort()).toEqual(Object.keys(visitItems[1]).sort());
    expect(visitItems.every((i) => i.title === 'Visit')).toBe(true);
  });

  it('CHARACTERIZATION (verified-incorrect formula, ED-ARCH-007): a row with a FUTURE, not-yet-occurred `session_date` is counted as "completed" in the Treatment Recommendation subtitle — the formula checks scheduling, not execution', async () => {
    (useTreatmentSheetsByEpisodeQuery as jest.Mock).mockReturnValue({
      data: {
        treatment_sheets: [
          {
            id: 'sheet-1',
            recorded_at: '2026-06-04T10:00:00Z',
            rows: [{ session_date: '2099-01-01' }, { session_date: null }], // far-future date, never executed
          },
        ],
      },
      isLoading: false,
    });

    const { result } = renderHook(() => useClinicalTimelineData(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const planItem = result.current.items.find((i) => i.type === 'treatment_recommendation');
    // A session scheduled for 2099 has certainly not been completed, yet the
    // current formula (`row.session_date` presence) reports it as 1/2 done.
    expect(planItem?.subtitle).toBe('1/2 therapy sessions');
  });

  it('CHARACTERIZATION (double representation, ED-ARCH-007): the same therapy course appears once as a flat "visit" item (from its appointment) and again inside the Treatment Recommendation session tally, with no link/dedup between them', async () => {
    (useAppointmentsListQuery as jest.Mock).mockReturnValue({
      data: {
        items: [{ id: 'therapy-1', appointment_start: '2026-06-05T10:00:00Z', status: 'COMPLETED', appointment_type: 'THERAPY' }],
      },
      isLoading: false,
    });
    (useTreatmentSheetsByEpisodeQuery as jest.Mock).mockReturnValue({
      data: {
        treatment_sheets: [{ id: 'sheet-1', recorded_at: '2026-06-05T10:00:00Z', rows: [{ session_date: '2026-06-05' }] }],
      },
      isLoading: false,
    });

    const { result } = renderHook(() => useClinicalTimelineData(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const types = result.current.items.map((i) => i.type);
    // The same 2026-06-05 therapy encounter surfaces as BOTH a standalone
    // "visit" item AND inside "treatment_recommendation"'s own tally — the
    // adapter has no `appointment_id`↔row linkage to collapse them into one.
    expect(types).toEqual(expect.arrayContaining(['visit', 'treatment_recommendation']));
    expect(types.filter((t) => t === 'visit' || t === 'treatment_recommendation')).toHaveLength(2);
  });
});
