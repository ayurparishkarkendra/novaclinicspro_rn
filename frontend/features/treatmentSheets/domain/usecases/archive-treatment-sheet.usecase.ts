/**
 * Archive Treatment Sheet Use Case
 */

import { TreatmentSheetEntity, canArchiveTreatmentSheet } from '../entities/treatmentSheet.entity';
import { ITreatmentSheetsRepository } from '../repositories/treatmentSheets.repository';

export class ArchiveTreatmentSheetUseCase {
  constructor(private repository: ITreatmentSheetsRepository) {}

  async execute(treatmentSheetId: string, currentTreatmentSheet?: TreatmentSheetEntity): Promise<void> {
    if (!treatmentSheetId) {
      throw new Error('Treatment Sheet ID is required');
    }

    if (currentTreatmentSheet && !canArchiveTreatmentSheet(currentTreatmentSheet)) {
      throw new Error('Signed treatment sheets cannot be archived');
    }

    return this.repository.archive(treatmentSheetId);
  }
}
