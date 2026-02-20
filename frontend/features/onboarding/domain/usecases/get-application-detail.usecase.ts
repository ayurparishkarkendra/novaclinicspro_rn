/**
 * Get Application Detail Use Case
 * Retrieves detailed information about a clinic application
 */

import { IOnboardingRepository } from '../repositories/onboarding.repository';
import { ApplicationDetailResponse } from '../../data/models/onboarding.dtos';

export interface GetApplicationDetailResult {
  success: boolean;
  application?: ApplicationDetailResponse;
  error?: string;
}

export class GetApplicationDetailUseCase {
  constructor(private repository: IOnboardingRepository) {}

  async execute(applicationId: string): Promise<GetApplicationDetailResult> {
    try {
      if (!applicationId || applicationId.trim() === '') {
        return {
          success: false,
          error: 'Application ID is required',
        };
      }

      const application = await this.repository.getApplicationDetail(applicationId);

      if (!application) {
        return {
          success: false,
          error: 'Application not found',
        };
      }

      return {
        success: true,
        application,
      };
    } catch (error) {
      console.error('[GetApplicationDetailUseCase] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch application details',
      };
    }
  }
}
