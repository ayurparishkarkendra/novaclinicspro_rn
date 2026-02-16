/**
 * Transition Casesheet Status Use Case
 * Transitions casesheet status (DRAFT → FINAL → SIGNED)
 */

import { CasesheetEntity, CasesheetStatus, getAllowedCasesheetTransitions } from '../entities/casesheet.entity';
import { ICasesheetsRepository } from '../repositories/casesheets.repository';

export class TransitionCasesheetStatusUseCase {
  constructor(private repository: ICasesheetsRepository) {}

  async execute(
    tenantId: string,
    casesheetId: string,
    newStatus: CasesheetStatus,
    currentCasesheet?: CasesheetEntity
  ): Promise<CasesheetEntity> {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }
    if (!casesheetId) {
      throw new Error('Casesheet ID is required');
    }
    if (!newStatus) {
      throw new Error('New status is required');
    }

    // Validate transition if current casesheet is provided
    if (currentCasesheet) {
      const allowedTransitions = getAllowedCasesheetTransitions(currentCasesheet.status);
      if (!allowedTransitions.includes(newStatus)) {
        throw new Error(
          `Cannot transition from ${currentCasesheet.status} to ${newStatus}. ` +
          `Allowed transitions: ${allowedTransitions.join(', ') || 'none'}`
        );
      }
    }

    return this.repository.transitionStatus(tenantId, casesheetId, { status: newStatus });
  }
}
