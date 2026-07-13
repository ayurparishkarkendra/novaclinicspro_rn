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
import { AppState, BackHandler } from 'react-native';
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

const mockNetInfoState = {
  isConnected: true as boolean | null,
  isInternetReachable: true as boolean | null,
};

jest.mock('@react-native-community/netinfo', () => ({
  useNetInfo: () => mockNetInfoState,
}));

const mockAuthState = {
  currentUser: { tenantId: 'test-tenant-456', applicationStatus: 'onboarding' },
  isAuthenticated: false,
};

jest.mock('../../features/auth/presentation/hooks/useAuth', () => ({
  useAuth: () => ({
    currentUser: mockAuthState.currentUser,
    isAuthenticated: mockAuthState.isAuthenticated,
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
        <Text>Complete Ready to Start</Text>
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
const mockUseDemoStatusQuery = jest.fn();
jest.mock('../../features/onboarding/data/repositories/onboarding.repository.impl', () => ({
  useOnboardingStatusQuery: (...args: any[]) => mockUseOnboardingStatusQuery(...args),
  useDemoStatusQuery: (...args: any[]) => mockUseDemoStatusQuery(...args),
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

type StepValidationMock = {
  step_code: string;
  status: 'completed' | 'in_progress' | 'not_started' | 'blocked';
  is_complete: boolean;
  is_valid: boolean;
  issues: any[];
  blocked_reason: string | null;
  action_url_template: string | null;
  entity_type: string | null;
  icon: string | null;
  category: string | null;
  visible: boolean;
  actionable: boolean;
};

const buildValidation = (
  visibleSteps: string[],
  completedStepCodes: string[] = [],
  overrides: Record<string, Partial<StepValidationMock>> = {}
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
      ...overrides[stepCode],
    },
  ])
);

const buildStatusWithSteps = (
  visibleSteps: string[],
  completedStepCodes: string[] = [],
  validationOverrides: Record<string, Partial<StepValidationMock>> = {}
) => ({
  ...buildStatus(visibleSteps),
  total_steps: visibleSteps.length,
  completed_steps: completedStepCodes.length,
  pending_steps: visibleSteps.length - completedStepCodes.length,
  per_step_validation: buildValidation(visibleSteps, completedStepCodes, validationOverrides),
  visible_steps: visibleSteps,
  actionable_steps: visibleSteps,
});

const buildDemoStatus = () => ({
  demo_tenant_id: 'test-tenant-456',
  display_name: 'Clinic Preparation',
  status: 'TRIAL',
  demo_expires_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
  trial_expires_at: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
  demo_time_remaining_seconds: 5 * 24 * 60 * 60,
  trial_time_remaining_seconds: 25 * 24 * 60 * 60,
  is_demo_expired: false,
  is_trial_expired: false,
  demo_url: '',
  created_at: new Date().toISOString(),
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
    mockNetInfoState.isConnected = true;
    mockNetInfoState.isInternetReachable = true;
    mockAuthState.currentUser = { tenantId: 'test-tenant-456', applicationStatus: 'onboarding' };
    mockAuthState.isAuthenticated = false;
    wizardStore.useWizardStore.getState().reset();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    mockRefetch.mockResolvedValue({});
    mockMutateAsync.mockResolvedValue({});
    mockUseDemoStatusQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    });
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

  it('shows the offline banner and keeps step content visible when NetInfo reports offline', async () => {
    mockNetInfoState.isConnected = false;
    mockNetInfoState.isInternetReachable = false;
    mockUseOnboardingStatusQuery.mockReturnValue({
      data: buildStatusWithSteps(['services']),
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    const { getByText } = renderFlow();

    await waitFor(() => {
      expect(getByText("You're offline")).toBeTruthy();
      expect(getByText('Changes are saved locally. Connect to the internet to submit this step.')).toBeTruthy();
      expect(getByText('Treatments & Therapies')).toBeTruthy();
    });
  });

  it('does not render the offline banner when NetInfo reports online', async () => {
    mockUseOnboardingStatusQuery.mockReturnValue({
      data: buildStatusWithSteps(['services']),
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    const { queryByText, getByText } = renderFlow();

    await waitFor(() => {
      expect(getByText('Treatments & Therapies')).toBeTruthy();
    });

    expect(queryByText("You're offline")).toBeNull();
  });

  it('disables submit while offline and re-enables it when connectivity returns', async () => {
    mockNetInfoState.isConnected = false;
    mockNetInfoState.isInternetReachable = false;
    mockUseOnboardingStatusQuery.mockReturnValue({
      data: buildStatusWithSteps(['services']),
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    const { getByLabelText, rerender } = renderFlow();

    await waitFor(() => {
      expect(getByLabelText('Connect to the internet to submit this step')).toHaveProp(
        'accessibilityState',
        { disabled: true }
      );
    });

    mockNetInfoState.isConnected = true;
    mockNetInfoState.isInternetReachable = true;

    rerender(
      <QueryClientProvider client={new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
      })}
      >
        <SetupWizardFlow />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(getByLabelText('Ready to Start')).toHaveProp('accessibilityState', { disabled: false });
    });
  });

  it('does not dispatch submit mutation when offline submit is pressed', async () => {
    mockNetInfoState.isConnected = false;
    mockNetInfoState.isInternetReachable = false;
    mockUseOnboardingStatusQuery.mockReturnValue({
      data: buildStatusWithSteps(['services']),
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    const { getByLabelText } = renderFlow();

    await waitFor(() => {
      expect(getByLabelText('Connect to the internet to submit this step')).toBeTruthy();
    });

    fireEvent.press(getByLabelText('Connect to the internet to submit this step'));

    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('routes the banner continue setup action to the backend recommended step', async () => {
    mockUseDemoStatusQuery.mockReturnValue({
      data: buildDemoStatus(),
      isLoading: false,
      error: null,
    });
    mockUseOnboardingStatusQuery.mockReturnValue({
      data: {
        ...buildStatusWithSteps(['clinic_profile', 'operating_hours', 'go_live_checklist']),
        next_recommended_step: 'operating_hours',
      },
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    const { getByText, queryByText } = renderFlow();

    await waitFor(() => {
      expect(getByText('Clinic Preparation')).toBeTruthy();
      expect(queryByText(/Demo/i)).toBeNull();
      expect(queryByText(/Go Live/i)).toBeNull();
    });

    fireEvent.press(getByText('Continue Setup'));

    await waitFor(() => {
      expect(getByText('Operating Hours')).toBeTruthy();
    });
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('routes the banner Ready to Start action to the existing checklist step', async () => {
    mockUseDemoStatusQuery.mockReturnValue({
      data: buildDemoStatus(),
      isLoading: false,
      error: null,
    });
    mockUseOnboardingStatusQuery.mockReturnValue({
      data: buildStatusWithSteps(['clinic_profile', 'go_live_checklist']),
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    const { getByText } = renderFlow();

    await waitFor(() => {
      expect(getByText('Ready to Start')).toBeTruthy();
    });

    fireEvent.press(getByText('Ready to Start'));

    await waitFor(() => {
      expect(getByText('Complete Ready to Start')).toBeTruthy();
    });
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('disables the banner Ready to Start action when backend readiness is not actionable', async () => {
    mockUseDemoStatusQuery.mockReturnValue({
      data: buildDemoStatus(),
      isLoading: false,
      error: null,
    });
    mockUseOnboardingStatusQuery.mockReturnValue({
      data: buildStatusWithSteps(
        ['clinic_profile', 'go_live_checklist'],
        [],
        { go_live_checklist: { actionable: false } }
      ),
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    const { getByLabelText, queryByText } = renderFlow();

    await waitFor(() => {
      expect(getByLabelText('Ready to Start')).toHaveProp('accessibilityState', { disabled: true });
    });

    fireEvent.press(getByLabelText('Ready to Start'));

    expect(queryByText('Complete Ready to Start')).toBeNull();
    expect(mockMutateAsync).not.toHaveBeenCalled();
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

  it('clears onboarding drafts when Ready to Start completes', async () => {
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
      expect(getByText('Complete Ready to Start')).toBeTruthy();
    });

    fireEvent.press(getByText('Complete Ready to Start'));

    expect(resetSpy).toHaveBeenCalled();
    expect(mockRouterReplace).toHaveBeenCalledWith('/clinic-admin?tenantId=test-tenant-456');

    resetSpy.mockRestore();
  });

  it('persists dirty wizard drafts when the app moves to background', async () => {
    const syncSpy = jest
      .spyOn(wizardStore, 'syncWizardDraftToStorage')
      .mockResolvedValue(undefined);
    let appStateHandler: ((state: string) => void) | undefined;
    const addEventListenerSpy = jest
      .spyOn(AppState, 'addEventListener')
      .mockImplementation((_eventName, handler) => {
        appStateHandler = handler as (state: string) => void;
        return { remove: jest.fn() } as any;
      });

    mockUseOnboardingStatusQuery.mockReturnValue({
      data: buildStatusWithSteps(['clinic_profile', 'operating_hours']),
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    renderFlow();

    await waitFor(() => {
      expect(appStateHandler).toBeDefined();
    });

    act(() => {
      wizardStore.useWizardStore.getState().setStepDraft('clinic_profile', { name: 'Nova Clinic' });
      appStateHandler?.('background');
    });

    await waitFor(() => {
      expect(syncSpy).toHaveBeenCalledTimes(1);
    });

    addEventListenerSpy.mockRestore();
    syncSpy.mockRestore();
  });

  it('skips background persistence when the wizard draft store is clean', async () => {
    const syncSpy = jest
      .spyOn(wizardStore, 'syncWizardDraftToStorage')
      .mockResolvedValue(undefined);
    let appStateHandler: ((state: string) => void) | undefined;
    const addEventListenerSpy = jest
      .spyOn(AppState, 'addEventListener')
      .mockImplementation((_eventName, handler) => {
        appStateHandler = handler as (state: string) => void;
        return { remove: jest.fn() } as any;
      });

    mockUseOnboardingStatusQuery.mockReturnValue({
      data: buildStatusWithSteps(['clinic_profile']),
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    renderFlow();

    await waitFor(() => {
      expect(appStateHandler).toBeDefined();
    });

    act(() => {
      appStateHandler?.('background');
    });

    expect(syncSpy).not.toHaveBeenCalled();

    addEventListenerSpy.mockRestore();
    syncSpy.mockRestore();
  });

  it('hydrates drafts and refreshes backend status when returning active', async () => {
    mockAuthState.isAuthenticated = true;
    const hydrateSpy = jest
      .spyOn(wizardStore, 'hydrateWizardDraftFromStorage')
      .mockResolvedValue(undefined);
    let appStateHandler: ((state: string) => void) | undefined;
    const addEventListenerSpy = jest
      .spyOn(AppState, 'addEventListener')
      .mockImplementation((_eventName, handler) => {
        appStateHandler = handler as (state: string) => void;
        return { remove: jest.fn() } as any;
      });

    mockUseOnboardingStatusQuery.mockReturnValue({
      data: buildStatusWithSteps(['clinic_profile']),
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });
    mockRefetch.mockResolvedValue({ data: buildStatusWithSteps(['clinic_profile']) });

    renderFlow();

    await waitFor(() => {
      expect(appStateHandler).toBeDefined();
    });

    mockRefetch.mockClear();

    act(() => {
      appStateHandler?.('background');
      appStateHandler?.('active');
    });

    await waitFor(() => {
      expect(hydrateSpy).toHaveBeenCalled();
      expect(mockRefetch).toHaveBeenCalledTimes(1);
    });

    expect(hydrateSpy.mock.invocationCallOrder[0]).toBeLessThan(mockRefetch.mock.invocationCallOrder[0]);

    addEventListenerSpy.mockRestore();
    hydrateSpy.mockRestore();
  });

  it('does not refetch on foreground when authentication is missing', async () => {
    mockAuthState.isAuthenticated = false;
    const hydrateSpy = jest
      .spyOn(wizardStore, 'hydrateWizardDraftFromStorage')
      .mockResolvedValue(undefined);
    let appStateHandler: ((state: string) => void) | undefined;
    const addEventListenerSpy = jest
      .spyOn(AppState, 'addEventListener')
      .mockImplementation((_eventName, handler) => {
        appStateHandler = handler as (state: string) => void;
        return { remove: jest.fn() } as any;
      });

    mockUseOnboardingStatusQuery.mockReturnValue({
      data: buildStatusWithSteps(['clinic_profile']),
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    renderFlow();

    await waitFor(() => {
      expect(appStateHandler).toBeDefined();
    });

    mockRefetch.mockClear();

    act(() => {
      appStateHandler?.('background');
      appStateHandler?.('active');
    });

    await waitFor(() => {
      expect(hydrateSpy).toHaveBeenCalled();
    });
    expect(mockRefetch).not.toHaveBeenCalled();

    addEventListenerSpy.mockRestore();
    hydrateSpy.mockRestore();
  });

  it('shows a localized notice when backend visible steps change after foreground refresh', async () => {
    mockAuthState.isAuthenticated = true;
    jest
      .spyOn(wizardStore, 'hydrateWizardDraftFromStorage')
      .mockResolvedValue(undefined);
    let appStateHandler: ((state: string) => void) | undefined;
    const addEventListenerSpy = jest
      .spyOn(AppState, 'addEventListener')
      .mockImplementation((_eventName, handler) => {
        appStateHandler = handler as (state: string) => void;
        return { remove: jest.fn() } as any;
      });

    mockUseOnboardingStatusQuery.mockReturnValue({
      data: buildStatusWithSteps(['clinic_profile']),
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });
    mockRefetch.mockResolvedValue({ data: buildStatusWithSteps(['clinic_profile', 'operating_hours']) });

    const { getByText } = renderFlow();

    await waitFor(() => {
      expect(appStateHandler).toBeDefined();
    });

    act(() => {
      appStateHandler?.('background');
      appStateHandler?.('active');
    });

    await waitFor(() => {
      expect(getByText('Your onboarding progress has been updated.')).toBeTruthy();
    });

    addEventListenerSpy.mockRestore();
    jest.restoreAllMocks();
  });

  it('does not show a notice when backend visible steps are unchanged after foreground refresh', async () => {
    mockAuthState.isAuthenticated = true;
    jest
      .spyOn(wizardStore, 'hydrateWizardDraftFromStorage')
      .mockResolvedValue(undefined);
    let appStateHandler: ((state: string) => void) | undefined;
    const addEventListenerSpy = jest
      .spyOn(AppState, 'addEventListener')
      .mockImplementation((_eventName, handler) => {
        appStateHandler = handler as (state: string) => void;
        return { remove: jest.fn() } as any;
      });

    mockUseOnboardingStatusQuery.mockReturnValue({
      data: buildStatusWithSteps(['clinic_profile']),
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });
    mockRefetch.mockResolvedValue({ data: buildStatusWithSteps(['clinic_profile']) });

    const { queryByText } = renderFlow();

    await waitFor(() => {
      expect(appStateHandler).toBeDefined();
    });

    act(() => {
      appStateHandler?.('background');
      appStateHandler?.('active');
    });

    await waitFor(() => {
      expect(mockRefetch).toHaveBeenCalled();
    });

    expect(queryByText('Your onboarding progress has been updated.')).toBeNull();

    addEventListenerSpy.mockRestore();
    jest.restoreAllMocks();
  });
});
