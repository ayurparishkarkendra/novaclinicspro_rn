/**
 * Share Prescription Use Case
 */

import { PrescriptionEntity, canSharePrescription, ShareChannel } from '../entities/prescription.entity';
import { IPrescriptionsRepository, SharePrescriptionParams, SharePrescriptionResult } from '../repositories/prescriptions.repository';

export class SharePrescriptionUseCase {
  constructor(private repository: IPrescriptionsRepository) {}

  async execute(
    tenantId: string,
    prescriptionId: string,
    params: SharePrescriptionParams,
    currentPrescription?: PrescriptionEntity
  ): Promise<SharePrescriptionResult> {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }
    if (!prescriptionId) {
      throw new Error('Prescription ID is required');
    }
    if (!params.channel) {
      throw new Error('Share channel is required');
    }

    if (currentPrescription && !canSharePrescription(currentPrescription)) {
      throw new Error('Only signed prescriptions can be shared');
    }

    // Validate channel-specific requirements
    if (params.channel === 'Email' && !params.recipientEmail) {
      // Email will use client's email if not provided
    }
    if ((params.channel === 'SMS' || params.channel === 'WhatsApp') && !params.recipientPhone) {
      // Phone will use client's phone if not provided
    }

    return this.repository.share(tenantId, prescriptionId, params);
  }
}
