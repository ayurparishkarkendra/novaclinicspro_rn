/**
 * Delete Prescription Use Case
 */

import { IPrescriptionsRepository } from '../repositories/prescriptions.repository';

export class DeletePrescriptionUseCase {
  constructor(private repository: IPrescriptionsRepository) {}

  async execute(tenantId: string, prescriptionId: string): Promise<void> {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }
    if (!prescriptionId) {
      throw new Error('Prescription ID is required');
    }

    return this.repository.delete(tenantId, prescriptionId);
  }
}
