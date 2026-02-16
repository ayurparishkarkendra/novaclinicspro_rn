/**
 * Update Treatment Sheet Row Use Case
 */

import { TreatmentSheetEntity } from '../entities/treatmentSheet.entity';
import { ITreatmentSheetsRepository, UpdateTreatmentSheetRowParams } from '../repositories/treatmentSheets.repository';

export class UpdateTreatmentSheetRowUseCase {
  constructor(private repository: ITreatmentSheetsRepository) {}

  async execute(rowId: string, params: UpdateTreatmentSheetRowParams): Promise<TreatmentSheetEntity> {
    if (!rowId) {
      throw new Error('Row ID is required');
    }

    return this.repository.updateRow(rowId, params);
  }
}
