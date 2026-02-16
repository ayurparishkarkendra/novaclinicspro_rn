/**
 * List Casesheets Use Case
 * Retrieves paginated list of casesheets for a client
 */

import { ICasesheetsRepository, ListCasesheetsParams, CasesheetsListResult } from '../repositories/casesheets.repository';

export class ListCasesheetsUseCase {
  constructor(private repository: ICasesheetsRepository) {}

  async execute(
    tenantId: string,
    clientId: string,
    params?: ListCasesheetsParams
  ): Promise<CasesheetsListResult> {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }
    if (!clientId) {
      throw new Error('Client ID is required');
    }

    return this.repository.list(tenantId, clientId, params);
  }
}
