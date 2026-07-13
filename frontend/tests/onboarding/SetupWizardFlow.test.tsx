/**
 * SetupWizardFlow Tests
 *
 * Covers the visible_steps-empty observability fix (FR-097 regression detection).
 *
 * Verifies:
 *   1. visible_steps: null  → console.error fired with FR-097-referencing message + full
 *                             statusData payload, error UI renders, no navigation occurs
 *   2. visible_steps: []    → same as above
 *   3. visible_steps populated → console.error NOT called, no UI regression
 *
 * Note on console.error suppression: setup.ts does `global.console.error = jest.fn()`,
 * so assertions against it work cleanly without producing test output noise.
 */

import React from 'react';
import { render, waitFor, fireEvent, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BackHandler } from 'react-native';
import { SetupWizardFlow } from '../../features/onboarding/presentation/pages/SetupWizardFlow';
import * as wizardStore from '../../features/onboarding/presentation/stores/wizard.store';

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

const mockRouterPush = jest.fn();
const mockRouterReplace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockRouterPush,
    replace: mockRouterReplace,
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({ tenantId: 'test-tenant-456' }),
  useFocusEffect: (cb: () => void) => {
    // Fire the focus callback once, matching real mount behaviour.
    const react = require('react');
    react.useEffect(() => { cb(); }, []);
  },
}));

jest.mock('../../core/theme/useClinicTheme', () => ({
  useClinicTheme: () => ({
    colors: {
      primary: { default: '#2F6F4E' },
      secondary: { default: '#6B7280' },
      surface: { default: '#FFFFFF', elevated: '#F9FAFB' },
      background: { default: '#F8F4EC' },
      border: { default: '#E5E7EB' },
      text: { primary: '#111827', secondary: '#6B7280', onPrimary: '#FFFFFF' },
      feedback: {
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        warningLight: '#FEF3C7',
      },
    },
    spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
    typography: {
      h5: { fontSize: 20, fontWeight: '700' },
      h6: { fontSize: 16, fontWeight: '600' },
      body1: { fontSize: 16 },
      body2: { fontSize: 14 },
      caption: { fontSize: 12 },
      button: { fontSize: 14, fontWeight: '600' },
    },
  }),
}));

jest.mock('../../features/auth/presentation/hooks/useAuth', () => ({
  useAuth: () => ({
    currentUser: { tenantId: 'test-tenant-456' },
  }),
}));

// Stub child components — their internal behaviour is not under test here.
jest.mock('../../features/onboarding/presentation/components/WizardStepper', () => ({
  WizardStepper: () => null,
}));
jest.mock('../../features/onboarding/presentation/pages/steps/ClinicProfileScreen', () => ({
  ClinicProfileScreen: () => null,
}));
jest.mock('../../features/onboarding/presentation/pages/steps/BillingSetupScreen', () => ({
  BillingSetupScreen: () => null,
}));
jest.mock('../../features/onboarding/presentation/pages/steps/PaymentSetupScreen', () => ({
  PaymentSetupScreen: () => null,
}));
jest.mock('../../features/onboarding/presentation/pages/steps/GoLiveScreen', () => ({
  GoLiveScreen: ({ onComplete }: { onComplete: () => void }) => {
    const React = require('react');
    const { Text, TouchableOpacity } = require('react-native');
    return (
      <TouchableOpacity onPress={onComplete}>
        <Text>Complete Go Live</Text>
      </TouchableOpacity>
    );
  },
}));
jest.mock('../../features/onboarding/data/datasources/onboarding.api', () => ({
  submitStepDataApi: jest.fn(),
}));

// Mutable query mock — tests override return value per case.
const mockRefetch = jest.fn();
const mockMutateAsync = jest.fn();
const mockUseOnboardingStatusQuery = jest.fn();
jest.mock('../../features/onboarding/data/repositories/onboarding.repository.impl', () => ({
  useOnboardingStatusQuery: (...args: any[]) => mockUseOnboardingStatusQuery(...args),
  useSubmitStepMutation: () => ({
    mutateAsync: (...args: any[]) => mockMutateAsync(...args),
    isPending: false,
  }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Builds a minimal but realistic OnboardingStatusResponse. */
const buildStatus = (visible_steps: string[] | null) => ({
  tenant_id: 'test-tenant-456',
  template_id: 'template-abc',
  clinic_type: 'ayurveda',
  total_steps: visible_steps?.length ?? 0,
  completed_steps: 0,
  in_progress_steps: 0,
  pending_steps: visible_steps?.length ?? 0,
  blocked_steps: 0,
  completion_percentage: 0,
  current_step: null,
  next_recommended_step: null,
  is_ready_to_go_live: false,
  per_step_validation: {},
  visible_steps,
  actionable_steps: visible_steps ?? [],
});

const buildValidation = (
  visibleSteps: string[],
  completedStepCodes: string[] = []
) => Object.fromEntries(
  visibleSteps.map(stepCode => [
    stepCode,
    {
      step_code: stepCode,
      status: completedStepCodes.includes(stepCode) ? 'completed' : 'not_started',
      is_complete: completedStepCodes.includes(stepCode),
      is_valid: completedStepCodes.includes(stepCode),
      issues: [],
      blocked_reason: null,
      action_url_template: null,
      entity_type: null,
      icon: null,
      category: null,
      visible: true,
      actionable: true,
    },
  ])
);

const buildStatusWithSteps = (
  visibleSteps: string[],
  completedStepCodes: string[] = []
) => ({
  ...buildStatus(visibleSteps),
  total_steps: visibleSteps.length,
  completed_steps: completedStepCodes.length,
  pending_steps: visibleSteps.length - completedStepCodes.length,
  per_step_validation: buildValidation(visibleSteps, completedStepCodes),
  visible_steps: visibleSteps,
  actionable_steps: visibleSteps,
});

const renderFlow = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <SetupWizardFlow />
    </QueryClientProvider>
  );
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SetupWizardFlow — visible_steps empty/null observability (FR-097)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    mockRefetch.mockResolvedValue({});
    mockMutateAsync.mockResolvedValue({});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ── 1. console.error fires on visible_steps: null ─────────────────────────
  it('fires console.error with FR-097 message when visible_steps is null', async () => {
    const statusData = buildStatus(null);
    mockUseOnboardingStatusQuery.mockReturnValue({
      data: statusData,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    renderFlow();

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        '[SetupWizardFlow] visible_steps is empty/null for tenant',
        'test-tenant-456',
        expect.stringContaining('FR-097'),
        statusData
      );
    });
  });

  // ── 2. console.error fires on visible_steps: [] ───────────────────────────
  it('fires console.error with FR-097 message when visible_steps is []', async () => {
    const statusData = buildStatus([]);
    mockUseOnboardingStatusQuery.mockReturnValue({
      data: statusData,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    renderFlow();

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        '[SetupWizardFlow] visible_steps is empty/null for tenant',
        'test-tenant-456',
        expect.stringContaining('FR-097'),
        statusData
      );
    });
  });

  // ── 3. console.log is NOT called instead of console.error (replacement confirmed) ─
  it('does NOT call console.log for the empty visible_steps path', async () => {
    mockUseOnboardingStatusQuery.mockReturnValue({
      data: buildStatus(null),
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    renderFlow();

    await waitFor(() => {
      expect(console.error).toHaveBeenCalled();
    });

    // The old console.log message must not appear — confirms it was replaced, not supplemented.
    const logCalls: string[] = (console.log as jest.Mock).mock.calls
      .map((args: any[]) => String(args[0]));
    expect(logCalls).not.toContain('[SetupWizardFlow] No visible_steps in response');
  });

  // ── 4. Existing error+retry UI still renders (null) ───────────────────────
  it('renders the error+retry UI when visible_steps is null', async () => {
    mockUseOnboardingStatusQuery.mockReturnValue({
      data: buildStatus(null),
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    const { getByText } = renderFlow();

    await waitFor(() => {
      expect(getByText('Unable to load clinic preparation')).toBeTruthy();
      // The "no steps" descriptive message
      expect(getByText(/No preparation steps found/)).toBeTruthy();
      expect(getByText('Retry')).toBeTruthy();
    });
  });

  // ── 5. Existing error+retry UI still renders ([]) ─────────────────────────
  it('renders the error+retry UI when visible_steps is []', async () => {
    mockUseOnboardingStatusQuery.mockReturnValue({
      data: buildStatus([]),
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    const { getByText } = renderFlow();

    await waitFor(() => {
      expect(getByText('Unable to load clinic preparation')).toBeTruthy();
      expect(getByText(/No preparation steps found/)).toBeTruthy();
      expect(getByText('Retry')).toBeTruthy();
    });
  });

  // ── 6. No hardcoded navigation occurs on empty visible_steps ──────────────
  it('does NOT navigate to clinic_profile (or any hardcoded step) when visible_steps is null', async () => {
    mockUseOnboardingStatusQuery.mockReturnValue({
      data: buildStatus(null),
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    renderFlow();

    // Wait for the error log to confirm effects have settled.
    await waitFor(() => {
      expect(console.error).toHaveBeenCalled();
    });

    const allNavArgs = [
      ...mockRouterPush.mock.calls.map((a: any[]) => String(a[0])),
      ...mockRouterReplace.mock.calls.map((a: any[]) => String(a[0])),
    ];
    expect(allNavArgs.some(s => s.includes('clinic_profile'))).toBe(false);
  });

  // ── 7. Happy path: console.error NOT called when visible_steps is populated ─
  it('does NOT fire console.error when visible_steps is populated', async () => {
    mockUseOnboardingStatusQuery.mockReturnValue({
      data: buildStatus(['clinic_profile', 'operating_hours', 'staff_setup']),
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    renderFlow();

    // Allow all effects to settle — give React a full tick.
    await waitFor(() => {
      expect(mockUseOnboardingStatusQuery).toHaveBeenCalled();
    });

    expect(console.error).not.toHaveBeenCalledWith(
      '[SetupWizardFlow] visible_steps is empty/null for tenant',
      expect.anything(),
      expect.anything(),
      expect.anything()
    );
  });

  it('renders the Treatments redirect card for all service catalogue aliases', async () => {
    for (const stepCode of ['services', 'services_and_specialities', 'treatment_services']) {
      jest.clearAllMocks();
      mockUseOnboardingStatusQuery.mockReturnValue({
        data: buildStatusWithSteps([stepCode]),
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      const { getByText, unmount } = renderFlow();

      await waitFor(() => {
        expect(getByText('Treatments & Therapies')).toBeTruthy();
        expect(getByText('Go to Treatments Management')).toBeTruthy();
      });

      unmount();
    }
  });

  it('submits an external step only once during rapid Next taps and sends the idempotency key', async () => {
    let resolveSubmit: (() => void) | undefined;
    mockMutateAsync.mockImplementation(() => new Promise<void>(resolve => {
      resolveSubmit = resolve;
    }));
    mockUseOnboardingStatusQuery.mockReturnValue({
      data: buildStatusWithSteps(['services', 'inventory_setup']),
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    const { getByText } = renderFlow();

    await waitFor(() => {
      expect(getByText('Next')).toBeTruthy();
    });

    const nextButton = getByText('Next');
    fireEvent.press(nextButton);
    fireEvent.press(nextButton);

    expect(mockMutateAsync).toHaveBeenCalledTimes(1);
    expect(mockMutateAsync.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        data: {},
        mark_complete: true,
        idempotencyKey: expect.stringMatching(
          /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
        ),
      })
    );

    await act(async () => {
      resolveSubmit?.();
    });
  });

  it('does not advance until refetch resolves after submit', async () => {
    let resolveRefetch: (() => void) | undefined;
    mockMutateAsync.mockResolvedValue({});
    mockRefetch.mockImplementation(() => new Promise<void>(resolve => {
      resolveRefetch = resolve;
    }));
    mockUseOnboardingStatusQuery.mockReturnValue({
      data: buildStatusWithSteps(['services', 'inventory_setup']),
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    const { getByText, queryByText } = renderFlow();

    await waitFor(() => {
      expect(getByText('Treatments & Therapies')).toBeTruthy();
    });

    fireEvent.press(getByText('Next'));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledTimes(1);
      expect(mockRefetch).toHaveBeenCalled();
    });
    expect(queryByText('Inventory Readiness')).toBeNull();

    await act(async () => {
      resolveRefetch?.();
    });

    await waitFor(() => {
      expect(getByText('Inventory Readiness')).toBeTruthy();
    });
  });

  it('drops stale submission completions after unmount without refetching or navigating', async () => {
    let firstResolveSubmit: (() => void) | undefined;
    mockMutateAsync
      .mockImplementationOnce(() => new Promise<void>(resolve => {
        firstResolveSubmit = resolve;
      }));
    mockUseOnboardingStatusQuery.mockReturnValue({
      data: buildStatusWithSteps(['services', 'inventory_setup']),
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    const { getByText, unmount } = renderFlow();

    await waitFor(() => {
      expect(getByText('Treatments & Therapies')).toBeTruthy();
    });

    mockRefetch.mockClear();
    fireEvent.press(getByText('Next'));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledTimes(1);
    });

    unmount();

    await act(async () => {
      firstResolveSubmit?.();
    });

    expect(mockRefetch).not.toHaveBeenCalled();
    expect(mockRouterReplace).not.toHaveBeenCalledWith('/clinic-admin?tenantId=test-tenant-456');
  });

  it('uses Android hardware back to move to the previous step without exiting', async () => {
    const syncSpy = jest
      .spyOn(wizardStore, 'syncWizardDraftToStorage')
      .mockResolvedValue(undefined);
    let hardwareBackHandler: (() => boolean) | undefined;
    const addEventListenerSpy = jest
      .spyOn(BackHandler, 'addEventListener')
      .mockImplementation((_eventName, handler) => {
        hardwareBackHandler = handler as () => boolean;
        return { remove: jest.fn() } as any;
      });

    mockUseOnboardingStatusQuery.mockReturnValue({
      data: buildStatusWithSteps(['services', 'inventory_setup']),
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    const { getByText } = renderFlow();

    await waitFor(() => {
      expect(getByText('Treatments & Therapies')).toBeTruthy();
    });

    fireEvent.press(getByText('Next'));
    await waitFor(() => {
      expect(getByText('Inventory Readiness')).toBeTruthy();
    });

    const consumed = hardwareBackHandler?.();

    expect(consumed).toBe(true);
    expect(syncSpy).toHaveBeenCalled();
    expect(mockRouterPush).not.toHaveBeenCalled();
    expect(mockRouterReplace).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(getByText('Treatments & Therapies')).toBeTruthy();
    });

    addEventListenerSpy.mockRestore();
    syncSpy.mockRestore();
  });

  it('consumes Android hardware back on the first step without navigation', async () => {
    let hardwareBackHandler: (() => boolean) | undefined;
    const addEventListenerSpy = jest
      .spyOn(BackHandler, 'addEventListener')
      .mockImplementation((_eventName, handler) => {
        hardwareBackHandler = handler as () => boolean;
        return { remove: jest.fn() } as any;
      });

    mockUseOnboardingStatusQuery.mockReturnValue({
      data: buildStatusWithSteps(['services']),
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    renderFlow();

    await waitFor(() => {
      expect(hardwareBackHandler).toBeDefined();
    });

    const consumed = hardwareBackHandler?.();

    expect(consumed).toBe(true);
    expect(mockRouterPush).not.toHaveBeenCalled();
    expect(mockRouterReplace).not.toHaveBeenCalled();

    addEventListenerSpy.mockRestore();
  });

  it('clears onboarding drafts when go-live completes', async () => {
    const resetSpy = jest
      .spyOn(wizardStore, 'resetWizardDraftStorage')
      .mockResolvedValue(undefined);
    mockUseOnboardingStatusQuery.mockReturnValue({
      data: buildStatusWithSteps(['go_live_checklist'], ['go_live_checklist']),
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    const { getByText } = renderFlow();

    await waitFor(() => {
      expect(getByText('Complete Go Live')).toBeTruthy();
    });

    fireEvent.press(getByText('Complete Go Live'));

    expect(resetSpy).toHaveBeenCalled();
    expect(mockRouterReplace).toHaveBeenCalledWith('/clinic-admin?tenantId=test-tenant-456');

    resetSpy.mockRestore();
  });
});
