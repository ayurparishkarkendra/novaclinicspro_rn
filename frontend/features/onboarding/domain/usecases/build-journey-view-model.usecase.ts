import { OnboardingStatus, StepStatus } from '../entities/onboarding-status.entity';
import {
  isSupportedJourneyVersion,
  JourneyCardDefinition,
  JourneyCardModel,
  JourneyCardStatus,
  JourneyDefinition,
  JourneyDiagnostics,
  JourneyViewModel,
} from '../entities/journey.entity';

const createDiagnostics = (): {
  unknownStepCodes: string[];
  missingValidationStepCodes: string[];
  duplicateStepCodes: string[];
  invalidDefinitionStepCodes: string[];
} => ({
  unknownStepCodes: [],
  missingValidationStepCodes: [],
  duplicateStepCodes: [],
  invalidDefinitionStepCodes: [],
});

const isValidDefinition = (
  stepCode: string,
  definition: JourneyCardDefinition
): boolean =>
  definition.cardId.trim().length > 0 &&
  definition.stepCode === stepCode &&
  definition.stageId.trim().length > 0 &&
  definition.titleKey.trim().length > 0 &&
  definition.descriptionKey.trim().length > 0 &&
  definition.actionLabelKey.trim().length > 0 &&
  definition.iconToken.trim().length > 0 &&
  definition.destination.kind === 'wizard_step' &&
  definition.destination.stepCode === stepCode;

const mapStatus = (step: StepStatus | undefined): JourneyCardStatus => {
  if (!step) {
    return 'not_started';
  }

  switch (step.status) {
    case 'completed':
      return 'complete';
    case 'in_progress':
      return 'in_progress';
    case 'blocked':
      return 'blocked';
    case 'not_started':
    default:
      return 'not_started';
  }
};

const freezeDiagnostics = (diagnostics: ReturnType<typeof createDiagnostics>): JourneyDiagnostics => ({
  unknownStepCodes: diagnostics.unknownStepCodes,
  missingValidationStepCodes: diagnostics.missingValidationStepCodes,
  duplicateStepCodes: diagnostics.duplicateStepCodes,
  invalidDefinitionStepCodes: diagnostics.invalidDefinitionStepCodes,
});

export const buildJourneyViewModel = (
  definition: JourneyDefinition,
  status: OnboardingStatus
): JourneyViewModel => {
  const identity = {
    journeyId: definition.id,
    journeyVersion: definition.version,
    tenantId: status.tenantId,
  };
  const diagnostics = createDiagnostics();

  if (!isSupportedJourneyVersion(definition.version)) {
    return {
      identity,
      cards: [],
      progress: { completed: 0, total: 0 },
      diagnostics: freezeDiagnostics(diagnostics),
      availability: 'unsupported_version',
    };
  }

  const seenStepCodes = new Set<string>();
  const cards: JourneyCardModel[] = [];

  status.visibleSteps.forEach((stepCode) => {
    if (seenStepCodes.has(stepCode)) {
      diagnostics.duplicateStepCodes.push(stepCode);
      return;
    }

    seenStepCodes.add(stepCode);
    const cardDefinition = definition.stepMappings[stepCode];

    if (!cardDefinition) {
      diagnostics.unknownStepCodes.push(stepCode);
      return;
    }

    if (!isValidDefinition(stepCode, cardDefinition)) {
      diagnostics.invalidDefinitionStepCodes.push(stepCode);
      return;
    }

    const step = status.steps.get(stepCode);

    if (!step) {
      diagnostics.missingValidationStepCodes.push(stepCode);
    }

    cards.push({
      ...cardDefinition,
      status: mapStatus(step),
      isEligible: true as const,
      isVisible: true as const,
      isActionable: step?.isActionable ?? false,
      order: cards.length,
    });
  });

  return {
    identity,
    cards,
    progress: {
      completed: cards.filter((card) => card.status === 'complete').length,
      total: cards.length,
    },
    diagnostics: freezeDiagnostics(diagnostics),
    availability: 'available',
  };
};
