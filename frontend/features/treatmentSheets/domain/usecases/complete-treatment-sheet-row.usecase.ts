/**
 * Complete Treatment Sheet Row Use Case
 */

import { TreatmentSheetEntity } from '../entities/treatmentSheet.entity';
import { ITreatmentSheetsRepository, CompleteTreatmentSheetRowParams } from '../repositories/treatmentSheets.repository';

export class CompleteTreatmentSheetRowUseCase {
  constructor(private repository: ITreatmentSheetsRepository) {}

  async execute(rowId: string, params?: CompleteTreatmentSheetRowParams): Promise<TreatmentSheetEntity> {
    if (!rowId) {
      throw new Error('Row ID is required');
    }

    return this.repository.completeRow(rowId, params || {});
  }
}
