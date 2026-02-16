/**
 * Create Treatment Sheet From Casesheet Use Case
 */

import { TreatmentSheetEntity } from '../entities/treatmentSheet.entity';
import { ITreatmentSheetsRepository, CreateTreatmentSheetParams } from '../repositories/treatmentSheets.repository';

export class CreateTreatmentSheetFromCasesheetUseCase {
  constructor(private repository: ITreatmentSheetsRepository) {}

  async execute(casesheetId: string, params: CreateTreatmentSheetParams): Promise<TreatmentSheetEntity> {
    if (!casesheetId) {
      throw new Error('Casesheet ID is required');
    }
    if (!params.clientId) {
      throw new Error('Client ID is required');
    }
    if (!params.rows || params.rows.length === 0) {
      throw new Error('At least one treatment row is required');
    }

    return this.repository.createFromCasesheet(casesheetId, params);
  }
}
