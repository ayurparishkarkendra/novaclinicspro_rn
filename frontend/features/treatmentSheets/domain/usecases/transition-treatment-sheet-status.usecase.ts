/**
 * Transition Treatment Sheet Status Use Case
 */

import { TreatmentSheetEntity, TreatmentSheetStatus, getAllowedTreatmentSheetTransitions } from '../entities/treatmentSheet.entity';
import { ITreatmentSheetsRepository } from '../repositories/treatmentSheets.repository';

export class TransitionTreatmentSheetStatusUseCase {
  constructor(private repository: ITreatmentSheetsRepository) {}

  async execute(
    treatmentSheetId: string,
    newStatus: TreatmentSheetStatus,
    currentTreatmentSheet?: TreatmentSheetEntity
  ): Promise<TreatmentSheetEntity> {
    if (!treatmentSheetId) {
      throw new Error('Treatment Sheet ID is required');
    }
    if (!newStatus) {
      throw new Error('New status is required');
    }

    if (currentTreatmentSheet) {
      const allowedTransitions = getAllowedTreatmentSheetTransitions(currentTreatmentSheet.status);
      if (!allowedTransitions.includes(newStatus)) {
        throw new Error(
          `Cannot transition from ${currentTreatmentSheet.status} to ${newStatus}. ` +
          `Allowed transitions: ${allowedTransitions.join(', ') || 'none'}`
        );
      }
    }

    return this.repository.transitionStatus(treatmentSheetId, { status: newStatus });
  }
}
