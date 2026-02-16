/**
 * Prescriptions Feature Exports
 */

// Data Layer (primary source of DTOs)
export * from './data/models/prescriptions.dtos';
export * from './data/repositories/prescriptions.repository.impl';

// Domain Layer (entity helpers - avoid re-exporting types already in DTOs)
export {
  PrescriptionEntity,
  canEditPrescription,
  canSharePrescription,
  canRepeatPrescription,
  getAllowedPrescriptionTransitions,
  getPrescriptionStatusInfo,
  formatMedicationDisplay,
} from './domain/entities/prescription.entity';

export type {
  IPrescriptionsRepository,
  PrescriptionsListResult,
  CreatePrescriptionParams,
  UpdatePrescriptionParams,
  SharePrescriptionParams,
  SharePrescriptionResult,
} from './domain/repositories/prescriptions.repository';

export * from './domain/usecases';

// Presentation Layer
export * from './presentation/components';
export * from './presentation/pages';
