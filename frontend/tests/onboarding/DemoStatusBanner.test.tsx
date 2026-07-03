/**
 * DemoStatusBanner Component Tests
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { DemoStatusBanner } from '../../features/onboarding/presentation/components/DemoStatusBanner';

// Mock theme hook
jest.mock('../../core/theme/useClinicTheme', () => ({
  useClinicTheme: () => ({
    colors: {
      primary: { default: '#2F6F4E', soft: '#E8F5E9' },
      surface: { default: '#FFFFFF', elevated: '#F9FAFB' },
      border: { default: '#E5E7EB' },
      text: { primary: '#111827', secondary: '#6B7280', onPrimary: '#FFFFFF' },
      feedback: {
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        errorLight: '#FEE2E2',
      },
    },
    spacing: { xs: 4, sm: 8, md: 16, lg: 24 },
    typography: {
      h6: { fontSize: 16, fontWeight: '600' },
      body2: { fontSize: 14 },
      button: { fontSize: 14, fontWeight: '600' },
    },
  }),
}));

describe('DemoStatusBanner Component', () => {
  const mockOnExtendDemo = jest.fn();
  const mockOnTransitionToLive = jest.fn();

  const futureDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(); // 5 days from now
  const trialFutureDate = new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(); // 25 days from now

  beforeEach(() => {
    mockOnExtendDemo.mockClear();
    mockOnTransitionToLive.mockClear();
  });

  it('renders demo mode banner when demo is active', () => {
    const { getByText } = render(
      <DemoStatusBanner
        demoExpiresAt={futureDate}
        trialExpiresAt={trialFutureDate}
        isDemoExpired={false}
        isTrialExpired={false}
        onExtendDemo={mockOnExtendDemo}
        onTransitionToLive={mockOnTransitionToLive}
      />
    );

    expect(getByText('Sample Clinic')).toBeTruthy();
  });

  it('renders trial period banner when demo is expired', () => {
    const { getByText } = render(
      <DemoStatusBanner
        demoExpiresAt={new Date(Date.now() - 1000).toISOString()}
        trialExpiresAt={trialFutureDate}
        isDemoExpired={true}
        isTrialExpired={false}
        onTransitionToLive={mockOnTransitionToLive}
      />
    );

    expect(getByText('Commercial Trial')).toBeTruthy();
  });

  it('shows extend demo button when demo is active and can extend', () => {
    const { getByText } = render(
      <DemoStatusBanner
        demoExpiresAt={futureDate}
        trialExpiresAt={trialFutureDate}
        isDemoExpired={false}
        isTrialExpired={false}
        onExtendDemo={mockOnExtendDemo}
        onTransitionToLive={mockOnTransitionToLive}
        canExtendDemo={true}
      />
    );

    expect(getByText('Extend Sample Access')).toBeTruthy();
  });

  it('hides extend demo button when cannot extend', () => {
    const { queryByText } = render(
      <DemoStatusBanner
        demoExpiresAt={futureDate}
        trialExpiresAt={trialFutureDate}
        isDemoExpired={false}
        isTrialExpired={false}
        onExtendDemo={mockOnExtendDemo}
        onTransitionToLive={mockOnTransitionToLive}
        canExtendDemo={false}
      />
    );

    expect(queryByText('Extend Sample Access')).toBeNull();
  });

  it('shows "Ready to Start" button when sample clinic is active', () => {
    const { getByText } = render(
      <DemoStatusBanner
        demoExpiresAt={futureDate}
        trialExpiresAt={trialFutureDate}
        isDemoExpired={false}
        isTrialExpired={false}
        onTransitionToLive={mockOnTransitionToLive}
      />
    );

    expect(getByText('Ready to Start')).toBeTruthy();
  });

  it('shows "Choose Plan" button when sample clinic is expired', () => {
    const { getByText } = render(
      <DemoStatusBanner
        demoExpiresAt={new Date(Date.now() - 1000).toISOString()}
        trialExpiresAt={trialFutureDate}
        isDemoExpired={true}
        isTrialExpired={false}
        onTransitionToLive={mockOnTransitionToLive}
      />
    );

    expect(getByText('Choose Plan')).toBeTruthy();
  });

  it('calls onExtendDemo when extend button is pressed', () => {
    const { getByText } = render(
      <DemoStatusBanner
        demoExpiresAt={futureDate}
        trialExpiresAt={trialFutureDate}
        isDemoExpired={false}
        isTrialExpired={false}
        onExtendDemo={mockOnExtendDemo}
        onTransitionToLive={mockOnTransitionToLive}
      />
    );

    fireEvent.press(getByText('Extend Sample Access'));
    expect(mockOnExtendDemo).toHaveBeenCalledTimes(1);
  });

  it('calls onTransitionToLive when Ready to Start button is pressed', () => {
    const { getByText } = render(
      <DemoStatusBanner
        demoExpiresAt={futureDate}
        trialExpiresAt={trialFutureDate}
        isDemoExpired={false}
        isTrialExpired={false}
        onTransitionToLive={mockOnTransitionToLive}
      />
    );

    fireEvent.press(getByText('Ready to Start'));
    expect(mockOnTransitionToLive).toHaveBeenCalledTimes(1);
  });

  it('shows trial expired message when both demo and trial are expired', () => {
    const { getByText } = render(
      <DemoStatusBanner
        demoExpiresAt={new Date(Date.now() - 1000).toISOString()}
        trialExpiresAt={new Date(Date.now() - 1000).toISOString()}
        isDemoExpired={true}
        isTrialExpired={true}
      />
    );

    expect(getByText('Commercial Trial Ended')).toBeTruthy();
    expect(
      getByText('Your clinic data is safely stored. Choose a subscription plan to continue using Nova.')
    ).toBeTruthy();
  });

  it('displays demo countdown when demo is active', () => {
    const { getByText } = render(
      <DemoStatusBanner
        demoExpiresAt={futureDate}
        trialExpiresAt={trialFutureDate}
        isDemoExpired={false}
        isTrialExpired={false}
      />
    );

    expect(getByText(/Sample access ends in:/)).toBeTruthy();
  });

  it('displays trial countdown', () => {
    const { getByText } = render(
      <DemoStatusBanner
        demoExpiresAt={futureDate}
        trialExpiresAt={trialFutureDate}
        isDemoExpired={false}
        isTrialExpired={false}
      />
    );

    expect(getByText(/Commercial trial ends in:/)).toBeTruthy();
  });

  it('does not show demo countdown when demo is expired', () => {
    const { queryByText } = render(
      <DemoStatusBanner
        demoExpiresAt={new Date(Date.now() - 1000).toISOString()}
        trialExpiresAt={trialFutureDate}
        isDemoExpired={true}
        isTrialExpired={false}
      />
    );

    expect(queryByText(/Sample access ends in:/)).toBeNull();
  });
});
