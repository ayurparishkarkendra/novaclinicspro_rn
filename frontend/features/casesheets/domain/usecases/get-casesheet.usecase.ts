/**
 * Get Casesheet Use Case
 * Retrieves a single casesheet by ID
 */

import { CasesheetEntity } from '../entities/casesheet.entity';
import { ICasesheetsRepository } from '../repositories/casesheets.repository';

export class GetCasesheetUseCase {
  constructor(private repository: ICasesheetsRepository) {}

  async execute(tenantId: string, casesheetId: string): Promise<CasesheetEntity> {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }
    if (!casesheetId) {
      throw new Error('Casesheet ID is required');
    }

    return this.repository.getById(tenantId, casesheetId);
  }
}
