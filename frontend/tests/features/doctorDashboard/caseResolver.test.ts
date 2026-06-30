import {
  resolveCase,
  startConsultationWithGuard,
} from '../../../features/doctorDashboard/application/caseResolver';
import { axiosClient } from '../../../core/api/axiosClient';

jest.mock('../../../core/api/axiosClient', () => ({
  axiosClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

const mockGet = axiosClient.get as jest.Mock;
const mockPost = axiosClient.post as jest.Mock;

describe('Case Resolver', () => {
  const router = { push: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('attaches an active episode and navigates to consultation', async () => {
    mockGet
      .mockResolvedValueOnce({ data: { episode_id: null } })
      .mockResolvedValueOnce({ data: { total: 1, items: [{ id: 'episode-1' }] } });
    mockPost.mockResolvedValue({ data: {} });

    await resolveCase('tenant-1', 'appointment-1', 'client-1', router);

    expect(mockGet).toHaveBeenCalledWith(
      '/api/v1/clinic/tenant-1/appointments/appointment-1',
      { params: { expand: 'staff' } },
    );
    expect(mockGet).toHaveBeenCalledWith(
      '/api/v1/clinic/tenant-1/episodes?client_id=client-1&status=ACTIVE&limit=1',
    );
    expect(mockPost).toHaveBeenCalledWith(
      '/api/v1/clinic/tenant-1/appointments/appointment-1/attach-episode',
      { episode_id: 'episode-1' },
    );
    expect(router.push).toHaveBeenCalledWith(
      '/clinic-admin/episodes/episode-1/consultation?appointmentId=appointment-1&clientId=client-1',
    );
  });

  it('uses an appointment-linked episode without reattaching another active episode', async () => {
    mockGet.mockResolvedValue({ data: { episode_id: 'new-episode' } });

    await resolveCase('tenant-1', 'appointment-1', 'client-1', router);

    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockPost).not.toHaveBeenCalled();
    expect(router.push).toHaveBeenCalledWith(
      '/clinic-admin/episodes/new-episode/consultation?appointmentId=appointment-1&clientId=client-1',
    );
  });

  it('navigates to start-consultation when no active episode exists', async () => {
    mockGet
      .mockResolvedValueOnce({ data: { episode_id: null } })
      .mockResolvedValueOnce({ data: { total: 0, items: [] } });

    await resolveCase('tenant-1', 'appointment-1', 'client-1', router);

    expect(mockPost).not.toHaveBeenCalled();
    expect(router.push).toHaveBeenCalledWith(
      '/clinic-admin/appointments/appointment-1/start-consultation?clientId=client-1',
    );
  });

  it('propagates GET errors without navigation', async () => {
    await expect(async () => {
      mockGet.mockRejectedValue(new Error('network down'));
      await resolveCase('tenant-1', 'appointment-1', 'client-1', router);
    }).rejects.toThrow('network down');

    expect(router.push).not.toHaveBeenCalled();
  });

  it('propagates PATCH errors without navigation', async () => {
    mockGet
      .mockResolvedValueOnce({ data: { episode_id: null } })
      .mockResolvedValueOnce({ data: { total: 1, items: [{ id: 'episode-1' }] } });
    mockPost.mockRejectedValue(new Error('attach failed'));

    await expect(resolveCase('tenant-1', 'appointment-1', 'client-1', router)).rejects.toThrow(
      'attach failed',
    );
    expect(router.push).not.toHaveBeenCalled();
  });

  it('returns early while another appointment is loading', async () => {
    const setState = jest.fn();

    await startConsultationWithGuard({
      tenantId: 'tenant-1',
      appointmentId: 'appointment-1',
      clientId: 'client-1',
      router,
      loadingAppointmentId: 'appointment-0',
      setState,
    });

    expect(mockGet).not.toHaveBeenCalled();
    expect(setState).not.toHaveBeenCalled();
    expect(router.push).not.toHaveBeenCalled();
  });

  it('sets per-card error when resolver fails', async () => {
    const setState = jest.fn();
    mockGet.mockRejectedValue(new Error('server error'));

    await startConsultationWithGuard({
      tenantId: 'tenant-1',
      appointmentId: 'appointment-1',
      clientId: 'client-1',
      router,
      loadingAppointmentId: null,
      setState,
    });

    const errorUpdater = setState.mock.calls[1][0];
    expect(errorUpdater({ loadingAppointmentId: 'appointment-1', error: null })).toEqual({
      loadingAppointmentId: 'appointment-1',
      error: { appointmentId: 'appointment-1', message: 'server error' },
    });
  });
});
