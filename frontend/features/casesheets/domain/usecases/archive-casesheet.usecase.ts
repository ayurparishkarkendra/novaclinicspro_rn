/**
 * Archive Casesheet Use Case
 * Archives (soft deletes) a casesheet
 */

import { CasesheetEntity, canArchiveCasesheet } from '../entities/casesheet.entity';
import { ICasesheetsRepository } from '../repositories/casesheets.repository';

export class ArchiveCasesheetUseCase {
  constructor(private repository: ICasesheetsRepository) {}

  async execute(
    tenantId: string,
    casesheetId: string,
    currentCasesheet?: CasesheetEntity
  ): Promise<void> {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }
    if (!casesheetId) {
      throw new Error('Casesheet ID is required');
    }

    // Validate archivability if current casesheet is provided
    if (currentCasesheet && !canArchiveCasesheet(currentCasesheet)) {
      throw new Error('Signed casesheets cannot be archived');
    }

    return this.repository.archive(tenantId, casesheetId);
  }
}
