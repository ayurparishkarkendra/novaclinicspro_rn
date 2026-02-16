/**
 * Repeat Prescription Use Case
 * Creates a new prescription based on a previous one
 */

import { PrescriptionEntity, canRepeatPrescription } from '../entities/prescription.entity';
import { IPrescriptionsRepository, CreatePrescriptionParams } from '../repositories/prescriptions.repository';

export class RepeatPrescriptionUseCase {
  constructor(private repository: IPrescriptionsRepository) {}

  async execute(
    tenantId: string,
    sourcePrescription: PrescriptionEntity
  ): Promise<PrescriptionEntity> {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }
    if (!sourcePrescription) {
      throw new Error('Source prescription is required');
    }
    if (!canRepeatPrescription(sourcePrescription)) {
      throw new Error('This prescription cannot be repeated');
    }

    const params: CreatePrescriptionParams = {
      clientId: sourcePrescription.clientId,
      prescriptionData: { ...sourcePrescription.prescriptionData },
      notes: sourcePrescription.notes || undefined,
      nextVisitDays: sourcePrescription.nextVisitDays || undefined,
      repeatPreviousPrescriptionId: sourcePrescription.id,
    };

    return this.repository.create(tenantId, params);
  }
}
