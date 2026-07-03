/**
 * SetupWizardScreen Integration Tests
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SetupWizardScreen } from '../../features/onboarding/presentation/pages/SetupWizardScreen';

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(),
}));

const mockReplace = jest.fn();
const mockUseRouter = useRouter as jest.Mock;
const mockUseLocalSearchParams = useLocalSearchParams as jest.Mock;

jest.mock('../../core/theme/useClinicTheme', () => ({
  useClinicTheme: () => ({
    colors: {
      primary: { default: '#2F6F4E' },
      background: { default: '#F8F4EC' },
      text: { secondary: '#6B7280' },
    },
    spacing: { md: 16 },
    typography: {
      body1: { fontSize: 16 },
    },
  }),
}));

describe('SetupWizardScreen Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({ replace: mockReplace });
    mockUseLocalSearchParams.mockReturnValue({ tenantId: 'test-tenant-123' });
  });

  it('redirects to the clinic preparation flow when tenantId is present', async () => {
    render(<SetupWizardScreen />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/onboarding/wizard-flow?tenantId=test-tenant-123');
    });
  });

  it('shows clinic preparation loading copy while redirecting', () => {
    const { getByText } = render(<SetupWizardScreen />);

    expect(getByText('Loading clinic preparation...')).toBeTruthy();
  });

  it('does not redirect without a tenantId', async () => {
    mockUseLocalSearchParams.mockReturnValue({ tenantId: undefined });

    render(<SetupWizardScreen />);

    await waitFor(() => {
      expect(mockReplace).not.toHaveBeenCalled();
    });
  });
});
