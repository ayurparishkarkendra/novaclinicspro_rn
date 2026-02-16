/**
 * Create Casesheet Use Case
 * Creates a new casesheet for a client
 */

import { CasesheetEntity, CasesheetData } from '../entities/casesheet.entity';
import { ICasesheetsRepository, CreateCasesheetParams } from '../repositories/casesheets.repository';

export interface CreateCasesheetInput {
  clinicType: string;
  dataJson: CasesheetData;
  templateId?: string;
  appointmentId?: string;
  encounterId?: string;
}

export class CreateCasesheetUseCase {
  constructor(private repository: ICasesheetsRepository) {}

  async execute(
    tenantId: string,
    clientId: string,
    input: CreateCasesheetInput
  ): Promise<CasesheetEntity> {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }
    if (!clientId) {
      throw new Error('Client ID is required');
    }
    if (!input.clinicType) {
      throw new Error('Clinic type is required');
    }
    if (!input.dataJson) {
      throw new Error('Casesheet data is required');
    }

    const params: CreateCasesheetParams = {
      clinicType: input.clinicType,
      dataJson: input.dataJson,
      templateId: input.templateId,
      appointmentId: input.appointmentId,
      encounterId: input.encounterId,
    };

    return this.repository.create(tenantId, clientId, params);
  }
}
