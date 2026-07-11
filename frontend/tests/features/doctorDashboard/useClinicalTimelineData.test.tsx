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
