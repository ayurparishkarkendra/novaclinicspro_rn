/**
 * StepDetailScreen alias routing tests
 *
 * Presentation-layer coverage for service-catalogue alias redirects.
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { StepDetailScreen } from '../../features/onboarding/presentation/pages/StepDetailScreen';

const mockRouterReplace = jest.fn();
let mockStepCode = 'services';

jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockRouterReplace,
  }),
  useLocalSearchParams: () => ({
    tenantId: 'tenant-alias-123',
    stepCode: mockStepCode,
  }),
}));

jest.mock('../../core/theme/useClinicTheme', () => ({
  useClinicTheme: () => ({
    colors: {
      primary: { default: '#2F6F4E' },
      background: { default: '#F8F4EC' },
      text: { primary: '#111827', secondary: '#6B7280' },
      feedback: { error: '#EF4444' },
    },
    spacing: { sm: 8, md: 16, lg: 24 },
    typography: {
      body1: { fontSize: 16 },
      body2: { fontSize: 14 },
      h6: { fontSize: 16, fontWeight: '600' },
    },
  }),
}));

jest.mock('../../features/onboarding/data/repositories/onboarding.repository.impl', () => ({
  useOnboardingStatusQuery: () => ({
    data: {
      per_step_validation: {},
    },
    isLoading: false,
    error: null,
  }),
}));

jest.mock('../../features/onboarding/presentation/components/ErrorScreen', () => ({
  ErrorScreen: ({ message }: { message: string }) => message,
}));
jest.mock('../../features/onboarding/presentation/components/StepProgressHeader', () => ({
  StepProgressHeader: () => null,
}));
jest.mock('../../features/onboarding/presentation/pages/steps/ClinicProfileScreen', () => ({
  ClinicProfileScreen: () => null,
}));
jest.mock('../../features/onboarding/presentation/pages/steps/OperatingHoursScreen', () => ({
  OperatingHoursScreen: () => null,
}));
jest.mock('../../features/onboarding/presentation/pages/steps/BillingSetupScreen', () => ({
  BillingSetupScreen: () => null,
}));
jest.mock('../../features/onboarding/presentation/pages/steps/PaymentSetupScreen', () => ({
  PaymentSetupScreen: () => null,
}));

describe('StepDetailScreen service catalogue alias routing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each(['services', 'services_offered', 'treatment_services'])(
    'redirects %s to Treatments management',
    async (stepCode) => {
      mockStepCode = stepCode;

      render(<StepDetailScreen />);

      await waitFor(() => {
        expect(mockRouterReplace).toHaveBeenCalledWith('/clinic-admin/settings/treatments');
      });
    }
  );

  it('does not redirect an unrecognised step code', async () => {
    mockStepCode = 'unknown_step';

    render(<StepDetailScreen />);

    await waitFor(() => {
      expect(mockRouterReplace).not.toHaveBeenCalled();
    });
  });
});
