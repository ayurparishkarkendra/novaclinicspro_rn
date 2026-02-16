/**
 * Get Prescription Use Case
 */

import { PrescriptionEntity } from '../entities/prescription.entity';
import { IPrescriptionsRepository } from '../repositories/prescriptions.repository';

export class GetPrescriptionUseCase {
  constructor(private repository: IPrescriptionsRepository) {}

  async execute(tenantId: string, prescriptionId: string): Promise<PrescriptionEntity> {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }
    if (!prescriptionId) {
      throw new Error('Prescription ID is required');
    }
    return this.repository.getById(tenantId, prescriptionId);
  }
}
