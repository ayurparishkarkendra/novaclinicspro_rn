/**
 * Sync Treatment Sheet Use Case
 */

import { ITreatmentSheetsRepository, SyncTreatmentSheetResult } from '../repositories/treatmentSheets.repository';

export class SyncTreatmentSheetUseCase {
  constructor(private repository: ITreatmentSheetsRepository) {}

  async execute(treatmentSheetId: string): Promise<SyncTreatmentSheetResult> {
    if (!treatmentSheetId) {
      throw new Error('Treatment Sheet ID is required');
    }

    return this.repository.sync(treatmentSheetId);
  }
}
