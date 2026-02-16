/**
 * List Prescriptions Use Case
 */

import { IPrescriptionsRepository, ListPrescriptionsParams, PrescriptionsListResult } from '../repositories/prescriptions.repository';

export class ListPrescriptionsUseCase {
  constructor(private repository: IPrescriptionsRepository) {}

  async execute(tenantId: string, params?: ListPrescriptionsParams): Promise<PrescriptionsListResult> {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }
    return this.repository.list(tenantId, params);
  }
}
