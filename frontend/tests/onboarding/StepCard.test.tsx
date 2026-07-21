/**
 * StepCard Component Tests
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { StepCard } from '../../features/onboarding/presentation/components/StepCard';
import { StepStatus } from '../../features/onboarding/domain/entities/onboarding-status.entity';
import { JourneyCardModel } from '../../features/onboarding/domain/entities/journey.entity';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

// Mock theme hook
jest.mock('../../core/theme/useClinicTheme', () => ({
  useClinicTheme: () => ({
    colors: {
      primary: { default: '#2F6F4E' },
      surface: { default: '#FFFFFF' },
      border: { default: '#E5E7EB' },
      text: {
        primary: '#111827',
        secondary: '#6B7280',
        disabled: '#9CA3AF',
        link: '#2563EB',
      },
      feedback: {
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        errorLight: '#FEE2E2',
      },
    },
    spacing: { xs: 4, sm: 8, md: 16, lg: 24, xxl: 48 },
    typography: {
      h6: { fontSize: 16, fontWeight: '600' },
      body2: { fontSize: 14, fontWeight: '400' },
      caption: { fontSize: 12 },
      button: { fontSize: 14, fontWeight: '600' },
    },
  }),
}));

describe('StepCard Component', () => {
  const mockOnPress = jest.fn();

  const createMockStep = (overrides?: Partial<StepStatus>): StepStatus => ({
    code: 'staff_setup',
    status: 'not_started',
    isComplete: false,
    isValid: false,
    issues: [],
    blockedReason: null,
    actionUrl: '/clinic/test-tenant/staff',
    entityType: 'staff',
    icon: 'people',
    category: 'resources',
    isVisible: true,
    isActionable: true,
    ...overrides,
  });

  const createJourneyCard = (
    overrides?: Partial<JourneyCardModel>
  ): JourneyCardModel => ({
    cardId: 'card.staff_setup',
    stepCode: 'staff_setup',
    stageId: 'review_and_personalize',
    titleKey: 'onboarding.progressiveExperience.stepLabels.staffAndRoles',
    descriptionKey: 'onboarding.progressiveExperience.flow.staffDescription',
    actionLabelKey: 'onboarding.progressiveExperience.routes.reviewStep',
    destination: { kind: 'wizard_step', stepCode: 'staff_setup' },
    iconToken: 'people-outline',
    status: 'in_progress',
    isEligible: true,
    isVisible: true,
    isActionable: true,
    order: 0,
    ...overrides,
  });

  beforeEach(() => {
    mockOnPress.mockClear();
  });

  it('renders step card with correct title', () => {
    const step = createMockStep();
    const { getByText } = render(<StepCard step={step} onPress={mockOnPress} />);

    expect(getByText('Staff & Roles')).toBeTruthy();
  });

  it('shows completed status with green color', () => {
    const step = createMockStep({ status: 'completed', isComplete: true });
    const { getByText } = render(<StepCard step={step} onPress={mockOnPress} />);

    expect(getByText('Complete')).toBeTruthy();
  });

  it('shows in_progress status with yellow color', () => {
    const step = createMockStep({ status: 'in_progress' });
    const { getByText } = render(<StepCard step={step} onPress={mockOnPress} />);

    expect(getByText('In progress')).toBeTruthy();
  });

  it('shows blocked status with red color', () => {
    const step = createMockStep({ status: 'blocked' });
    const { getByText } = render(<StepCard step={step} onPress={mockOnPress} />);

    expect(getByText('Blocked')).toBeTruthy();
  });

  it('shows not_started status with gray color', () => {
    const step = createMockStep({ status: 'not_started' });
    const { getByText } = render(<StepCard step={step} onPress={mockOnPress} />);

    expect(getByText('Not started')).toBeTruthy();
  });

  it('displays validation issues when present', () => {
    const step = createMockStep({
      issues: [
        {
          severity: 'blocker',
          errorKey: 'STAFF_MIN_COUNT_NOT_MET',
          message: 'At least 1 staff member is required',
          entity: 'staff',
          field: null,
        },
      ],
    });
    const { getByText } = render(<StepCard step={step} onPress={mockOnPress} />);

    expect(getByText('• At least 1 staff member is required')).toBeTruthy();
  });

  it('displays blocked reason when present', () => {
    const step = createMockStep({
      status: 'blocked',
      blockedReason: 'Complete previous steps first',
    });
    const { getByText } = render(<StepCard step={step} onPress={mockOnPress} />);

    expect(getByText('Complete previous steps first')).toBeTruthy();
  });

  it('calls onPress when card is tapped and actionable', () => {
    const step = createMockStep({ isActionable: true });
    const { getByText } = render(<StepCard step={step} onPress={mockOnPress} />);

    fireEvent.press(getByText('Staff & Roles'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when card is not actionable', () => {
    const step = createMockStep({ isActionable: false });
    const { getByText } = render(<StepCard step={step} onPress={mockOnPress} />);

    fireEvent.press(getByText('Staff & Roles'));
    expect(mockOnPress).not.toHaveBeenCalled();
  });

  it('formats step code correctly (snake_case to Title Case)', () => {
    const step = createMockStep({ code: 'treatment_rooms' });
    const { getByText } = render(<StepCard step={step} onPress={mockOnPress} />);

    expect(getByText('Rooms & Therapy Beds')).toBeTruthy();
  });

  it('displays multiple issues correctly', () => {
    const step = createMockStep({
      issues: [
        {
          severity: 'blocker',
          errorKey: 'ERROR_1',
          message: 'First error',
          entity: null,
          field: null,
        },
        {
          severity: 'warning',
          errorKey: 'ERROR_2',
          message: 'Second error',
          entity: null,
          field: null,
        },
      ],
    });
    const { getByText } = render(<StepCard step={step} onPress={mockOnPress} />);

    expect(getByText('• First error')).toBeTruthy();
    expect(getByText('• Second error')).toBeTruthy();
  });

  it('exposes disabled accessibility state when not actionable', () => {
    const step = createMockStep({ isActionable: false });
    const { getByRole } = render(<StepCard step={step} onPress={mockOnPress} />);

    expect(getByRole('button').props.accessibilityState).toEqual({
      disabled: true,
    });
  });

  it('renders prepared localized Journey Card content without raw identifiers', () => {
    const journeyCard = createJourneyCard();
    const { getByText, queryByText } = render(
      <StepCard journeyCard={journeyCard} onPress={mockOnPress} />
    );

    expect(getByText('Staff & Roles')).toBeTruthy();
    expect(getByText(/Review staff members/)).toBeTruthy();
    expect(getByText('In progress')).toBeTruthy();
    expect(getByText('Review Step')).toBeTruthy();
    expect(queryByText('staff_setup')).toBeNull();
  });

  it('provides Journey Card button semantics and an action consequence hint', () => {
    const journeyCard = createJourneyCard({ isActionable: false });
    const { getByRole } = render(
      <StepCard journeyCard={journeyCard} onPress={mockOnPress} />
    );

    const button = getByRole('button');
    expect(button.props.accessibilityLabel).toBe('Staff & Roles. In progress');
    expect(button.props.accessibilityHint).toContain('Review Step');
    expect(button.props.accessibilityState).toEqual({ disabled: true });
    fireEvent.press(button);
    expect(mockOnPress).not.toHaveBeenCalled();
  });

  it('renders Journey Card unavailable state with non-color text and icon semantics', () => {
    const { getByText, getByRole } = render(
      <StepCard
        journeyCard={createJourneyCard({ status: 'unavailable', isActionable: false })}
        onPress={mockOnPress}
      />
    );

    expect(getByText('Unavailable')).toBeTruthy();
    expect(getByRole('button').props.accessibilityLabel).toContain('Unavailable');
  });
});
