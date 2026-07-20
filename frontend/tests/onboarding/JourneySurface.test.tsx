import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { JourneySurface } from '../../features/onboarding/presentation/components/JourneySurface';
import {
  JourneyCardModel,
  JourneyViewModel,
  PROGRESSIVE_EXPERIENCE_JOURNEY_ID,
} from '../../features/onboarding/domain/entities/journey.entity';
import enUS from '../../core/localization/translations/en-US.json';
import hiIN from '../../core/localization/translations/hi-IN.json';

jest.mock('../../core/theme/useClinicTheme', () => ({
  useClinicTheme: () => ({
    colors: {
      primary: { default: '#primary' },
      surface: { muted: '#muted' },
      border: { default: '#border', subtle: '#subtle' },
      text: { primary: '#primary-text', secondary: '#secondary-text' },
    },
    spacing: { xs: 4, sm: 8, md: 16, lg: 24 },
    typography: {
      h5: { fontSize: 18 },
      h6: { fontSize: 16 },
      body1: { fontSize: 16 },
      body2: { fontSize: 14 },
    },
  }),
}));

jest.mock('../../features/onboarding/presentation/components/StepCard', () => ({
  StepCard: ({ journeyCard, onPress }: any) => {
    const React = require('react');
    const { Text, TouchableOpacity } = require('react-native');
    return (
      <TouchableOpacity
        testID={`surface-card-${journeyCard.stepCode}`}
        onPress={onPress}
        disabled={!journeyCard.isActionable}
      >
        <Text>{journeyCard.stepCode}</Text>
      </TouchableOpacity>
    );
  },
}));

const card = (stepCode: string, status: JourneyCardModel['status']): JourneyCardModel => ({
  cardId: `card.${stepCode}`,
  stepCode,
  stageId: 'review_and_personalize',
  titleKey: 'onboarding.progressiveExperience.stepLabels.clinicProfile',
  descriptionKey: 'onboarding.progressiveExperience.journeyCard.description',
  actionLabelKey: 'onboarding.progressiveExperience.journeyCard.action',
  destination: { kind: 'wizard_step', stepCode },
  iconToken: 'business-outline',
  status,
  isEligible: true,
  isVisible: true,
  isActionable: status !== 'blocked',
  order: 0,
});

const journey = (overrides: Partial<JourneyViewModel> = {}): JourneyViewModel => ({
  identity: {
    journeyId: PROGRESSIVE_EXPERIENCE_JOURNEY_ID,
    journeyVersion: { major: 1, minor: 0, patch: 0 },
    tenantId: 'tenant-a',
  },
  cards: [card('clinic_profile', 'in_progress')],
  progress: { completed: 0, total: 1 },
  diagnostics: {
    unknownStepCodes: [],
    missingValidationStepCodes: [],
    duplicateStepCodes: [],
    invalidDefinitionStepCodes: [],
  },
  availability: 'available',
  ...overrides,
});

describe('JourneySurface', () => {
  it('fails closed with localized unavailable state and no actionable cards', () => {
    const { getByRole, getByText, queryByTestId } = render(
      <JourneySurface
        journey={journey({ availability: 'unsupported_version' })}
        onSelectStep={jest.fn()}
      />
    );

    expect(getByRole('header')).toHaveTextContent('Your clinic preparation journey');
    expect(getByRole('alert')).toBeTruthy();
    expect(getByText(/This journey version is not available/)).toBeTruthy();
    expect(queryByTestId('surface-card-clinic_profile')).toBeNull();
  });

  it('shows an explicit empty state without presenting completion progress', () => {
    const { getByRole, getByText, queryByRole } = render(
      <JourneySurface
        journey={journey({ cards: [], progress: { completed: 0, total: 0 } })}
        onSelectStep={jest.fn()}
      />
    );

    expect(getByRole('summary')).toBeTruthy();
    expect(getByText(/No supported journey steps are available yet/)).toBeTruthy();
    expect(queryByRole('progressbar')).toBeNull();
  });

  it('presents aggregate domain progress with accessible textual meaning', () => {
    const cards = [
      card('clinic_profile', 'complete'),
      { ...card('staff_setup', 'in_progress'), order: 1 },
    ];
    const { getByRole, getByText } = render(
      <JourneySurface
        journey={journey({ cards, progress: { completed: 1, total: 2 } })}
        onSelectStep={jest.fn()}
      />
    );

    expect(getByText('1 of 2 journey steps complete')).toBeTruthy();
    const progressbar = getByRole('progressbar');
    expect(progressbar.props.accessibilityLabel).toBe('1 of 2 journey steps complete');
    expect(progressbar.props.accessibilityValue).toEqual({ min: 0, max: 100, now: 50 });
  });

  it('preserves card order and delegates only the existing step destination', () => {
    const onSelectStep = jest.fn();
    const cards = [
      card('staff_setup', 'in_progress'),
      { ...card('clinic_profile', 'not_started'), order: 1 },
    ];
    const { getAllByTestId, getByTestId } = render(
      <JourneySurface
        journey={journey({ cards, progress: { completed: 0, total: 2 } })}
        onSelectStep={onSelectStep}
      />
    );

    expect(getAllByTestId(/^surface-card-/).map(item => item.props.testID)).toEqual([
      'surface-card-staff_setup',
      'surface-card-clinic_profile',
    ]);
    fireEvent.press(getByTestId('surface-card-clinic_profile'));
    expect(onSelectStep).toHaveBeenCalledWith('clinic_profile');
  });

  it('keeps English and Hindi journey keys and interpolation placeholders compatible', () => {
    const english = enUS.onboarding.progressiveExperience.journey;
    const hindi = hiIN.onboarding.progressiveExperience.journey;
    const placeholders = (value: string) => value.match(/{{[^}]+}}/g)?.sort() ?? [];

    expect(Object.keys(hindi).sort()).toEqual(Object.keys(english).sort());
    Object.keys(english).forEach(key => {
      const typedKey = key as keyof typeof english;
      expect(placeholders(hindi[typedKey])).toEqual(placeholders(english[typedKey]));
    });
  });
});
