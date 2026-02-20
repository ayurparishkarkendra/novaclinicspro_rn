/**
 * SetupWizardScreen Integration Tests
 */

import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { SetupWizardScreen } from '../../features/onboarding/presentation/pages/SetupWizardScreen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock dependencies
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({
    tenantId: 'test-tenant-123',
  }),
  useFocusEffect: (callback: () => void) => {
    React.useEffect(() => {
      callback();
    }, []);
  },
}));

jest.mock('../../core/theme/useClinicTheme', () => ({
  useClinicTheme: () => ({
    colors: {
      primary: { default: '#2F6F4E', soft: '#E8F5E9' },
      surface: { default: '#FFFFFF', elevated: '#F9FAFB' },
      background: { default: '#F8F4EC' },
      border: { default: '#E5E7EB', subtle: '#F3F4F6' },
      text: { primary: '#111827', secondary: '#6B7280', onPrimary: '#FFFFFF' },
      feedback: {
        success: '#10B981',
        successLight: '#D1FAE5',
        warning: '#F59E0B',
        info: '#3B82F6',
        infoLight: '#DBEAFE',
        error: '#EF4444',
      },
    },
    spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
    typography: {
      h3: { fontSize: 24, fontWeight: '700' },
      h6: { fontSize: 16, fontWeight: '600' },
      body1: { fontSize: 16 },
      body2: { fontSize: 14 },
      caption: { fontSize: 12 },
      button: { fontSize: 14, fontWeight: '600' },
    },
  }),
}));

jest.mock('../../features/onboarding/presentation/providers/onboarding.store', () => ({
  useOnboardingStore: () => ({
    setIsSubmitting: jest.fn(),
    isSubmitting: false,
  }),
}));

// Mock API responses
const mockOnboardingStatus = {
  tenant_id: 'test-tenant-123',
  template_id: 'template-456',
  clinic_type: 'ayurveda',
  total_steps: 8,
  completed_steps: 3,
  in_progress_steps: 1,
  pending_steps: 4,
  blocked_steps: 0,
  completion_percentage: 37.5,
  current_step: 'staff_setup',
  next_recommended_step: 'treatment_rooms',
  is_ready_to_go_live: false,
  per_step_validation: {
    clinic_profile: {
      step_code: 'clinic_profile',
      status: 'completed',
      is_complete: true,
      is_valid: true,
      issues: [],
      blocked_reason: null,
      action_url_template: '/clinic/{tenant_id}/profile',
      entity_type: 'clinic_profile',
      icon: 'building',
      category: 'basic_setup',
      visible: true,
      actionable: true,
    },
    staff_setup: {
      step_code: 'staff_setup',
      status: 'in_progress',
      is_complete: false,
      is_valid: false,
      issues: [
        {
          severity: 'blocker',
          error_key: 'STAFF_MIN_COUNT_NOT_MET',
          resolved_message: 'At least 1 staff member is required',
          entity: 'staff',
          field: null,
        },
      ],
      blocked_reason: 'At least 1 staff member is required',
      action_url_template: '/clinic/{tenant_id}/staff',
      entity_type: 'staff',
      icon: 'people',
      category: 'resources',
      visible: true,
      actionable: true,
    },
  },
  visible_steps: ['clinic_profile', 'staff_setup'],
  actionable_steps: ['clinic_profile', 'staff_setup'],
};

jest.mock('../../features/onboarding/data/repositories/onboarding.repository.impl', () => ({
  useOnboardingStatusQuery: () => ({
    data: mockOnboardingStatus,
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  }),
  useDemoStatusQuery: () => ({
    data: null,
    isLoading: false,
    error: null,
  }),
  useCompleteSetupMutation: () => ({
    mutateAsync: jest.fn(),
    isPending: false,
  }),
}));

describe('SetupWizardScreen Integration Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>{component}</QueryClientProvider>
    );
  };

  it('renders setup wizard with header', async () => {
    const { getByText } = renderWithProviders(<SetupWizardScreen />);

    await waitFor(() => {
      expect(getByText('Setup Your Clinic')).toBeTruthy();
      expect(getByText('Ayurveda Clinic')).toBeTruthy();
    });
  });

  it('displays progress bar with correct percentage', async () => {
    const { getByText } = renderWithProviders(<SetupWizardScreen />);

    await waitFor(() => {
      expect(getByText('37.5%')).toBeTruthy();
      expect(getByText('3 of 8 steps completed')).toBeTruthy();
    });
  });

  it('displays next recommended step', async () => {
    const { getByText } = renderWithProviders(<SetupWizardScreen />);

    await waitFor(() => {
      expect(getByText('Next Step')).toBeTruthy();
      expect(getByText('Treatment Rooms')).toBeTruthy();
    });
  });

  it('renders all visible steps', async () => {
    const { getByText } = renderWithProviders(<SetupWizardScreen />);

    await waitFor(() => {
      expect(getByText('Clinic Profile')).toBeTruthy();
      expect(getByText('Staff Setup')).toBeTruthy();
    });
  });

  it('shows completed status for completed steps', async () => {
    const { getAllByText } = renderWithProviders(<SetupWizardScreen />);

    await waitFor(() => {
      const completedTexts = getAllByText('COMPLETED');
      expect(completedTexts.length).toBeGreaterThan(0);
    });
  });

  it('shows in_progress status for in-progress steps', async () => {
    const { getByText } = renderWithProviders(<SetupWizardScreen />);

    await waitFor(() => {
      expect(getByText('IN PROGRESS')).toBeTruthy();
    });
  });

  it('displays validation issues for steps', async () => {
    const { getByText } = renderWithProviders(<SetupWizardScreen />);

    await waitFor(() => {
      expect(getByText('• At least 1 staff member is required')).toBeTruthy();
    });
  });

  it('disables complete setup button when not ready to go live', async () => {
    const { getByText } = renderWithProviders(<SetupWizardScreen />);

    await waitFor(() => {
      const button = getByText('Complete Setup & Go Live');
      expect(button.parent?.props.disabled).toBe(true);
    });
  });

  it('shows warning message when not ready to go live', async () => {
    const { getByText } = renderWithProviders(<SetupWizardScreen />);

    await waitFor(() => {
      expect(getByText('Complete all required steps to go live')).toBeTruthy();
    });
  });

  it('renders save and continue later button', async () => {
    const { getByText } = renderWithProviders(<SetupWizardScreen />);

    await waitFor(() => {
      expect(getByText('Save & Continue Later')).toBeTruthy();
    });
  });
});
