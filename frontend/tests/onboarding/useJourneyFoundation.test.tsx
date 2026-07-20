import { renderHook } from '@testing-library/react-native';
import { useJourneyFoundation } from '../../features/onboarding/presentation/hooks/useJourneyFoundation';

const mockUseOnboardingStatusQuery = jest.fn();

jest.mock('../../features/onboarding/data/repositories/onboarding.repository.impl', () => ({
  useOnboardingStatusQuery: (...args: unknown[]) => mockUseOnboardingStatusQuery(...args),
}));

const buildStep = (
  stepCode: string,
  status: 'completed' | 'in_progress' | 'not_started' | 'blocked'
) => ({
  step_code: stepCode,
  status,
  is_complete: status === 'completed',
  is_valid: status === 'completed',
  issues: [],
  blocked_reason: null,
  action_url_template: `/clinic/{tenant_id}/${stepCode}`,
  entity_type: stepCode,
  icon: 'ellipse-outline',
  category: 'setup',
  visible: true,
  actionable: status !== 'blocked',
});

const buildStatus = (tenantId: string, visibleSteps: string[]) => ({
  tenant_id: tenantId,
  template_id: 'template-a',
  clinic_type: 'specialty-neutral',
  total_steps: visibleSteps.length,
  completed_steps: 1,
  in_progress_steps: 1,
  pending_steps: Math.max(visibleSteps.length - 2, 0),
  blocked_steps: 0,
  completion_percentage: 50,
  current_step: visibleSteps[0] ?? null,
  next_recommended_step: visibleSteps[0] ?? null,
  is_ready_to_go_live: false,
  per_step_validation: Object.fromEntries(
    visibleSteps.map((stepCode, index) => [
      stepCode,
      buildStep(stepCode, index === 1 ? 'completed' : 'in_progress'),
    ])
  ),
  visible_steps: visibleSteps,
  actionable_steps: visibleSteps,
});

describe('useJourneyFoundation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('reuses the existing status query and projects cards in backend order', () => {
    mockUseOnboardingStatusQuery.mockReturnValue({
      data: buildStatus('tenant-a', ['staff_setup', 'clinic_profile']),
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    const { result } = renderHook(() => useJourneyFoundation('tenant-a'));

    expect(mockUseOnboardingStatusQuery).toHaveBeenCalledWith('tenant-a', { enabled: true });
    expect(result.current.journey?.identity.tenantId).toBe('tenant-a');
    expect(result.current.journey?.cards.map(card => card.stepCode)).toEqual([
      'staff_setup',
      'clinic_profile',
    ]);
    expect(result.current.journey?.progress).toEqual({ completed: 1, total: 2 });
  });

  it('omits unknown backend steps without fabricating cards', () => {
    mockUseOnboardingStatusQuery.mockReturnValue({
      data: buildStatus('tenant-a', ['unknown_step', 'staff_setup']),
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    const { result } = renderHook(() => useJourneyFoundation('tenant-a'));

    expect(result.current.journey?.cards.map(card => card.stepCode)).toEqual(['staff_setup']);
    expect(result.current.journey?.diagnostics.unknownStepCodes).toEqual(['unknown_step']);
  });

  it('does not expose stale status from a different tenant', () => {
    mockUseOnboardingStatusQuery.mockReturnValue({
      data: buildStatus('tenant-a', ['clinic_profile']),
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    const { result } = renderHook(() => useJourneyFoundation('tenant-b'));

    expect(result.current.journey).toBeNull();
  });
});
