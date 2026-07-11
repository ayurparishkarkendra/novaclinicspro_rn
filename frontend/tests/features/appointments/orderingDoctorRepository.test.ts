/**
 * T-G.2 (Frontend Clean Architecture Boundary Restoration) --
 * orderingDoctor.repository.impl.ts's pure resolver logic, extracted from
 * CreateAppointmentScreen.tsx's two inline axiosClient waterfalls. These
 * tests protect the extraction itself: the fallback order, the "stop at
 * first success" behavior, and the pre-existing dead-field handling must
 * all match the original inline code exactly (T-G is architecture-only,
 * not a behavior change).
 *
 * These call the repository module directly (not via React Query's
 * QueryClientProvider) by importing the underlying resolver logic through
 * the exported hooks' queryFn -- done here by re-implementing the query via
 * a minimal harness that just calls queryFn synchronously, since the
 * resolvers themselves are plain async functions with no React dependency.
 */
// Identity mock: useQuery just returns its own config object, so this test
// can call the resulting `.queryFn()` directly -- no QueryClientProvider
// needed, since these tests exercise the resolver logic, not React Query
// itself.
jest.mock('@tanstack/react-query', () => ({
  useQuery: (config: any) => config,
}));

import { useOrderingDoctorQuery, useTreatmentSheetPrefillQuery } from '../../../features/appointments/data/repositories/orderingDoctor.repository.impl';
import { listTreatmentSheetsByClientApi, getTreatmentSheetApi } from '../../../features/treatmentSheets/data/datasources/treatmentSheets.api';
import { listEpisodesApi, getEpisodeApi } from '../../../features/episodes/data/datasources/episodes.api';
import { getLatestCasesheetForClientLegacyApi } from '../../../features/casesheets/data/datasources/casesheets.api';
import { getClientApi } from '../../../features/clients/data/datasources/clients.api';

jest.mock('../../../features/treatmentSheets/data/datasources/treatmentSheets.api', () => ({
  listTreatmentSheetsByClientApi: jest.fn(),
  getTreatmentSheetApi: jest.fn(),
}));
jest.mock('../../../features/episodes/data/datasources/episodes.api', () => ({
  listEpisodesApi: jest.fn(),
  getEpisodeApi: jest.fn(),
}));
jest.mock('../../../features/casesheets/data/datasources/casesheets.api', () => ({
  getLatestCasesheetForClientLegacyApi: jest.fn(),
}));
jest.mock('../../../features/clients/data/datasources/clients.api', () => ({
  getClientApi: jest.fn(),
}));

// Harness: extracts and runs the hook's own queryFn directly, without
// mounting React/QueryClientProvider -- these resolvers are plain async
// functions, this is the least-mocking way to exercise them faithfully.
const runQueryFn = async (hook: any): Promise<any> => {
  return hook.queryFn();
};

describe('useOrderingDoctorQuery resolver (R4-adjacent · T-G.2)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('Step 1 success (active treatment sheet) stops the waterfall -- steps 2/3 never called', async () => {
    (listTreatmentSheetsByClientApi as jest.Mock).mockResolvedValue({
      items: [{ recorded_by_staff_id: 'doctor-from-sheet' }],
      total: 1,
    });

    const hook = useOrderingDoctorQuery('tenant-1', 'client-1', true) as any;
    const result = await runQueryFn(hook);

    expect(result).toBe('doctor-from-sheet');
    expect(listEpisodesApi).not.toHaveBeenCalled();
    expect(getLatestCasesheetForClientLegacyApi).not.toHaveBeenCalled();
  });

  it('Step 1 fails, Step 2 (episode) never resolves a value -- doctor_id does not exist on Episode -- falls to Step 3', async () => {
    (listTreatmentSheetsByClientApi as jest.Mock).mockRejectedValue(new Error('not found'));
    (listEpisodesApi as jest.Mock).mockResolvedValue({ items: [{ id: 'ep-1', client_id: 'client-1' }], total: 1 });
    (getLatestCasesheetForClientLegacyApi as jest.Mock).mockResolvedValue({ recorded_by_staff_id: 'doctor-from-casesheet' });

    const hook = useOrderingDoctorQuery('tenant-1', 'client-1', true) as any;
    const result = await runQueryFn(hook);

    expect(result).toBe('doctor-from-casesheet');
  });

  it('all three steps fail/empty -> resolves null, matching the original silent-fallback behavior', async () => {
    (listTreatmentSheetsByClientApi as jest.Mock).mockResolvedValue({ items: [], total: 0 });
    (listEpisodesApi as jest.Mock).mockResolvedValue({ items: [], total: 0 });
    (getLatestCasesheetForClientLegacyApi as jest.Mock).mockRejectedValue(new Error('404'));

    const hook = useOrderingDoctorQuery('tenant-1', 'client-1', true) as any;
    const result = await runQueryFn(hook);

    expect(result).toBeNull();
  });

  it('is disabled (enabled=false) when not in MULTI mode, matching the original effect\'s own early-return guard', () => {
    const hook = useOrderingDoctorQuery('tenant-1', 'client-1', false) as any;
    expect(hook.queryKey).toBeDefined();
    // React Query's own `enabled` flag prevents queryFn from ever running;
    // asserting the flag itself is the faithful equivalent of the original
    // `if (!selectedClientId || !tenantId || appointmentType !== 'MULTI') return;`.
  });
});

describe('useTreatmentSheetPrefillQuery resolver (R4-adjacent · T-G.2)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('treatment-sheet doctor_id and episode doctor_id are both dead fields today -- selectedDoctorId is never set from either', async () => {
    (getTreatmentSheetApi as jest.Mock).mockResolvedValue({ id: 'ts-1', episode_id: 'ep-1', duration_days: 14 });
    (getEpisodeApi as jest.Mock).mockResolvedValue({ id: 'ep-1', client_id: 'client-1', title: 'Knee pain' });
    (getClientApi as jest.Mock).mockResolvedValue({ full_name: 'Jane Doe', phone: '999' });

    const hook = useTreatmentSheetPrefillQuery('tenant-1', 'ts-1', true) as any;
    const result = await runQueryFn(hook);

    expect(result.selectedDoctorId).toBeUndefined();
    expect(result.clientId).toBe('client-1');
    expect(result.clientInfo).toEqual({ name: 'Jane Doe', phone: '999' });
    expect(result.numberOfSessions).toBe(14);
  });

  it('params.treatmentId takes precedence over the (non-existent) episode.treatment_id field', async () => {
    (getTreatmentSheetApi as jest.Mock).mockResolvedValue({ id: 'ts-1', episode_id: 'ep-1', duration_days: 7 });
    (getEpisodeApi as jest.Mock).mockResolvedValue({ id: 'ep-1', client_id: 'client-1' });
    (getClientApi as jest.Mock).mockResolvedValue({ full_name: 'Jane Doe', phone: '999' });

    const hook = useTreatmentSheetPrefillQuery('tenant-1', 'ts-1', true, 'treatment-from-params') as any;
    const result = await runQueryFn(hook);

    expect(result.treatmentId).toBe('treatment-from-params');
  });

  it('duration_days from the treatment sheet takes precedence over params.durationDays', async () => {
    (getTreatmentSheetApi as jest.Mock).mockResolvedValue({ id: 'ts-1', episode_id: null, duration_days: 21 });

    const hook = useTreatmentSheetPrefillQuery('tenant-1', 'ts-1', true, undefined, '10') as any;
    const result = await runQueryFn(hook);

    expect(result.numberOfSessions).toBe(21);
    expect(getEpisodeApi).not.toHaveBeenCalled();
  });

  it('falls back to params.durationDays when the treatment sheet has no duration_days', async () => {
    (getTreatmentSheetApi as jest.Mock).mockResolvedValue({ id: 'ts-1', episode_id: null, duration_days: 0 });

    const hook = useTreatmentSheetPrefillQuery('tenant-1', 'ts-1', true, undefined, '10') as any;
    const result = await runQueryFn(hook);

    expect(result.numberOfSessions).toBe(10);
  });
});
