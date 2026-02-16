/**
 * Update Casesheet Use Case
 * Updates an existing casesheet (DRAFT or SIGNED by DOCTOR)
 */

import { CasesheetEntity, CasesheetData, canEditCasesheet } from '../entities/casesheet.entity';
import { ICasesheetsRepository } from '../repositories/casesheets.repository';

export interface UpdateCasesheetInput {
  dataJson: CasesheetData;
}

export class UpdateCasesheetUseCase {
  constructor(private repository: ICasesheetsRepository) {}

  async execute(
    tenantId: string,
    casesheetId: string,
    input: UpdateCasesheetInput,
    currentCasesheet?: CasesheetEntity,
    isDoctor: boolean = false
  ): Promise<CasesheetEntity> {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }
    if (!casesheetId) {
      throw new Error('Casesheet ID is required');
    }
    if (!input.dataJson) {
      throw new Error('Casesheet data is required');
    }

    // Validate editability if current casesheet is provided
    if (currentCasesheet && !canEditCasesheet(currentCasesheet, isDoctor)) {
      throw new Error(
        currentCasesheet.status === 'FINAL'
          ? 'Final casesheets cannot be edited'
          : 'Only doctors can edit signed casesheets'
      );
    }

    return this.repository.update(tenantId, casesheetId, {
      dataJson: input.dataJson,
    });
  }
}
