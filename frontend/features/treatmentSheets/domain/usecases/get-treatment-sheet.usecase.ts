/**
 * Get Treatment Sheet Use Case
 */

import { TreatmentSheetEntity } from '../entities/treatmentSheet.entity';
import { ITreatmentSheetsRepository } from '../repositories/treatmentSheets.repository';

export class GetTreatmentSheetUseCase {
  constructor(private repository: ITreatmentSheetsRepository) {}

  async execute(treatmentSheetId: string): Promise<TreatmentSheetEntity> {
    if (!treatmentSheetId) {
      throw new Error('Treatment Sheet ID is required');
    }
    return this.repository.getById(treatmentSheetId);
  }
}
