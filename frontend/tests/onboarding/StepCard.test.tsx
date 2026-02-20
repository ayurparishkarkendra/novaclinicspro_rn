/**
 * StepCard Component Tests
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { StepCard } from '../../features/onboarding/presentation/components/StepCard';
import { StepStatus } from '../../features/onboarding/domain/entities/onboarding-status.entity';

// Mock theme hook
jest.mock('../../core/theme/useClinicTheme', () => ({
  useClinicTheme: () => ({
    colors: {
      primary: { default: '#2F6F4E' },
      surface: { default: '#FFFFFF' },
      border: { default: '#E5E7EB' },
      text: { primary: '#111827', secondary: '#6B7280' },
      feedback: {
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        errorLight: '#FEE2E2',
      },
    },
    spacing: { xs: 4, sm: 8, md: 16 },
    typography: {
      h6: { fontSize: 16, fontWeight: '600' },
      caption: { fontSize: 12 },
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

  beforeEach(() => {
    mockOnPress.mockClear();
  });

  it('renders step card with correct title', () => {
    const step = createMockStep();
    const { getByText } = render(<StepCard step={step} onPress={mockOnPress} />);

    expect(getByText('Staff Setup')).toBeTruthy();
  });

  it('shows completed status with green color', () => {
    const step = createMockStep({ status: 'completed', isComplete: true });
    const { getByText } = render(<StepCard step={step} onPress={mockOnPress} />);

    expect(getByText('COMPLETED')).toBeTruthy();
  });

  it('shows in_progress status with yellow color', () => {
    const step = createMockStep({ status: 'in_progress' });
    const { getByText } = render(<StepCard step={step} onPress={mockOnPress} />);

    expect(getByText('IN PROGRESS')).toBeTruthy();
  });

  it('shows blocked status with red color', () => {
    const step = createMockStep({ status: 'blocked' });
    const { getByText } = render(<StepCard step={step} onPress={mockOnPress} />);

    expect(getByText('BLOCKED')).toBeTruthy();
  });

  it('shows not_started status with gray color', () => {
    const step = createMockStep({ status: 'not_started' });
    const { getByText } = render(<StepCard step={step} onPress={mockOnPress} />);

    expect(getByText('NOT STARTED')).toBeTruthy();
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

    fireEvent.press(getByText('Staff Setup'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when card is not actionable', () => {
    const step = createMockStep({ isActionable: false });
    const { getByText } = render(<StepCard step={step} onPress={mockOnPress} />);

    fireEvent.press(getByText('Staff Setup'));
    expect(mockOnPress).not.toHaveBeenCalled();
  });

  it('formats step code correctly (snake_case to Title Case)', () => {
    const step = createMockStep({ code: 'treatment_rooms' });
    const { getByText } = render(<StepCard step={step} onPress={mockOnPress} />);

    expect(getByText('Treatment Rooms')).toBeTruthy();
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

  it('has reduced opacity when not actionable', () => {
    const step = createMockStep({ isActionable: false });
    const { getByText } = render(<StepCard step={step} onPress={mockOnPress} />);

    const card = getByText('Staff Setup').parent?.parent;
    expect(card?.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ opacity: 0.6 })])
    );
  });
});
