/**
 * Casesheets Feature Exports
 */

// Data Layer (primary source of DTOs)
export * from './data/models/casesheets.dtos';
export * from './data/repositories/casesheets.repository.impl';

// Domain Layer (entity helpers - avoid re-exporting types already in DTOs)
export {
  CasesheetEntity,
  CasesheetDataBasic,
  CasesheetExtension,
  CasesheetData,
  canEditCasesheet,
  getAllowedCasesheetTransitions,
  canArchiveCasesheet,
  getCasesheetStatusInfo,
} from './domain/entities/casesheet.entity';

export type {
  ICasesheetsRepository,
  CasesheetsListResult,
  CreateCasesheetParams,
  UpdateCasesheetParams,
  TransitionStatusParams as CasesheetTransitionParams,
  PrintCasesheetResult,
} from './domain/repositories/casesheets.repository';

export * from './domain/usecases';

// Presentation Layer
export * from './presentation/components';
export * from './presentation/pages';
