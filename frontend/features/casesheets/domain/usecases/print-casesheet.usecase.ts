/**
 * Print Casesheet Use Case
 * Generates printable content for a casesheet
 */

import { ICasesheetsRepository, PrintCasesheetResult } from '../repositories/casesheets.repository';

export class PrintCasesheetUseCase {
  constructor(private repository: ICasesheetsRepository) {}

  async execute(tenantId: string, casesheetId: string): Promise<PrintCasesheetResult> {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }
    if (!casesheetId) {
      throw new Error('Casesheet ID is required');
    }

    return this.repository.print(tenantId, casesheetId);
  }
}
