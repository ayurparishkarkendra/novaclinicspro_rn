export const PROGRESSIVE_EXPERIENCE_JOURNEY_ID = 'progressive-experience' as const;
export const SUPPORTED_JOURNEY_MAJOR_VERSION = 1;

export type JourneyId = typeof PROGRESSIVE_EXPERIENCE_JOURNEY_ID;

export interface JourneyVersion {
  major: number;
  minor: number;
  patch: number;
}

export const PROGRESSIVE_EXPERIENCE_JOURNEY_VERSION: JourneyVersion = Object.freeze({
  major: 1,
  minor: 0,
  patch: 0,
});

export interface JourneyRuntimeIdentity {
  journeyId: JourneyId;
  journeyVersion: JourneyVersion;
  tenantId: string;
}

export interface ExistingJourneyDestination {
  kind: 'wizard_step';
  stepCode: string;
}

export type ExistingThemeIconToken = string;

export interface JourneyCardDefinition {
  cardId: string;
  stepCode: string;
  stageId: string;
  titleKey: string;
  descriptionKey: string;
  actionLabelKey: string;
  destination: ExistingJourneyDestination;
  iconToken: ExistingThemeIconToken;
}

export interface JourneyDefinition {
  id: JourneyId;
  version: JourneyVersion;
  stepMappings: Readonly<Record<string, JourneyCardDefinition>>;
}

export type JourneyCardStatus =
  | 'not_started'
  | 'in_progress'
  | 'complete'
  | 'blocked'
  | 'unavailable';

export interface JourneyCardModel extends JourneyCardDefinition {
  status: JourneyCardStatus;
  isEligible: true;
  isVisible: true;
  isActionable: boolean;
  order: number;
}

export interface JourneyProgress {
  completed: number;
  total: number;
}

export interface JourneyDiagnostics {
  unknownStepCodes: ReadonlyArray<string>;
  missingValidationStepCodes: ReadonlyArray<string>;
  duplicateStepCodes: ReadonlyArray<string>;
  invalidDefinitionStepCodes: ReadonlyArray<string>;
}

export interface JourneyViewModel {
  identity: JourneyRuntimeIdentity;
  cards: ReadonlyArray<JourneyCardModel>;
  progress: JourneyProgress;
  diagnostics: JourneyDiagnostics;
  availability: 'available' | 'unsupported_version';
}

const JOURNEY_VERSION_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

export const parseJourneyVersion = (value: string): JourneyVersion | null => {
  const match = JOURNEY_VERSION_PATTERN.exec(value);

  if (!match) {
    return null;
  }

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
};

export const formatJourneyVersion = (version: JourneyVersion): string =>
  `${version.major}.${version.minor}.${version.patch}`;

export const isSupportedJourneyVersion = (version: JourneyVersion): boolean =>
  version.major === SUPPORTED_JOURNEY_MAJOR_VERSION;
