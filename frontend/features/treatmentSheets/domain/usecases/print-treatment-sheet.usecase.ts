/**
 * Print Treatment Sheet Use Case
 */

import { ITreatmentSheetsRepository, PrintTreatmentSheetResult } from '../repositories/treatmentSheets.repository';

export class PrintTreatmentSheetUseCase {
  constructor(private repository: ITreatmentSheetsRepository) {}

  async execute(treatmentSheetId: string): Promise<PrintTreatmentSheetResult> {
    if (!treatmentSheetId) {
      throw new Error('Treatment Sheet ID is required');
    }

    return this.repository.print(treatmentSheetId);
  }
}
