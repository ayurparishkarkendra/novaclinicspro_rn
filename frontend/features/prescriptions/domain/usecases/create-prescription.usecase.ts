/**
 * Create Prescription Use Case
 */

import { PrescriptionEntity, PrescriptionData } from '../entities/prescription.entity';
import { IPrescriptionsRepository, CreatePrescriptionParams } from '../repositories/prescriptions.repository';

export interface CreatePrescriptionInput {
  clientId: string;
  prescriptionData: PrescriptionData;
  appointmentId?: string;
  issuedByStaffId?: string;
  notes?: string;
  nextVisitDays?: number;
  sourceDocumentId?: string;
  sourceDocumentType?: string;
  repeatPreviousPrescriptionId?: string;
}

export class CreatePrescriptionUseCase {
  constructor(private repository: IPrescriptionsRepository) {}

  async execute(tenantId: string, input: CreatePrescriptionInput): Promise<PrescriptionEntity> {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }
    if (!input.clientId) {
      throw new Error('Client ID is required');
    }
    if (!input.prescriptionData || !input.prescriptionData.medications?.length) {
      throw new Error('At least one medication is required');
    }

    return this.repository.create(tenantId, input);
  }
}
