/**
 * Create Treatment Sheet Use Case
 */

import { TreatmentSheetEntity } from '../entities/treatmentSheet.entity';
import { ITreatmentSheetsRepository, CreateTreatmentSheetParams } from '../repositories/treatmentSheets.repository';

export class CreateTreatmentSheetUseCase {
  constructor(private repository: ITreatmentSheetsRepository) {}

  async execute(tenantId: string, params: CreateTreatmentSheetParams): Promise<TreatmentSheetEntity> {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }
    if (!params.clientId) {
      throw new Error('Client ID is required');
    }
    if (!params.rows || params.rows.length === 0) {
      throw new Error('At least one treatment row is required');
    }

    return this.repository.create(tenantId, params);
  }
}
