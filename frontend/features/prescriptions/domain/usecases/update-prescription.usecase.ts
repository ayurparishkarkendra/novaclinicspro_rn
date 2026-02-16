/**
 * Update Prescription Use Case
 */

import { PrescriptionEntity, canEditPrescription } from '../entities/prescription.entity';
import { IPrescriptionsRepository, UpdatePrescriptionParams } from '../repositories/prescriptions.repository';

export class UpdatePrescriptionUseCase {
  constructor(private repository: IPrescriptionsRepository) {}

  async execute(
    tenantId: string,
    prescriptionId: string,
    params: UpdatePrescriptionParams,
    currentPrescription?: PrescriptionEntity,
    isDoctor: boolean = false
  ): Promise<PrescriptionEntity> {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }
    if (!prescriptionId) {
      throw new Error('Prescription ID is required');
    }

    if (currentPrescription && !canEditPrescription(currentPrescription, isDoctor)) {
      throw new Error(
        currentPrescription.status === 'FINAL'
          ? 'Final prescriptions cannot be edited'
          : 'Only doctors can edit signed prescriptions'
      );
    }

    return this.repository.update(tenantId, prescriptionId, params);
  }
}
